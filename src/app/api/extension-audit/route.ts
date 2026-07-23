import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabase";
import { scrapeWebsite } from "../../lib/scraper";
import { generateAiAnalysis } from "../../lib/gemini";
import { calculateScore } from "../../lib/scorer";
import { ScrapedData } from "../../lib/types";

export async function POST(req: NextRequest) {
  try {
    const { apiKey, domData } = await req.json();

    // 1. Validacija parametara
    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json({ error: "API key is missing or invalid." }, { status: 401 });
    }

    if (!domData || !domData.url) {
      return NextResponse.json({ error: "Invalid DOM data structure provided from extension." }, { status: 400 });
    }

    const SCRAPING_API_KEY = process.env.SCRAPING_API_KEY;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!SCRAPING_API_KEY || !GEMINI_API_KEY) {
      return NextResponse.json({ error: "Server API keys (Scraper/Gemini) are missing." }, { status: 500 });
    }

    // 2. Autentifikacija korisnika
    const { data: dbUser, error: userError } = await supabase
      .from("users")
      .select("id, plan, audit_limit, used_audits")
      .eq("api_key", apiKey)
      .maybeSingle();

    if (userError || !dbUser) {
      return NextResponse.json({ error: "Invalid or unauthorized API key." }, { status: 403 });
    }

    const currentUsed = dbUser.used_audits || 0;
    const limit = dbUser.audit_limit || 1;

    // 3. Provjera limita
    if (currentUsed >= limit) {
      return NextResponse.json(
        {
          error: dbUser.plan === "FREE"
            ? "Free audit limit reached. Upgrade your plan for more extension audits!"
            : `Monthly audit limit reached (${currentUsed}/${limit}) for ${dbUser.plan} plan.`
        },
        { status: 402 }
      );
    }

    const targetUrl = domData.url;

    // 4. Puni backend scraping (Identično kao na web-u)
    const scrapedResult = (await scrapeWebsite(targetUrl, SCRAPING_API_KEY)) as ScrapedData;

    // 5. Matematički seed score
    const score = calculateScore(scrapedResult);

    // 6. Gemini AI analiza sa identičnim ulaznim podacima
    const aiData = await generateAiAnalysis(
      scrapedResult,
      score,
      targetUrl,
      GEMINI_API_KEY
    );

    const auditOutputData = {
      ...scrapedResult,
      website_url: targetUrl,
      score: score,
      pageCategory: aiData.pageCategory || "General Website",
      aiAnalysis: aiData.aiAnalysis || "No analysis provided.",
      recommendations: aiData.recommendations || [],
      bluffScore: aiData.bluffScore || 5,
      atomicStructureScore: aiData.atomicStructureScore || 5,
      entityDensityScore: aiData.entityDensityScore || 5,
      sentenceSimplicityScore: aiData.sentenceSimplicityScore || 5,
      commodityContentScore: aiData.commodityContentScore || 5,
      source: "chrome_extension",
    };

    // 7. Upis u 'audits' tabelu
    const { data: insertedAudit, error: auditInsertError } = await supabase
      .from("audits")
      .insert([
        {
          user_id: dbUser.id,
          website_url: targetUrl,
          result_data: auditOutputData,
        },
      ])
      .select("share_token")
      .single();

    if (auditInsertError) {
      console.error("Extension Audit insert error:", auditInsertError);
      return NextResponse.json({ error: "Failed to save audit report to database." }, { status: 500 });
    }

    // 8. Inkrementisanje brojača
    await supabase.rpc("increment_audit_counter");
    
    const { data: updatedUsers } = await supabase.rpc("increment_used_audits", {
      row_id: dbUser.id,
    });

    const finalUsedCount = updatedUsers && updatedUsers[0]
      ? updatedUsers[0].used_audits
      : currentUsed + 1;

    // 9. Odgovor ekstenziji
    return NextResponse.json({
      success: true,
      shareToken: insertedAudit?.share_token,
      creditsRemaining: limit - finalUsedCount,
      result: {
        score: auditOutputData.score,
        pageCategory: auditOutputData.pageCategory,
        aiAnalysis: auditOutputData.aiAnalysis,
        recommendations: auditOutputData.recommendations,
        bluffScore: auditOutputData.bluffScore,
        atomicStructureScore: auditOutputData.atomicStructureScore,
        entityDensityScore: auditOutputData.entityDensityScore,
        sentenceSimplicityScore: auditOutputData.sentenceSimplicityScore,
        commodityContentScore: auditOutputData.commodityContentScore,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Critical Extension API Route Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}