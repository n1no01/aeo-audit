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

  // Definišemo varijable van try bloka kako bi bile dostupne i u catch bloku za userStats
  let userPlan = "FREE";
  let userLimit = 1;
  let currentAuditsCount = 0;

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
      // ⚠️ Ispravljeno na audits_limit da odgovara tvojoj tabeli u bazi podataka
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([{ id: userId, email: email, plan: "FREE", audit_limit: 1 }])
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

    // ========================================================
    // 🕒 3. PROVJERA LIMITA
    // ========================================================
    if (userPlan === "FREE") {
      // 🎯 Za FREE korisnike brojimo apsolutno sve audite iz istorije baze
      const { count, error: countError } = await supabase
        .from("audits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) console.error("Supabase count error:", countError);
      currentAuditsCount = count || 0;
    } else {
      // ⏳ Za PRETPLAĆENE korisnike (STARTER / AGENCY PRO) brojimo audite u zadnjih 30 dana
      // Profesionalnije rješenje bez komplikovanih cron-poslova: gledamo tekući mjesni ciklus
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count, error: countError } = await supabase
        .from("audits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (countError) console.error("Supabase count error:", countError);
      currentAuditsCount = count || 0;
    }

    // Provjera limita: ako je broj dostigao ili prešao limit, zaustavi proces
    if (currentAuditsCount >= userLimit) {
      const stats = { plan: userPlan, limit: userLimit, used: currentAuditsCount };
      
      if (userPlan === "FREE") {
        return { 
          error: "You have exhausted your single free audit. Upgrade your plan for more audits!",
          userStats: stats
        };
      } else {
        return { 
          error: `You have exceeded your monthly limit for the ${userPlan} plan (${userLimit} mjesečno). Upgrade your plan for more flexibility!`,
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
    // 💾 5. UPIS REZULTATA AUDITA U SUPABASE 'AUDITS' TABELU
    // ========================================================
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
        userStats: { plan: userPlan, limit: userLimit, used: currentAuditsCount }
      };
    }

    return {
      success: true,
      data: auditOutputData,
      userStats: {
        plan: userPlan,
        limit: userLimit,
        used: currentAuditsCount + 1
      }
    };

  } catch (error) {
    console.error("CRITICAL AUDIT ERROR CONTROL:", error);
    return { 
      error: "Audit failed. Please verify the URL and infrastructure keys.",
      userStats: {
        plan: userPlan,
        limit: userLimit,
        used: currentAuditsCount
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

    const userPlan = dbUser.plan;
    const userLimit = dbUser.audits_limit; // ⚠️ Ispravljeno ime kolone (dodano 's')
    let currentAuditsCount = 0;

    if (userPlan === "FREE") {
      const { count } = await supabase
        .from("audits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      currentAuditsCount = count || 0;
    } else {
      // ⏳ Usklađeno da broji u rasponu od zadnjih 30 dana umjesto samo za tekući dan
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count } = await supabase
        .from("audits")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString());
      currentAuditsCount = count || 0;
    }

    return {
      plan: userPlan,
      limit: userLimit,
      used: currentAuditsCount
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return null;
  }
}