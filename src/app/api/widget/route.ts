import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { scrapeWebsite } from "@/app/lib/scraper";
import { calculateScore } from "@/app/lib/scorer";
import { formatUrl } from "@/app/lib/utils";

// 🚀 CORS Headers koji dozvoljavaju i 'null' (lokalne fajlove) i bilo koji domen (*)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 🚀 Preflight handler MUST return 200 OK immediately without redirects
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  try {
    const { targetUrl, leadEmail, apiKey } = await req.json();

    if (!targetUrl || !leadEmail || !apiKey) {
      return NextResponse.json(
        { error: "Missing required parameters." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔒 Provjera API ključa i plana korisnika u bazi
    const { data: agencyUser, error: userError } = await supabase
      .from("users")
      .select("id, plan")
      .eq("api_key", apiKey)
      .maybeSingle();

    if (userError || !agencyUser) {
      return NextResponse.json(
        { error: "Invalid or unauthorized API key." },
        { status: 401, headers: corsHeaders }
      );
    }

    // 🚫 Blokiramo izvođenje ako je korisnik na FREE planu
    if (agencyUser.plan === "FREE") {
      return NextResponse.json(
        { error: "Widget lead generation requires an active paid plan." },
        { status: 403, headers: corsHeaders }
      );
    }

    const formattedUrl = formatUrl(targetUrl);
    if (!formattedUrl) {
      return NextResponse.json(
        { error: "Invalid URL format." },
        { status: 400, headers: corsHeaders }
      );
    }

    const SCRAPING_API_KEY = process.env.SCRAPING_API_KEY;
    if (!SCRAPING_API_KEY) {
      return NextResponse.json(
        { error: "Server config error." },
        { status: 500, headers: corsHeaders }
      );
    }

    const scrapedData = await scrapeWebsite(formattedUrl, SCRAPING_API_KEY);
    const score = calculateScore(scrapedData);

    const cleanEmail = leadEmail.trim().toLowerCase();

    // 🔍 1. Provjera da li ovaj lead email već postoji za ovu agenciju
    const { data: existingLead } = await supabase
      .from("widget_leads")
      .select("id")
      .eq("agency_user_id", agencyUser.id)
      .eq("lead_email", cleanEmail)
      .maybeSingle();

    if (existingLead) {
      // 🔄 Ako postoji, samo ažuriramo postojeći zapis najnovijim podacima
      await supabase
        .from("widget_leads")
        .update({
          website_url: formattedUrl,
          score: score,
          created_at: new Date().toISOString(),
        })
        .eq("id", existingLead.id);
    } else {
      // ➕ Ako ne postoji, ubacujemo novi lead
      await supabase.from("widget_leads").insert([
        {
          agency_user_id: agencyUser.id,
          lead_email: cleanEmail,
          website_url: formattedUrl,
          score: score,
        },
      ]);
    }

    return NextResponse.json(
      {
        success: true,
        url: formattedUrl,
        score: score,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Widget API error:", error);
    return NextResponse.json(
      { error: "Failed to process audit widget request." },
      { status: 500, headers: corsHeaders }
    );
  }
}