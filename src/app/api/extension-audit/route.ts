import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";
import { formatUrl } from "../../lib/utils";
import { isPublicHttpUrl } from "../../lib/urlSafety";
import { runAudit } from "../../lib/auditPipeline";
import { reserveAuditCredit, refundAuditCredit } from "../../lib/credits";
import { rateLimit } from "../../lib/rateLimit";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: corsHeaders });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const apiKey = body.apiKey;
    const rawUrl = body.url || body.domData?.url;

    if (!apiKey || typeof apiKey !== "string") return fail("API key is missing or invalid.", 401);
    if (!rawUrl || typeof rawUrl !== "string") return fail("Target URL is missing or invalid.", 400);

    // formatUrl now returns "" for invalid input; the old `|| rawUrl` fallback let junk through.
    const targetUrl = formatUrl(rawUrl);
    if (!targetUrl || !(await isPublicHttpUrl(targetUrl))) return fail("Invalid or non-public URL.", 400);

    const SCRAPING_API_KEY = process.env.SCRAPING_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!SCRAPING_API_KEY || !GEMINI_API_KEY) return fail("Server configuration error.", 500);

    if (!rateLimit(`ext:${apiKey}`, 10, 60_000).ok) return fail("Too many requests. Please slow down.", 429);

    const { data: dbUser } = await supabase.from("users").select("id").eq("api_key", apiKey).maybeSingle();
    if (!dbUser) return fail("Invalid or unauthorized API key.", 403);

    const reservation = await reserveAuditCredit(dbUser.id);
    if (!reservation) return fail("Failed to verify your audit quota.", 500);
    if (!reservation.ok) {
      return fail(
        reservation.plan === "FREE"
          ? "Free audit limit reached. Upgrade your plan for more extension audits!"
          : `Monthly audit limit reached (${reservation.used}/${reservation.limit}) for ${reservation.plan} plan.`,
        402
      );
    }

    let auditOutputData;
    try {
      // Same pipeline as the dashboard => the extension and the web app can no longer disagree on the score.
      auditOutputData = await runAudit({
        url: targetUrl,
        mode: "single",
        scrapingKey: SCRAPING_API_KEY,
        geminiKey: GEMINI_API_KEY,
        source: "chrome_extension",
      });
    } catch (e) {
      console.error("Extension audit failed:", e);
      await refundAuditCredit(dbUser.id);
      return fail("Could not analyze this page. Your credit was not used.", 502);
    }

    const { data: insertedAudit, error: auditInsertError } = await supabase
      .from("audits")
      .insert([{ user_id: dbUser.id, website_url: targetUrl, result_data: auditOutputData }])
      .select("share_token")
      .single();

    if (auditInsertError || !insertedAudit) {
      console.error("Extension Audit insert error:", auditInsertError);
      await refundAuditCredit(dbUser.id);
      return fail("Failed to save audit report to database. Your credit was not used.", 500);
    }

    await supabase.rpc("increment_audit_counter");

    return NextResponse.json(
      {
        success: true,
        shareToken: insertedAudit.share_token,
        creditsRemaining: Math.max(0, reservation.limit - reservation.used),
        result: {
          score: auditOutputData.score,
          scoreCapReason: auditOutputData.scoreCapReason,
          pageCategory: auditOutputData.pageCategory,
          aiAnalysis: auditOutputData.aiAnalysis,
          recommendations: auditOutputData.recommendations,
          bluffScore: auditOutputData.bluffScore,
          atomicStructureScore: auditOutputData.atomicStructureScore,
          entityDensityScore: auditOutputData.entityDensityScore,
          sentenceSimplicityScore: auditOutputData.sentenceSimplicityScore,
          commodityContentScore: auditOutputData.commodityContentScore,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Critical Extension API Route Error:", error);
    return fail("Internal server error", 500);
  }
}
