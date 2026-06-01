import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { supabase } from "../../lib/supabase"; // ✅ Koristimo tvoj postojeći klijent za direktan insert
import { getUserStats, incrementRadarCount } from "../../actions"; // ✅ Tvoje serverske akcije

interface RequestBody {
  targetUrl: string;
  keyword: string;
}

export async function POST(req: Request) {
  try {
    // 🔒 1. CLERK AUTENTIFIKACIJA: Provjera da li je korisnik uopšte ulogovan
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    // 👥 2. SUPABASE PROVJERA LIMITA: Povlačimo svježu statistiku iz baze
    const stats = await getUserStats();
    if (!stats) {
      return NextResponse.json({ error: 'Could not retrieve user profile data.' }, { status: 500 });
    }

    // Blokada na backendu ako je korisnik ispucao svoj namjenski limit (1, 100, ili 500)
    if (stats.radar_used >= stats.radar_limit) {
      return NextResponse.json({ 
        error: `🔒 Limit reached. You have used ${stats.radar_used}/${stats.radar_limit} available scans. Please upgrade your plan.` 
      }, { status: 403 });
    }

    // 🛡️ 3. VALIDACIJA BODY PARAMETARA
    const { targetUrl, keyword }: RequestBody = await req.json();

    if (!targetUrl || !keyword) {
      return NextResponse.json({ error: 'Missing targetUrl or keyword' }, { status: 400 });
    }

    // 🚀 4. POZIV PERPLEXITY API ENGINU
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are an expert AEO (Answer Engine Optimization) auditing tool. 
            Analyze the search results gathered from the web. Your job is to check if the user's target website is mentioned, recommended, or cited in those results.

            STRICT RULE: The targetUrl must match EXACTLY as a domain or subdomain. Do not confuse it with similar-looking competitor domains (e.g., if target is 'aeoaudit-pro.com', do NOT count 'aeoaudittool.com' as a match). If it's a different domain, 'isMentioned' MUST be false.

            Strict JSON structure to follow:
            {
              "isMentioned": true/false,
              "mentionContext": "If mentioned, provide the exact sentence/context where it was recommended. If not, explain what the competitors did better to get the spot.",
              "aiAnswerSummary": "A brief 2-3 sentence overview summarizing what an AI answer engine typically tells a user for this query.",
              "topCompetitors": ["competitor1.com", "competitor2.com", "competitor3.com"]
            }`
          },
          {
            role: 'user',
            content: `Search the web for "${keyword}" to find the top recommendations, tools, or businesses. Once you have the search results, check if the website "${targetUrl}" is anywhere among the top sources or mentioned in the findings.`
          }
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      return NextResponse.json({ error: 'Invalid response from Perplexity API' }, { status: 502 });
    }

    // Čistimo i parsiramo JSON iz odgovora modela
    const rawText = data.choices[0].message.content.trim();
    const cleanJson = JSON.parse(rawText);

    // 💾 5. SPREMANJE ANALIZE U NOVU TABELU U SUPABASE + POVLJAČENJE GENERISANOG TOKENA
    const fullRadarPayload = {
      auditResult: cleanJson,
      allSourcesCrawled: data.citations || []
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
      .select("share_token") // ✨ Povlačimo automatski generisani UUID iz baze
      .single();

    if (dbInsertError) {
      console.error("⚠️ Supabase backup error logging radar scan:", dbInsertError.message);
    }

    // 💾 6. ATOMSKO UVEĆAVANJE RADAR KREDITA U SUPABASE UZ POMOĆ TVOJE AKCIJE
    await incrementRadarCount(userId); 

    // Vraćamo čist JSON nazad na frontend + dodajemo shareToken u odgovor!
    return NextResponse.json({
      ...fullRadarPayload,
      shareToken: insertedScan?.share_token || null // ✨ Klijent sada dobija unikatni ključ za dijeljenje
    });

  } catch (error) {
    console.error("AEO Radar Server Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}