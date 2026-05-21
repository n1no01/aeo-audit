"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { supabase } from "./lib/supabase";
import { formatUrl } from "./lib/utils";
import { scrapeWebsite } from "./lib/scraper";
import { calculateScore } from "./lib/scorer";
import { generateAiAnalysis } from "./lib/gemini";
import { ScrapedData, AuditData } from "./lib/types";
import { PostgrestError } from "@supabase/supabase-js"; // ✅ Bezbjedna tipizacija Supabase grešaka

export async function analyzeUrl(formData: FormData) {
  // 🛡️ 1. SIGURNA VALIDACIJA INPUTA
  const rawUrlInput = formData.get("url");
  if (!rawUrlInput || typeof rawUrlInput !== "string") {
    return { error: "Please enter a valid target domain or URL." };
  }

  const url = formatUrl(rawUrlInput);
  if (!url) return { error: "Invalid URL format." };

  const SCRAPING_API_KEY = process.env.SCRAPING_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!SCRAPING_API_KEY || !GEMINI_API_KEY) {
    return { error: "Missing API configuration keys." };
  }

  // 🔒 2. CLERK AUTENTIFIKACIJA
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) {
    return { error: "You must be logged in to analyze a URL." };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  let userPlan = "FREE";
  let userLimit = 1;
  let currentUsedAudits = 0;

  try {
    // 👥 3. LAZY SINHRONIZACIJA KORISNIKA U SUPABASE
    let { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!dbUser) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([{ id: userId, email: email, plan: "FREE", audit_limit: 1, used_audits: 0 }])
        .select()
        .single();
      
      if (insertError) {
        console.error("Supabase user insert error:", insertError);
        return { error: "Failed to initialize user profile in database." };
      }
      
      dbUser = newUser;
    }

    userPlan = dbUser.plan;
    userLimit = dbUser.audit_limit;
    currentUsedAudits = dbUser.used_audits || 0; 

    // 🕒 4. PROVJERA LIMITA
    if (currentUsedAudits >= userLimit) {
      const stats = { plan: userPlan, limit: userLimit, used: currentUsedAudits };
      return { 
        error: userPlan === "FREE" 
          ? "You have exhausted your single free audit. Upgrade your plan for more audits!"
          : `You have exceeded your monthly limit for the ${userPlan} plan (${userLimit} monthly). Upgrade your plan for more flexibility!`,
        userStats: stats
      };
    }

    // 🚀 5. LOGIKA ZA SKREJPOVANJE I GEMINI AI
    let auditOutputData;
    try {
      const scrapedResult = await scrapeWebsite(url, SCRAPING_API_KEY) as ScrapedData;
      const score = calculateScore(scrapedResult);
      const aiData = await generateAiAnalysis(scrapedResult, score, url, GEMINI_API_KEY);

      auditOutputData = {
        ...scrapedResult,
        score: aiData.score || score,
        pageCategory: aiData.pageCategory || "Uncategorized",
        aiAnalysis: aiData.aiAnalysis || "No analysis provided.",
        recommendations: aiData.recommendations || [],
        bluffScore: aiData.bluffScore || 5,
        atomicStructureScore: aiData.atomicStructureScore || 5,
        entityDensityScore: aiData.entityDensityScore || 5,
        sentenceSimplicityScore: aiData.sentenceSimplicityScore || 5,
      };
    } catch (apiError) {
      console.error("External API Error (Scraper/Gemini):", apiError);
      return { 
        error: "Failed to scrape or analyze the website. Please check the URL and try again.",
        userStats: { plan: userPlan, limit: userLimit, used: currentUsedAudits }
      };
    }

    // 💾 6. UPIS REZULTATA AUDITA + SELEKTOVANJE GENERISANOG ID-ja
    const { data: insertedAudit, error: auditInsertError } = await supabase
      .from("audits")
      .insert([
        {
          user_id: userId,
          website_url: url,
          result_data: auditOutputData,
        },
      ])
      .select("id") // ✅ Povlačimo int8 ID iz baze podataka
      .single();

    if (auditInsertError) {
      console.error("Supabase audit insert error:", auditInsertError);
      return { 
        error: "Failed to save audit results to database.",
        userStats: { plan: userPlan, limit: userLimit, used: currentUsedAudits }
      };
    }

    // ⚡ 7. ATOMSKO UVEĆAVANJE KREDITA (Koristi tvoju RPC funkciju)
    const { data: updatedUsers, error: rpcError } = await supabase.rpc("increment_used_audits", {
      row_id: userId,
    });

    if (rpcError) {
      console.error("Supabase RPC increment error:", rpcError);
    }

    // Uzimamo svježi 'used_audits' direktno iz baze
    const finalUsedCount = updatedUsers && updatedUsers[0] 
      ? updatedUsers[0].used_audits 
      : currentUsedAudits + 1;

    return {
      success: true,
      auditId: insertedAudit?.id?.toString(), // ✅ Pretvaramo int8 u string radi lakše manipulacije na frontendu
      data: auditOutputData,
      userStats: {
        plan: userPlan,
        limit: userLimit,
        used: finalUsedCount
      }
    };

  } catch (error) {
    console.error("CRITICAL AUDIT ERROR CONTROL:", error);
    return { 
      error: "An unexpected system error occurred. Please try again later.",
      userStats: {
        plan: userPlan,
        limit: userLimit,
        used: currentUsedAudits
      }
    };
  }
}

export async function getUserStats() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!dbUser) {
      return { plan: "FREE", limit: 1, used: 0 };
    }

    return {
      plan: dbUser.plan,
      limit: dbUser.audit_limit, 
      used: dbUser.used_audits || 0
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return null;
  }
}

// 🌐 JAVNA SERVER AKCIJA ZA UČITAVANJE DIJELJENIH IZVJEŠTAJA (Mapirana za int8)
export async function getSharedAudit(auditId: string) {
  if (!auditId) return { error: "Invalid report identifier." };
  // 🛡️ VALIDACIJA: Dozvoli prolaz samo ako su u pitanju čiste cifre (0-9)
  const isNumeric = /^\d+$/.test(auditId);
  if (!isNumeric) {
    console.warn(`⚠️ BLOKIRAN NEVALIDAN UPIT: Pokušan pristup sa ID-jem "${auditId}" koji nije broj.`);
    return { error: "This audit report was not found or has been deleted." };
  }
  try {
    const { data, error } = await supabase
      .rpc("get_public_audit_by_id", { target_id: auditId })
      .maybeSingle() as { 
        data: { website_url: string; result_data: AuditData; created_at: string } | null; 
        error: PostgrestError | null; 
      };

    if (error) {
      console.error("❌ Supabase BAZA PUKLA:", error.message);
      return { error: "Database communication failure." };
    }

    if (!data) {
      console.warn(`⚠️ PODATAK NIJE PRONAĐEN: Audit sa ID-jem "${auditId}" ne postoji u bazi ili je sakriven RLS-om.`);
      return { error: "This audit report was not found or has been deleted." };
    }

    return {
      success: true,
      url: data.website_url,
      createdAt: data.created_at,
      data: data.result_data
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Critical error in getSharedAudit:", errorMessage);
    return { error: "An error occurred while retrieving the shared report." };
  }
}