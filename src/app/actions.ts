"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { supabase } from "./lib/supabase";
import { formatUrl } from "./lib/utils";
import { scrapeWebsite } from "./lib/scraper";
import { calculateScore } from "./lib/scorer";
import { generateAiAnalysis } from "./lib/gemini";
import { ScrapedData, AuditData } from "./lib/types";
import { PostgrestError } from "@supabase/supabase-js"; 
import { revalidatePath } from "next/cache";

// ===================================================================
// STRUKTURE I TIPIZACIJA ZA AI RADAR I AKADEMIJU 
// ===================================================================
interface RadarAuditResult {
  isMentioned: boolean;
  mentionContext: string;
  aiAnswerSummary: string;
  topCompetitors: string[];
}

interface RadarResultData {
  auditResult: RadarAuditResult;
  allSourcesCrawled: string[];
}

interface DBRadarHistoryItem {
  id: number;
  website_url: string;
  keyword: string;
  created_at: string;
  share_token: string;
  result_data: RadarResultData;
}

interface DBHistoryItem {
  id: number;
  website_url: string;
  created_at: string;
  share_token: string;
  result_data: Record<string, unknown>; 
}

// 🔑 AŽURIRANI KLJUČ ODGOVORA (Izmiksovane opcije koje prate jednostavniji Playbook)
const ANSWER_KEY: Record<number, string> = {
  1: "b", 2: "c", 3: "a", 4: "a", 5: "c",
  6: "b", 7: "b", 8: "a", 9: "c", 10: "a",
  11: "a", 12: "c", 13: "a", 14: "b", 15: "a",
  16: "a", 17: "b", 18: "a", 19: "c", 20: "b"
};

// ===================================================================
// CORE AEO AUDIT AKCIJE
// ===================================================================

export async function analyzeUrl(formData: FormData) {
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

    if (currentUsedAudits >= userLimit) {
      const stats = { plan: userPlan, limit: userLimit, used: currentUsedAudits };
      return { 
        error: userPlan === "FREE" 
          ? "You have exhausted your single free audit. Upgrade your plan for more audits!"
          : `You have exceeded your monthly limit for the ${userPlan} plan (${userLimit} monthly). Upgrade your plan for more flexibility!`,
        userStats: stats
      };
    }

    const hasSubmittedWhiteLabel = 
      formData.get("agencyName") || 
      formData.get("brandColor") || 
      formData.get("authorName");

    if (userPlan === "FREE" && hasSubmittedWhiteLabel) {
      return { 
        error: "Custom white-label branding options are only available for Premium and Agency tiers.",
        userStats: { plan: userPlan, limit: userLimit, used: currentUsedAudits }
      };
    }

    let auditOutputData;
    try {
      const scrapedResult = await scrapeWebsite(url, SCRAPING_API_KEY) as ScrapedData;
      const score = calculateScore(scrapedResult);
      const aiData = await generateAiAnalysis(scrapedResult, score, url, GEMINI_API_KEY);

      auditOutputData = {
        ...scrapedResult,
        website_url: url, 
        score: aiData.score || score,
        pageCategory: aiData.pageCategory || "Uncategorized",
        aiAnalysis: aiData.aiAnalysis || "No analysis provided.",
        recommendations: aiData.recommendations || [],
        bluffScore: aiData.bluffScore || 5,
        atomicStructureScore: aiData.atomicStructureScore || 5,
        entityDensityScore: aiData.entityDensityScore || 5,
        sentenceSimplicityScore: aiData.sentenceSimplicityScore || 5,
        commodityContentScore: aiData.commodityContentScore || 5,
      };
    } catch (apiError) {
      console.error("External API Error (Scraper/Gemini):", apiError);
      return { 
        error: "Failed to scrape or analyze the website. Please check the URL and try again.",
        userStats: { plan: userPlan, limit: userLimit, used: currentUsedAudits }
      };
    }

    const { data: insertedAudit, error: auditInsertError } = await supabase
      .from("audits")
      .insert([
        {
          user_id: userId,
          website_url: url,
          result_data: auditOutputData,
        },
      ])
      .select("share_token") 
      .single();

    if (auditInsertError) {
      console.error("Supabase audit insert error:", auditInsertError);
      return { 
        error: "Failed to save audit results to database.",
        userStats: { plan: userPlan, limit: userLimit, used: currentUsedAudits }
      };
    }

    const { error: globalRpcError } = await supabase.rpc("increment_audit_counter");
    if (globalRpcError) {
      console.error("Supabase RPC global counter error:", globalRpcError);
    }

    const { data: updatedUsers, error: rpcError } = await supabase.rpc("increment_used_audits", {
      row_id: userId,
    });

    if (rpcError) {
      console.error("Supabase RPC increment error:", rpcError);
    }

    const finalUsedCount = updatedUsers && updatedUsers[0] 
      ? updatedUsers[0].used_audits 
      : currentUsedAudits + 1;

    return {
      success: true,
      auditId: insertedAudit?.share_token, 
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
      userStats: { plan: userPlan, limit: userLimit, used: currentUsedAudits }
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
      return { plan: "FREE", limit: 1, used: 0, radar_limit: 0, radar_used: 0, aeo_academy_paid: false, exam_attempts_used: 0, exam_passed: false };
    }

    const defaultRadarLimit = 
      dbUser.plan === "FREE" ? 0 : 
      dbUser.plan === "STARTER" ? 100 : 500;

    return {
      plan: dbUser.plan,
      limit: dbUser.audit_limit, 
      used: dbUser.used_audits || 0,
      radar_limit: dbUser.radar_limit ?? defaultRadarLimit, 
      radar_used: dbUser.radar_used || 0,                   
      aeo_academy_paid: dbUser.aeo_academy_paid || false,     
      exam_attempts_used: dbUser.exam_attempts_used || 0,    
      exam_passed: dbUser.exam_passed || false                
    };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return null;
  }
}

export async function getSharedAudit(shareToken: string) {
  if (!shareToken) return { error: "Invalid report identifier." };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shareToken);
  if (!isUuid) {
    console.warn(`BLOKIRAN NAPAD/NEVALIDAN UPIT: Pokušan pristup sa nevalidnim tokenom "${shareToken}".`);
    return { error: "This audit report was not found or has been deleted." };
  }

  try {
    const { data, error } = await supabase
      .rpc("get_public_audit_by_token", { target_token: shareToken })
      .maybeSingle() as { 
        data: { website_url: string; result_data: AuditData; created_at: string } | null; 
        error: PostgrestError | null; 
      };

    if (error) {
      console.error("Supabase BAZA PUKLA:", error.message);
      return { error: "Database communication failure." };
    }

    if (!data) {
      console.warn(`REPORT NIJE PRONAĐEN: Audit sa tokenom "${shareToken}" ne postoji.`);
      return { error: "This audit report was not found or has been deleted." };
    }

    return {
      success: true,
      url: data.website_url,
      createdAt: data.created_at,
      data: {
        ...data.result_data,
        website_url: data.website_url 
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Critical error in getSharedAudit:", errorMessage);
    return { error: "An error occurred while retrieving the shared report." };
  }
}

export async function getUserAuditHistory(limit?: number): Promise<{ 
  success?: boolean; 
  error?: string; 
  history?: DBHistoryItem[]; 
}> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized access." };

  try {
    let query = supabase
      .from("audits")
      .select("id, website_url, created_at, share_token, result_data")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching audit history:", error.message);
      return { error: "Failed to load audit history." };
    }

    const typedHistory = (data as unknown as DBHistoryItem[]) || [];
    return { success: true, history: typedHistory };
  } catch (error) {
    console.error("Critical error in getUserAuditHistory:", error);
    return { error: "An unexpected error occurred." };
  }
}

// ===================================================================
// 📡 NOVE NAMJENSKE AKCIJE ZA AI VISIBILITY RADAR POTROŠNJU I SHARE
// ===================================================================

export async function incrementRadarCount(userId: string) {
  try {
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("radar_used")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError || !user) {
      console.error("Supabase error prefetching radar metrics:", fetchError);
      return false;
    }

    const currentCount = user.radar_used || 0;
    const { error: updateError } = await supabase
      .from("users")
      .update({ radar_used: currentCount + 1 }) 
      .eq("id", userId);

    if (updateError) {
      console.error("Supabase update error incrementing radar count:", updateError.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Critical crash inside incrementRadarCount:", error);
    return false;
  }
}

export async function getUserRadarHistory(limit?: number): Promise<{ 
  success?: boolean; 
  error?: string; 
  history?: DBRadarHistoryItem[]; 
}> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized access." };

  try {
    const { data: dbUser } = await supabase
      .from("users")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    if (!dbUser || dbUser.plan?.toUpperCase() === "FREE") {
      return { error: "AI Radar features and histories are exclusive to premium subscription tiers." };
    }

    let query = supabase
      .from("radar_scans")
      .select("id, website_url, keyword, created_at, share_token, result_data") 
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching radar history:", error.message);
      return { error: "Failed to load radar history." };
    }

    const typedHistory = (data as unknown as DBRadarHistoryItem[]) || [];
    return { success: true, history: typedHistory };
  } catch (error) {
    console.error("Critical error in getUserRadarHistory:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function getSharedRadarScan(shareToken: string) {
  if (!shareToken) return { error: "Invalid radar identifier." };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shareToken);
  if (!isUuid) return { error: "This radar report format is invalid." };

  try {
    const { data, error } = await supabase
      .from("radar_scans")
      .select("website_url, keyword, created_at, result_data")
      .eq("share_token", shareToken)
      .maybeSingle();

    if (error) {
      console.error("Supabase radar fetch failed:", error.message);
      return { error: "Database communication failure." };
    }

    if (!data) {
      return { error: "This radar report was not found or has been deleted." };
    }

    const formattedData = data.result_data as unknown as RadarResultData;

    return {
      success: true,
      url: data.website_url,
      keyword: data.keyword,
      createdAt: data.created_at,
      data: formattedData
    };
  } catch (error) {
    console.error("Critical error in getSharedRadarScan:", error);
    return { error: "An error occurred while retrieving the shared radar report." };
  }
}

// ===================================================================
// 🎓 PREMIUM SUBMISSION AKCIJA ZA AEO TECHNICAL SPECIALIST ISPIT
// ===================================================================
export async function submitAeoExam(answers: Record<number, string>, fullName: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, message: "Unauthorized access." };

  // 🛡️ Provera da ime nije prazno
  if (!fullName || fullName.trim() === "") {
    return { success: false, message: "Please provide your full legal name for certification verification." };
  }

  try {
    const { data: userStats, error: fetchError } = await supabase
      .from("users")
      .select("aeo_academy_paid, exam_attempts_used, exam_passed")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError || !userStats) {
      console.error("Supabase error fetching academy stats:", fetchError);
      return { success: false, message: "User profile or academy registry not found." };
    }

    if (!userStats.aeo_academy_paid) {
      return { success: false, message: "You have not purchased access to the academy program." };
    }

    if (userStats.exam_passed) {
      return { success: false, message: "You have already passed this certification exam." };
    }

    if (userStats.exam_attempts_used >= 2) {
      return { success: false, message: "Maximum examination attempts reached (2/2)." };
    }

    let correctCount = 0;
    const totalQuestions = 20;
    const requiredToPass = 18;

    for (const [qId, answer] of Object.entries(answers)) {
      if (answer === ANSWER_KEY[Number(qId)]) {
        correctCount++;
      }
    }

    const passed = correctCount >= requiredToPass;
    const newAttemptsCount = (userStats.exam_attempts_used || 0) + 1;

    // 🚀 ATOMSKO AŽURIRANJE: Upisujemo i full_name i cert_issued_at timestamp
    const { error: updateError } = await supabase
      .from("users")
      .update({
        exam_attempts_used: newAttemptsCount,
        exam_passed: passed,
        full_name: passed ? fullName.trim() : null, // Čuva ime samo ako je ispit položen
        cert_issued_at: passed ? new Date().toISOString() : null // Zaključava tačan datum prolaza
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Supabase update error during exam registration:", updateError.message);
      return { success: false, message: "Database communication failure during score sync." };
    }

    revalidatePath("/academy/certification");

    if (passed) {
      return {
        passed: true,
        score: correctCount,
        message: "🎉 Brilliant! You passed the exam and officially earned your AEO Specialist credential."
      };
    }

    return {
      passed: false,
      score: correctCount,
      message: `Exam not passed. Score: ${correctCount}/${totalQuestions}. Required: ${requiredToPass}/20. ${
        newAttemptsCount < 2 
          ? "You have ONE final attempt remaining. Review the Technical Playbook carefully before retaking the test." 
          : "You have exhausted both of your official validation attempts."
      }`
    };

  } catch (error) {
    console.error("Critical failure during exam processing action:", error);
    return { success: false, message: "An unexpected network layer crash occurred." };
  }
}