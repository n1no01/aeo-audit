import { NextResponse } from "next/server";
import { AuditData } from "@/app/lib/types";
import { supabase } from "../../../lib/supabase";

// 🚀 OSIGURAVA DA VERCEL NE KEŠIRA DNEVNI CRON
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AuditRow {
  website_url: string;
  result_data: AuditData;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  // Fail CLOSED: without a configured secret the endpoint is public (and /api/cron is a public path in proxy.ts).
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Last 30 days only (the response used to say "sampleSize30Days" while reading the whole table),
    // newest first so that one URL audited many times counts once.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: allRows, error: fetchError } = await supabase
      .from("audits")
      .select("website_url, result_data")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);

    const seenUrls = new Set<string>();
    const rawAudits = (allRows ?? []).filter((r: { website_url: string }) => {
      if (seenUrls.has(r.website_url)) return false;
      seenUrls.add(r.website_url);
      return true;
    });

    if (fetchError) {
      throw new Error(`Supabase fetch error: ${fetchError.message}`);
    }

    if (!rawAudits || rawAudits.length === 0) {
      return NextResponse.json({ message: "No audits found to recalculate." });
    }

    const audits = rawAudits as unknown as AuditRow[];
    const activeAuditsCount = audits.length;

    let totalScoreSum = 0;
    let jsHydrationCount = 0;
    let noSchemaCount = 0;
    let cloudflareWallCount = 0;
    let llmsTxtCount = 0;

    let qaBlockCount = 0;
    let tableOrListCount = 0;
    let totalWordCountSum = 0;
    let highScoreWordCountSum = 0;
    let highScorePagesCount = 0;

    const categoriesMap: Record<string, { totalScore: number; count: number }> = {};

    for (const row of audits) {
      const data: AuditData = row.result_data;
      if (!data) continue;

      const score = Number(data.score || 0);
      totalScoreSum += score;

      if (data.javascriptDependency === "Critical") jsHydrationCount++;
      if (!data.detectedSchemas || data.detectedSchemas.length === 0) noSchemaCount++;
      if (data.aiAccessibility?.cloudflareSeverity === "Hard") cloudflareWallCount++;
      if (data.llmsTxtStatus === "Present") llmsTxtCount++;

      if (data.qaBlocksCount && data.qaBlocksCount > 0) qaBlockCount++;
      if (data.hasTablesOrLists) tableOrListCount++;
      
      const words = Number(data.wordCount || 0);
      totalWordCountSum += words;

      if (score >= 75) {
        highScoreWordCountSum += words;
        highScorePagesCount++;
      }

      const cat = data.pageCategory || data.pageType || "General";
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { totalScore: 0, count: 0 };
      }
      categoriesMap[cat].totalScore += score;
      categoriesMap[cat].count++;
    }

    const avgScore = Number((totalScoreSum / activeAuditsCount).toFixed(1));
    const jsHydrationIssuePct = Number(((jsHydrationCount / activeAuditsCount) * 100).toFixed(1));
    const noSchemaPct = Number(((noSchemaCount / activeAuditsCount) * 100).toFixed(1));
    const cloudflareWallPct = Number(((cloudflareWallCount / activeAuditsCount) * 100).toFixed(1));
    const llmsTxtAdoptionPct = Number(((llmsTxtCount / activeAuditsCount) * 100).toFixed(1));

    const qaBlocksPct = Number(((qaBlockCount / activeAuditsCount) * 100).toFixed(1));
    const tablesAndListsPct = Number(((tableOrListCount / activeAuditsCount) * 100).toFixed(1));
    const avgWordCount = Math.round(totalWordCountSum / activeAuditsCount);
    const avgWordCountHighScore = highScorePagesCount > 0 
      ? Math.round(highScoreWordCountSum / highScorePagesCount) 
      : avgWordCount;

    // Procenat sajtova koji NEMU nikakvu strukturu (niti QA niti tabele)
    const unstructuredPct = Number((((activeAuditsCount - Math.max(qaBlockCount, tableOrListCount)) / activeAuditsCount) * 100).toFixed(1));

    const categoryColors: Record<string, string> = {
      SaaS: "bg-blue-600",
      Commercial: "bg-amber-500",
      Article: "bg-indigo-600",
      Homepage: "bg-emerald-500",
      FAQ: "bg-purple-600",
      About: "bg-rose-500",
      General: "bg-slate-600",
    };

    const categoryStats = Object.keys(categoriesMap).map((catName) => {
      const item = categoriesMap[catName];
      return {
        name: catName,
        avgScore: Number((item.totalScore / item.count).toFixed(1)),
        audits: item.count,
        color: categoryColors[catName] || "bg-blue-500",
      };
    }).sort((a, b) => b.audits - a.audits);

    const contentBenchmarks = {
      qaBlocksPct,
      tablesAndListsPct,
      avgWordCount,
      avgWordCountHighScore,
    };

    // Dinamički sortirane top 4 greške po učestalosti
    const topFailures = [
      {
        id: "js_hydration",
        title: "JavaScript Hydration Wall",
        pct: jsHydrationIssuePct,
        description: "Serving empty initial HTML DOMs (React/Vue CSR) forces AI bots into rendering timeouts, resulting in 0 indexable text extracted."
      },
      {
        id: "missing_schema",
        title: "Missing Brand Schema Grounding",
        pct: noSchemaPct,
        description: "Omitting Organization and sameAs JSON-LD links leaves AI models uncertain about brand identity and entity ownership."
      },
      {
        id: "waf_block",
        title: "Aggressive WAF / IP Blocking",
        pct: cloudflareWallPct,
        description: "Cloudflare default rules frequently challenge or block GPTBot and PerplexityBot at the TLS handshake level before reaching the page."
      },
      {
        id: "unstructured",
        title: "Unstructured Commodity Text",
        pct: unstructuredPct,
        description: "Fluffy marketing paragraphs without direct Q&A blocks, tables, or bolded facts make it difficult for RAG systems to synthesize concise answers."
      }
    ].sort((a, b) => b.pct - a.pct);

    const { data: firstRow } = await supabase
      .from("global_stats")
      .select("id")
      .limit(1)
      .single();

    if (!firstRow) {
      throw new Error("No record found in global_stats table to update.");
    }

    const { error: updateError } = await supabase
      .from("global_stats")
      .update({
        avg_score: avgScore,
        js_hydration_issue_pct: jsHydrationIssuePct,
        no_schema_pct: noSchemaPct,
        cloudflare_wall_pct: cloudflareWallPct,
        llms_txt_adoption_pct: llmsTxtAdoptionPct,
        category_stats: categoryStats,
        content_benchmarks: contentBenchmarks,
        top_failures: topFailures,
        updated_at: new Date().toISOString(),
      })
      .eq("id", firstRow.id);

    if (updateError) {
      throw new Error(`Supabase update error: ${updateError.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      sampleSize30Days: activeAuditsCount,
      updated: new Date().toISOString() 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Error recalculating AEO stats:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}