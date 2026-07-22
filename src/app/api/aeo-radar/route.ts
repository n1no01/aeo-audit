import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { supabase } from "../../lib/supabase"; 
import { getUserStats, incrementRadarCount } from "../../actions"; 
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
  try {
    // 🔒 1. CLERK AUTENTIFIKACIJA: Provjera ulogovanosti
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    // 👥 2. SUPABASE PROVJERA LIMITA: Povlačimo statistiku
    const stats = await getUserStats();
    if (!stats) {
      return NextResponse.json({ error: 'Could not retrieve user profile data.' }, { status: 500 });
    }

    // 🔒 BLOCK: Besplatni plan
    if (stats.plan === "FREE") {
      return NextResponse.json({ 
        error: "🔒 AI Visibility Radar is a Premium feature. Please upgrade your plan to unlock live web scanning." 
      }, { status: 403 });
    }

    // Blokada po usvojenom limitu
    if (stats.radar_used >= stats.radar_limit) {
      return NextResponse.json({ 
        error: `🔒 Limit reached. You have used ${stats.radar_used}/${stats.radar_limit} available scans. Please upgrade your plan.` 
      }, { status: 403 });
    }

    // 🛡️ 3. VALIDACIJA BODY PARAMETARA
    const { targetUrl, keyword, engine = "perplexity" }: RequestBody = await req.json();

    if (!targetUrl || !keyword) {
      return NextResponse.json({ error: 'Missing targetUrl or keyword' }, { status: 400 });
    }

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
      return NextResponse.json({ error: "Failed to process radar scan." }, { status: 500 });
    }

    // 💾 5. SPREMANJE ANALIZE U NOVU TABELU U SUPABASE
    const fullRadarPayload = {
      engineUsed: engine,
      auditResult: cleanJson,
      allSourcesCrawled: citations
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

    // 💾 6. ATOMSKO UVEĆAVANJE RADAR KREDITA
    await incrementRadarCount(userId); 

    // Vraćamo čist JSON + shareToken
    return NextResponse.json({
      ...fullRadarPayload,
      shareToken: insertedScan?.share_token || null
    });

  } catch (error: unknown) {
    console.error("AEO Radar Server Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}