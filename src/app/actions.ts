"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { supabase } from "./lib/supabase";
import { formatUrl } from "./lib/utils";
import { scrapeWebsite } from "./lib/scraper";
import { calculateScore } from "./lib/scorer";
import { generateAiAnalysis } from "./lib/gemini";
import { ScrapedData } from "./lib/types";

export async function analyzeUrl(formData: FormData) {
  const rawUrlInput = formData.get("url") as string;
  const url = formatUrl(rawUrlInput);

  const SCRAPING_API_KEY = process.env.SCRAPING_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!url) return { error: "Please enter a valid target domain or URL." };
  if (!SCRAPING_API_KEY || !GEMINI_API_KEY) return { error: "Missing API configuration keys." };

  // ========================================================
  // 🔒 1. CLERK AUTENTIFIKACIJA
  // ========================================================
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
    // ========================================================
    // 👥 2. LAZY SINHRONIZACIJA KORISNIKA U SUPABASE
    // ========================================================
    let { data: dbUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!dbUser) {
      // Ako ne postoji, pravimo ga i uvodimo 'used_audits' kolonu koja kreće od 0
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
    // 🧠 Umjesto brojanja redova, direktno vučemo tačno stanje iz kolone koju kontroliše Webhook!
    currentUsedAudits = dbUser.used_audits || 0; 

    // ========================================================
    // 🕒 3. PROVJERA LIMITA
    // ========================================================
    if (currentUsedAudits >= userLimit) {
      const stats = { plan: userPlan, limit: userLimit, used: currentUsedAudits };
      
      if (userPlan === "FREE") {
        return { 
          error: "You have exhausted your single free audit. Upgrade your plan for more audits!",
          userStats: stats
        };
      } else {
        return { 
          error: `You have exceeded your monthly limit for the ${userPlan} plan (${userLimit} monthly). Upgrade your plan for more flexibility!`,
          userStats: stats
        };
      }
    }

    // ========================================================
    // 🚀 4. LOGIKA ZA SKREJPOVANJE I GEMINI AI VAĐENJE PODATAKA
    // ========================================================
    const scrapedResult = await scrapeWebsite(url, SCRAPING_API_KEY) as ScrapedData;
    const score = calculateScore(scrapedResult);
    const aiData = await generateAiAnalysis(scrapedResult, score, url, GEMINI_API_KEY);

    const auditOutputData = {
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

    // ========================================================
    // 💾 5. UPIS REZULTATA AUDITA I INKREMENTACIJA KREDITA
    // ========================================================
    
    // A. Sačuvaj izvještaj u tabelu 'audits'
    const { error: auditInsertError } = await supabase
      .from("audits")
      .insert([
        {
          user_id: userId,
          website_url: url,
          result_data: auditOutputData,
        },
      ]);

    if (auditInsertError) {
      console.error("Supabase audit insert error:", auditInsertError);
      return { 
        error: "Failed to save audit results to database.",
        userStats: { plan: userPlan, limit: userLimit, used: currentUsedAudits }
      };
    }

    // B. Uvećaj used_audits za 1 u tabeli 'users'
    const nextUsedCount = currentUsedAudits + 1;
    await supabase
      .from("users")
      .update({ used_audits: nextUsedCount })
      .eq("id", userId);

    return {
      success: true,
      data: auditOutputData,
      userStats: {
        plan: userPlan,
        limit: userLimit,
        used: nextUsedCount
      }
    };

  } catch (error) {
    console.error("CRITICAL AUDIT ERROR CONTROL:", error);
    return { 
      error: "Audit failed. Please verify the URL and infrastructure keys.",
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
      used: dbUser.used_audits || 0 // Jednostavno čitamo iz spremne kolone
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return null;
  }
}