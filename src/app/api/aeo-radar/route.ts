import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { supabase } from "../../lib/supabase"; 
import { reserveRadarCredit, refundRadarCredit } from "../../lib/credits";
import { rateLimit } from "../../lib/rateLimit";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

interface RequestBody {
  targetUrl: string;
  keyword: string;
  engine?: "perplexity" | "openai";
}

interface RadarAuditResult {
  isMentioned: boolean;
  mentionContext: string;
  aiAnswerSummary: string;
  topCompetitors: string[];
}

interface PerplexityErrorResponse {
  message?: string;
  error?: {
    message?: string;
  };
}

export async function POST(req: Request) {
  let reservedFor: string | null = null; // set once a radar credit was reserved, so the outer catch can refund it
  try {
    // 🔒 1. CLERK AUTENTIFIKACIJA: Provjera ulogovanosti
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    if (!rateLimit(`radar:${userId}`, 5, 60_000).ok) {
      return NextResponse.json({ error: "Too many scans. Please wait a minute." }, { status: 429 });
    }

    // 🛡️ 3. VALIDACIJA BODY PARAMETARA
    const { targetUrl, keyword, engine = "perplexity" }: RequestBody = await req.json();

    if (typeof targetUrl !== "string" || typeof keyword !== "string" || !targetUrl.trim() || !keyword.trim()) {
      return NextResponse.json({ error: 'Missing targetUrl or keyword' }, { status: 400 });
    }
    if (keyword.length > 200 || targetUrl.length > 300) {
      return NextResponse.json({ error: 'Input too long.' }, { status: 400 });
    }

    // Reserve the credit atomically BEFORE paying for the external API call (also enforces plan + limit).
    // Previously the limit was read, the call made, and the counter bumped later by an exported server action
    // that any client could invoke for any userId.
    const reserved = await reserveRadarCredit(userId);
    if (!reserved) {
      return NextResponse.json({
        error: "🔒 AI Visibility Radar needs a paid plan with scans remaining. Please upgrade or wait for your limit to reset."
      }, { status: 403 });
    }
    reservedFor = userId;
    const refund = async () => { if (reservedFor) { const id = reservedFor; reservedFor = null; await refundRadarCredit(id); } };

    let cleanJson: RadarAuditResult | null = null;
    let citations: string[] = [];

    // Zajednički sistemski i korisnički promptovi (identični za oba engine-a)
    const systemPrompt = `You are an expert AEO (Answer Engine Optimization) auditing tool. 
Analyze the search results gathered from the web. Your job is to check if the user's target website is mentioned, recommended, or cited in those results.

STRICT RULE: The targetUrl must match EXACTLY as a domain or subdomain. Do not confuse it with similar-looking competitor domains (e.g., if target is 'aeoaudit-pro.com', do NOT count 'aeoaudittool.com' as a match). If it's a different domain, 'isMentioned' MUST be false.

Strict JSON structure to follow:
{
  "isMentioned": true/false,
  "mentionContext": "If mentioned, provide the exact sentence/context where it was recommended. If not, explain what the competitors did better to get the spot.",
  "aiAnswerSummary": "A brief 2-3 sentence overview summarizing what an AI answer engine typically tells a user for this query.",
  "topCompetitors": ["competitor1.com", "competitor2.com", "competitor3.com"]
}`;

    const userPrompt = `Search the web for "${keyword}" to find the top recommendations, tools, or businesses. Once you have the search results, check if the website "${targetUrl}" is anywhere among the top sources or mentioned in the findings.`;

    // ==========================================
    // 🚀 ENGINE A: PERPLEXITY SONAR (IZVORNA LOGIKA)
    // ==========================================
    if (engine === "perplexity") {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar',
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as PerplexityErrorResponse;
        console.error("Perplexity API error:", errorData);
        await refund();
        const errorMessage = errorData.message || errorData.error?.message || response.status.toString();
        return NextResponse.json({ 
          error: `Perplexity API error: ${errorMessage}` 
        }, { status: response.status === 401 ? 401 : 502 });
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        citations?: string[];
      };
      
      if (!data.choices || data.choices.length === 0) {
        await refund();
        return NextResponse.json({ error: 'Invalid response from Perplexity API' }, { status: 502 });
      }

      const rawText = data.choices[0].message.content.trim();
      
      // Sanitizacija u slučaju markdown okvira
      const sanitizedText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();
      const jsonMatch = sanitizedText.match(/\{[\s\S]*\}/);
      
      cleanJson = JSON.parse(jsonMatch ? jsonMatch[0] : sanitizedText) as RadarAuditResult;
      citations = data.citations || [];
    }

    // ==========================================
    // 🚀 ENGINE B: OPENAI CHATGPT (IDENTIČAN PROMPT)
    // ==========================================
    else if (engine === "openai") {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" }, // Prisiljava čist i ispravan JSON izlaz
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1,
        });

        const rawText = completion.choices[0]?.message?.content || "";
        cleanJson = JSON.parse(rawText) as RadarAuditResult;
        citations = [];
      } catch (openAiErr: unknown) {
        console.error("OpenAI Error:", openAiErr);
        await refund();
        
        if (openAiErr instanceof OpenAI.APIError) {
          if (openAiErr.status === 429 || openAiErr.code === 'insufficient_quota') {
            return NextResponse.json({ 
              error: "⚠️ OpenAI API Quota Exceeded. Please top up your balance on platform.openai.com." 
            }, { status: 429 });
          }
          return NextResponse.json({ 
            error: `OpenAI API Error: ${openAiErr.message}` 
          }, { status: 502 });
        }

        const fallbackMsg = openAiErr instanceof Error ? openAiErr.message : 'Failed to communicate with OpenAI API';
        return NextResponse.json({ 
          error: `OpenAI Error: ${fallbackMsg}` 
        }, { status: 502 });
      }
    }

    if (!cleanJson) {
      await refund();
      return NextResponse.json({ error: "Failed to process radar scan." }, { status: 500 });
    }

    // The LLM must not decide "isMentioned" (it hallucinates). Verify against real data:
    // cited source URLs, plus an exact hostname match inside the model's own text.
    const hostOf = (v: string) => { try { return new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; } };
    const targetHost = hostOf(targetUrl);
    const citedHosts = citations.map(hostOf).filter(Boolean);
    const citedMatch = targetHost !== "" && citedHosts.some((h) => h === targetHost || h.endsWith(`.${targetHost}`));
    const textMatch = targetHost !== "" && new RegExp(`(^|[^a-z0-9-])${targetHost.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9-]|$)`, "i")
      .test(`${cleanJson.mentionContext ?? ""} ${cleanJson.aiAnswerSummary ?? ""} ${(cleanJson.topCompetitors ?? []).join(" ")}`);
    cleanJson = {
      ...cleanJson,
      isMentioned: engine === "perplexity" ? citedMatch || (Boolean(cleanJson.isMentioned) && textMatch) : Boolean(cleanJson.isMentioned) && textMatch,
      topCompetitors: (cleanJson.topCompetitors ?? []).filter((c) => hostOf(c) !== targetHost).slice(0, 5),
    };

    // 💾 5. SPREMANJE ANALIZE U NOVU TABELU U SUPABASE
    const fullRadarPayload = {
      engineUsed: engine,
      auditResult: cleanJson,
      allSourcesCrawled: citations,
      // The OpenAI engine here has no live web access: its answer reflects model knowledge only.
      webGrounded: engine === "perplexity",
    };

    const { data: insertedScan, error: dbInsertError } = await supabase
      .from("radar_scans")
      .insert([
        {
          user_id: userId,
          website_url: targetUrl,
          keyword: keyword,
          result_data: fullRadarPayload
        }
      ])
      .select("share_token")
      .single<{ share_token: string }>();

    if (dbInsertError) {
      console.error("⚠️ Supabase backup error logging radar scan:", dbInsertError.message);
    }

    // Vraćamo čist JSON + shareToken
    return NextResponse.json({
      ...fullRadarPayload,
      shareToken: insertedScan?.share_token || null
    });

  } catch (error: unknown) {
    console.error("AEO Radar Server Error:", error);
    if (reservedFor) await refundRadarCredit(reservedFor); // failed after reserving: give the credit back
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}