import { NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";
import { scrapeWebsite } from "@/app/lib/scraper";
import { calculateScore } from "@/app/lib/scorer";
import { formatUrl } from "@/app/lib/utils";
import { isPublicHttpUrl } from "@/app/lib/urlSafety";
import { rateLimit, clientIp } from "@/app/lib/rateLimit";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: corsHeaders });

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { targetUrl, leadEmail, apiKey } = body as { targetUrl?: unknown; leadEmail?: unknown; apiKey?: unknown };

    if (typeof targetUrl !== "string" || typeof leadEmail !== "string" || typeof apiKey !== "string") {
      return fail("Missing required parameters.", 400);
    }

    // The widget key is PUBLIC (it sits in the embed snippet), so abuse protection is mandatory:
    // limit per visitor IP and per key.
    if (!rateLimit(`wgt-ip:${clientIp(req.headers)}`, 5, 60_000).ok) return fail("Too many requests. Try again shortly.", 429);
    if (!rateLimit(`wgt-key:${apiKey}`, 60, 60_000).ok) return fail("This widget is receiving too many requests.", 429);

    const cleanEmail = leadEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) return fail("Please enter a valid email address.", 400);

    // Dedicated public widget key. Legacy fallback to the secret API key is OFF unless explicitly enabled
    // (so old embeds keep working during migration, but the secret key stops being a public credential).
    let { data: agencyUser } = await supabase.from("users").select("id, plan").eq("widget_key", apiKey).maybeSingle();
    if (!agencyUser && process.env.ALLOW_LEGACY_WIDGET_KEY === "true") {
      ({ data: agencyUser } = await supabase.from("users").select("id, plan").eq("api_key", apiKey).maybeSingle());
    }
    if (!agencyUser) return fail("Invalid or unauthorized widget key.", 401);

    if (agencyUser.plan === "FREE") return fail("Widget lead generation requires an active paid plan.", 403);

    const formattedUrl = formatUrl(targetUrl);
    if (!formattedUrl || !(await isPublicHttpUrl(formattedUrl))) return fail("Invalid URL format.", 400);

    const SCRAPING_API_KEY = process.env.SCRAPING_API_KEY;
    if (!SCRAPING_API_KEY) return fail("Server config error.", 500);

    const scrapedData = await scrapeWebsite(formattedUrl, SCRAPING_API_KEY);
    const score = calculateScore(scrapedData);

    // One row per (agency, email): needs the unique index from the migration; falls back to select+write.
    const { error: upsertError } = await supabase.from("widget_leads").upsert(
      [{ agency_user_id: agencyUser.id, lead_email: cleanEmail, website_url: formattedUrl, score, created_at: new Date().toISOString() }],
      { onConflict: "agency_user_id,lead_email" }
    );

    if (upsertError) {
      const { data: existing } = await supabase
        .from("widget_leads").select("id").eq("agency_user_id", agencyUser.id).eq("lead_email", cleanEmail).maybeSingle();
      if (existing) {
        await supabase.from("widget_leads").update({ website_url: formattedUrl, score, created_at: new Date().toISOString() }).eq("id", existing.id);
      } else {
        await supabase.from("widget_leads").insert([{ agency_user_id: agencyUser.id, lead_email: cleanEmail, website_url: formattedUrl, score }]);
      }
    }

    return NextResponse.json({ success: true, url: formattedUrl, score }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("Widget API error:", error);
    return fail("Failed to process audit widget request.", 500);
  }
}
