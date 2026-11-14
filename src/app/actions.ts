"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { supabase } from "./lib/supabase";
import { formatUrl } from "./lib/utils";
import { runAudit, AuditMode } from "./lib/auditPipeline";
import { isPublicHttpUrl } from "./lib/urlSafety";
import { reserveAuditCredit, refundAuditCredit } from "./lib/credits";
import { generateApiKey, generateWidgetKey } from "./lib/keys";
import { rateLimit } from "./lib/rateLimit";
import { AuditData } from "./lib/types";
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

const ANSWER_KEY: Record<number, string> = {
  1: "b", 2: "c", 3: "a", 4: "a", 5: "c",
  6: "b", 7: "b", 8: "a", 9: "c", 10: "a",
  11: "a", 12: "c", 13: "a", 14: "b", 15: "a",
  16: "a", 17: "b", 18: "a", 19: "c", 20: "b"
};

// ===================================================================
// CORE AEO AUDIT ACTION (Single URL + Full Domain)
// ===================================================================

export async function analyzeUrl(formData: FormData) {
  const rawUrlInput = formData.get("url");
  const auditMode: AuditMode = formData.get("mode") === "domain" ? "domain" : "single";

  if (!rawUrlInput || typeof rawUrlInput !== "string") {
    return { error: "Please enter a valid target domain or URL." };
  }

  const url = formatUrl(rawUrlInput);
  if (!url) return { error: "Invalid URL format." };

  // Reject private/internal targets before any credit is touched.
  if (!(await isPublicHttpUrl(url))) {
    return { error: "This address cannot be audited. Please enter a public website URL." };
  }

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

  // Per-user burst limit (credits are the hard quota, this just stops hammering).
  if (!rateLimit(`audit:${userId}`, 6, 60_000).ok) {
    return { error: "Too many requests. Please wait a minute and try again." };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  try {
    let { data: dbUser } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();

    if (!dbUser) {
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([{ id: userId, email, plan: "FREE", audit_limit: 1, used_audits: 0, api_key: generateApiKey() }])
        .select()
        .single();

      if (insertError) {
        // Two parallel first requests can race on the insert: re-read before failing.
        const { data: again } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
        if (!again) {
          console.error("Supabase user insert error:", insertError);
          return { error: "Failed to initialize user profile in database." };
        }
        dbUser = again;
      } else {
        dbUser = newUser;
      }
    }

    const snapshot = { plan: dbUser.plan, limit: dbUser.audit_limit, used: dbUser.used_audits || 0 };

    const hasWhiteLabel = formData.get("agencyName") || formData.get("brandColor") || formData.get("authorName");
    if (dbUser.plan === "FREE" && hasWhiteLabel) {
      return {
        error: "Custom white-label branding options are only available for Premium and Agency tiers.",
        userStats: snapshot,
      };
    }

    // A domain audit = up to 15 scrapes + AI call for ONE credit, so it is a paid feature.
    if (auditMode === "domain" && dbUser.plan === "FREE" && process.env.ALLOW_FREE_DOMAIN_AUDIT !== "true") {
      return { error: "Full-domain audits are available on paid plans. Run a single-page audit or upgrade.", userStats: snapshot };
    }

    // 1) Atomically reserve the credit BEFORE the expensive work.
    const reservation = await reserveAuditCredit(userId);
    if (!reservation) return { error: "Failed to verify your audit quota. Please try again.", userStats: snapshot };

    if (!reservation.ok) {
      return {
        error:
          reservation.plan === "FREE"
            ? "You have exhausted your single free audit. Upgrade your plan for more audits!"
            : `You have exceeded your monthly limit for the ${reservation.plan} plan (${reservation.limit} monthly). Upgrade your plan for more flexibility!`,
        userStats: { plan: reservation.plan, limit: reservation.limit, used: reservation.used },
      };
    }

    // 2) Do the work; any failure from here on refunds the credit.
    let auditOutputData;
    try {
      auditOutputData = await runAudit({ url, mode: auditMode, scrapingKey: SCRAPING_API_KEY, geminiKey: GEMINI_API_KEY });
    } catch (apiError) {
      console.error("External API Error (Scraper/Gemini):", apiError);
      await refundAuditCredit(userId);
      return {
        error: "Failed to scrape or analyze the website. Your credit was not used. Please check the URL and try again.",
        userStats: { plan: reservation.plan, limit: reservation.limit, used: Math.max(0, reservation.used - 1) },
      };
    }

    const { data: insertedAudit, error: auditInsertError } = await supabase
      .from("audits")
      .insert([{ user_id: userId, website_url: url, result_data: auditOutputData }])
      .select("share_token")
      .single();

    if (auditInsertError) {
      console.error("Supabase audit insert error:", auditInsertError);
      await refundAuditCredit(userId);
      return {
        error: "Failed to save audit results to database. Your credit was not used.",
        userStats: { plan: reservation.plan, limit: reservation.limit, used: Math.max(0, reservation.used - 1) },
      };
    }

    const { error: globalRpcError } = await supabase.rpc("increment_audit_counter");
    if (globalRpcError) console.error("Supabase RPC global counter error:", globalRpcError);

    return {
      success: true,
      auditId: insertedAudit?.share_token,
      data: auditOutputData,
      userStats: { plan: reservation.plan, limit: reservation.limit, used: reservation.used },
    };
  } catch (error) {
    console.error("CRITICAL AUDIT ERROR CONTROL:", error);
    return { error: "An unexpected system error occurred. Please try again later." };
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

    for (const [qId, answer] of Object.entries(answers ?? {})) {
      if (typeof answer === "string" && answer === ANSWER_KEY[Number(qId)]) {
        correctCount++;
      }
    }

    const passed = correctCount >= requiredToPass;
    const newAttemptsCount = (userStats.exam_attempts_used || 0) + 1;

    const { error: updateError } = await supabase
      .from("users")
      .update({
        exam_attempts_used: newAttemptsCount,
        exam_passed: passed,
        full_name: passed ? fullName.trim() : null,
        cert_issued_at: passed ? new Date().toISOString() : null
      })
      .eq("id", userId)
      .eq("exam_attempts_used", userStats.exam_attempts_used || 0); // optimistic lock: parallel submits cannot buy extra attempts

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

// ===================================================================
// 🔑 AKCIJE ZA CHROME EXTENSION API KLJUČEVE
// ===================================================================

export async function getOrCreateApiKey() {
  const { userId } = await auth();
  const clerkUser = await currentUser();

  if (!userId || !clerkUser) return { error: "Unauthorized" };

  const email = clerkUser.emailAddresses[0]?.emailAddress;

  try {
    // 1. Provjeri da li korisnik uopšte postoji u tabeli 'users'
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, api_key")
      .eq("id", userId)
      .maybeSingle();

    // Ako korisnik uopšte ne postoji u 'users' tabeli, kreiramo ga
    if (!dbUser) {
      const newApiKey = generateApiKey();
      
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([
          { 
            id: userId, 
            email: email, 
            plan: "FREE", 
            audit_limit: 1, 
            used_audits: 0,
            api_key: newApiKey
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error("User creation error in getOrCreateApiKey:", insertError);
        return { error: "Failed to initialize user with API key." };
      }

      return { apiKey: newUser.api_key };
    }

    // 2. Ako korisnik postoji i već ima ključ, vrati ga
    if (dbUser.api_key) {
      return { apiKey: dbUser.api_key };
    }

    // 3. Ako korisnik postoji ali nema ključ, generiši ga i ažuriraj red
    const newApiKey = generateApiKey();

    const { error: updateError } = await supabase
      .from("users")
      .update({ api_key: newApiKey })
      .eq("id", userId);

    if (updateError) {
      console.error("Failed to save generated API key:", updateError);
      return { error: "Failed to generate API key." };
    }

    return { apiKey: newApiKey };
  } catch (err) {
    console.error("Error in getOrCreateApiKey:", err);
    return { error: "System error generating API key." };
  }
}

export async function regenerateApiKey() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const newApiKey = generateApiKey();

  const { error } = await supabase
    .from("users")
    .update({ api_key: newApiKey })
    .eq("id", userId);

  if (error) return { error: "Failed to regenerate API key." };

  revalidatePath("/settings");
  return { apiKey: newApiKey };
}

export async function getAgencyLeads() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized access." };

  try {
    const { data, error } = await supabase
      .from("widget_leads")
      .select("id, lead_email, website_url, score, created_at")
      .eq("agency_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching widget leads:", error.message);
      return { error: "Failed to load widget leads." };
    }

    return { success: true, leads: data || [] };
  } catch (error) {
    console.error("Critical error in getAgencyLeads:", error);
    return { error: "An unexpected error occurred." };
  }
}

/** Public key for the embeddable lead-gen widget. Separate from the secret extension key. */
export async function getOrCreateWidgetKey() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  try {
    const { data: dbUser } = await supabase.from("users").select("id, widget_key").eq("id", userId).maybeSingle();
    if (!dbUser) return { error: "User profile not found. Run an audit first." };
    if (dbUser.widget_key) return { widgetKey: dbUser.widget_key as string };

    const widgetKey = generateWidgetKey();
    const { error } = await supabase.from("users").update({ widget_key: widgetKey }).eq("id", userId);
    if (error) {
      console.error("Failed to save widget key (did you run the migration?):", error.message);
      return { error: "Failed to generate widget key." };
    }
    return { widgetKey };
  } catch (err) {
    console.error("Error in getOrCreateWidgetKey:", err);
    return { error: "System error generating widget key." };
  }
}

export async function regenerateWidgetKey() {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const widgetKey = generateWidgetKey();
  const { error } = await supabase.from("users").update({ widget_key: widgetKey }).eq("id", userId);
  if (error) return { error: "Failed to regenerate widget key." };
  return { widgetKey };
}
