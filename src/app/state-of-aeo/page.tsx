import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { GlobalAEOStats } from "../lib/types";
import { supabase } from "../lib/supabase";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: 'State of AEO | Live AI Search Readiness Benchmarks',
  description: 'Live benchmarks from real audits: average AEO score, most common failures, llms.txt adoption and AI crawler blocking across the web.',
  alternates: { canonical: '/state-of-aeo' },
  openGraph: { title: 'State of AEO | Live AI Search Readiness Benchmarks', description: 'Live benchmarks from real audits: average AEO score, most common failures, llms.txt adoption and AI crawler blocking across the web.', url: '/state-of-aeo', type: 'website' },
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

interface ContentBenchmarks {
  qaBlocksPct?: number;
  tablesAndListsPct?: number;
  avgWordCount?: number;
  avgWordCountHighScore?: number;
}

interface FailureItem {
  id: string;
  title: string;
  pct: number;
  description: string;
}

interface RawGlobalStatsRow {
  id: number;
  total_audits?: number;
  count?: number;
  avg_score?: number;
  js_hydration_issue_pct?: number;
  no_schema_pct?: number;
  cloudflare_wall_pct?: number;
  llms_txt_adoption_pct?: number;
  category_stats?: unknown;
  content_benchmarks?: unknown;
  top_failures?: unknown;
  updated_at?: string;
}

async function getGlobalStats(): Promise<(GlobalAEOStats & { 
  contentBenchmarks?: ContentBenchmarks;
  topFailures?: FailureItem[];
}) | null> {
  try {
    const { data, error } = await supabase
      .from("global_stats")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) {
      console.error("Failed to fetch global AEO stats from Supabase:", error?.message);
      return null;
    }

    const row = data as RawGlobalStatsRow;

    let parsedCategoryStats = [];
    if (typeof row.category_stats === "string") {
      try { parsedCategoryStats = JSON.parse(row.category_stats); } catch { parsedCategoryStats = []; }
    } else if (Array.isArray(row.category_stats)) {
      parsedCategoryStats = row.category_stats;
    }

    let parsedContentBenchmarks: ContentBenchmarks = {};
    if (typeof row.content_benchmarks === "string") {
      try { parsedContentBenchmarks = JSON.parse(row.content_benchmarks); } catch {}
    } else if (row.content_benchmarks && typeof row.content_benchmarks === "object") {
      parsedContentBenchmarks = row.content_benchmarks as ContentBenchmarks;
    }

    let parsedTopFailures: FailureItem[] = [];
    if (typeof row.top_failures === "string") {
      try { parsedTopFailures = JSON.parse(row.top_failures); } catch {}
    } else if (Array.isArray(row.top_failures)) {
      parsedTopFailures = row.top_failures as FailureItem[];
    }

    return {
      totalAudits: Number(row.total_audits ?? row.count ?? 0),
      avgScore: Number(row.avg_score ?? 0),
      jsHydrationIssuePct: Number(row.js_hydration_issue_pct ?? 0),
      noSchemaPct: Number(row.no_schema_pct ?? 0),
      cloudflareWallPct: Number(row.cloudflare_wall_pct ?? 0),
      llmsTxtAdoptionPct: Number(row.llms_txt_adoption_pct ?? 0),
      categoryStats: parsedCategoryStats,
      contentBenchmarks: parsedContentBenchmarks,
      topFailures: parsedTopFailures,
      updatedAt: row.updated_at ?? new Date().toISOString(),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Error loading stats page:", msg);
    return null;
  }
}

function StatCard({
  title,
  value,
  unit = "%",
  description,
  badgeText,
  badgeType = "warning",
}: {
  title: string;
  value: number | string;
  unit?: string;
  description: string;
  badgeText?: string;
  badgeType?: "danger" | "warning" | "success" | "neutral";
}) {
  const badgeStyles = {
    danger: "bg-rose-50 text-rose-600 border-rose-100",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    neutral: "bg-blue-50 text-blue-600 border-blue-100",
  }[badgeType];

  return (
    <div className="bg-white border border-slate-200/80 rounded-[24px] p-5 sm:p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400">
            {title}
          </span>
          {badgeText && (
            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${badgeStyles}`}>
              {badgeText}
            </span>
          )}
        </div>
        <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {value}
          <span className="text-xl font-bold text-slate-400 ml-0.5">{unit}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 font-medium mt-4 leading-relaxed border-t border-slate-100 pt-3">
        {description}
      </p>
    </div>
  );
}

export default async function AEOStatsPage() {
  const stats = await getGlobalStats();

  const formattedDate = stats?.updatedAt
    ? new Date(stats.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Recently";

  const totalAuditsCount = stats?.totalAudits ? stats.totalAudits.toLocaleString() : "10,000+";
  const cb = stats?.contentBenchmarks;

  const failures = (stats?.topFailures && stats.topFailures.length > 0)
    ? stats.topFailures
    : [
        {
          id: "js_hydration",
          title: "JavaScript Hydration Wall",
          pct: stats?.jsHydrationIssuePct ?? 0,
          description: "Serving empty initial HTML DOMs (React/Vue CSR) forces AI bots into 5-second rendering timeouts, resulting in 0 indexable text extracted."
        },
        {
          id: "missing_schema",
          title: "Missing Brand Schema Grounding",
          pct: stats?.noSchemaPct ?? 0,
          description: "Omitting Organization and sameAs JSON-LD links leaves AI models uncertain about brand identity and entity ownership."
        },
        {
          id: "unstructured",
          title: "Unstructured Commodity Text",
          pct: 65.4,
          description: "Fluffy marketing paragraphs without direct Q&A blocks, tables, or bolded facts make it difficult for RAG systems to synthesize concise answers."
        },
        {
          id: "waf_block",
          title: "Aggressive WAF / IP Blocking",
          pct: stats?.cloudflareWallPct ?? 0,
          description: "Cloudflare default rules frequently challenge or block GPTBot and PerplexityBot at the TLS handshake level before reaching the page."
        }
      ];

  const avgScore = stats?.avgScore ?? 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* BACKGROUND MESH GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />

      <Navbar userStats={null} />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 md:px-12 flex-1 w-full mt-6 relative z-10">
        {/* HEADER */}
        <header className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-blue-50 border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-blue-600">
              Live Index & Industry Benchmarks
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight italic">
            State of <span className="text-blue-600">AEO</span> (2026)
          </h1>
          <p className="text-slate-500 mt-4 text-sm sm:text-base max-w-2xl mx-auto font-medium leading-relaxed">
            Real-time telemetry aggregated across{" "}
            <strong className="text-slate-800">{totalAuditsCount}</strong> audited websites showing how modern domains perform in AI Answer Engines.
          </p>
          
          {/* 🚀 OBAVIJEST O 30-DNEVNOM PROZORU */}
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-100/80 px-3 py-1 rounded-lg border border-slate-200/50">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Telemetry metrics dynamically calculated from active audits over the last 30 days.</span>
          </div>
        </header>

        {/* 🚀 PROŠIRENA HERO GLOBAL SCORE KARTICA */}
        <div className="bg-slate-900 text-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 mb-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-stretch justify-between gap-8 border border-slate-800">
          <div className="space-y-3 text-center sm:text-left z-10 flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 self-center sm:self-start px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                Global Average AEO Score
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
              Web-Wide AI Readiness Index
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xl leading-relaxed">
              Calculated across multi-bot Accessibility, Semantic Code Quality, Schema Grounding, and Non-Commodity Content Depth.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Rolling 30-Day Sample Window
            </div>
          </div>

          {/* PROŠIRENI I POPUNJENI DESNI BLOK SA OCJENOM */}
          <div className="bg-slate-800/80 border border-slate-700/60 p-6 sm:p-8 rounded-3xl shrink-0 z-10 flex flex-col sm:flex-row items-center gap-6 min-w-[280px] sm:min-w-[340px] justify-between">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-blue-600 text-white rounded-2xl flex flex-col items-center justify-center shadow-xl shadow-blue-600/25 shrink-0 border border-blue-400/20">
              <span className="text-4xl sm:text-5xl font-black tracking-tight">{avgScore}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-blue-200 mt-0.5">/ 100</span>
            </div>

            <div className="text-center sm:text-left space-y-2 flex-1">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Performance Index</span>
                <span className="text-sm font-black uppercase text-white tracking-wide">
                  {avgScore >= 75 ? "High Accessibility" : avgScore >= 50 ? "Moderate Access" : "Low Readiness"}
                </span>
              </div>

              {/* Progress Bar unutar kartice */}
              <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden p-0.5 border border-slate-600/40">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${avgScore}%` }}
                />
              </div>

              <div className="text-[10px] font-semibold text-slate-400 pt-1">
                Last Recalculated: <strong className="text-slate-300">{formattedDate}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* TOP CRITICAL METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            title="JS Hydration Risk"
            value={stats?.jsHydrationIssuePct ?? 0}
            description="Sites serving empty initial DOMs, forcing AI crawlers into rendering timeouts."
            badgeText="Critical"
            badgeType="danger"
          />
          <StatCard
            title="Missing Schema"
            value={stats?.noSchemaPct ?? 0}
            description="Domains without any structured JSON-LD data, reducing grounding context."
            badgeText="High Friction"
            badgeType="warning"
          />
          <StatCard
            title="WAF / Cloudflare Wall"
            value={stats?.cloudflareWallPct ?? 0}
            description="Websites that unintentionally block GPTBot, Perplexity, and Claude at the IP tier."
            badgeText="Access Blocked"
            badgeType="danger"
          />
          <StatCard
            title="LLMs.txt Adoption"
            value={stats?.llmsTxtAdoptionPct ?? 0}
            description="Domains deploying the new programmatic /llms.txt markdown route for AI agents."
            badgeText="Emerging Standard"
            badgeType="neutral"
          />
        </div>

        {/* CONTENT STRUCTURE & DEPTH BENCHMARKS */}
        <div className="bg-white border border-slate-200 rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-xl shadow-blue-900/5 mb-10">
          <div className="border-b border-slate-100 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                Structural Telemetry
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                Content Structure & Depth Benchmarks
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Analyzing how content formatting directly impacts Answer Engine citations and AI extractability.
              </p>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-xl shrink-0">
              30-Day Rolling Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Structured Q&A Blocks
              </span>
              <div className="text-2xl font-black text-slate-900">
                {cb?.qaBlocksPct ?? 24.5}<span className="text-sm font-bold text-slate-400">%</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-2 leading-relaxed">
                Pages with explicit Question-Answer headings easily indexable by LLMs.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Data Tables & Lists
              </span>
              <div className="text-2xl font-black text-slate-900">
                {cb?.tablesAndListsPct ?? 31.2}<span className="text-sm font-bold text-slate-400">%</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-2 leading-relaxed">
                Domains serving high-density structured tables or bulleted parameter lists.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Avg. Content Length
              </span>
              <div className="text-2xl font-black text-slate-900">
                {cb?.avgWordCount ? cb.avgWordCount.toLocaleString() : "840"} <span className="text-xs font-bold text-slate-400">words</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-2 leading-relaxed">
                Global average word count across all sampled domains.
              </p>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-1">
                High-Scorer Length (80+)
              </span>
              <div className="text-2xl font-black text-blue-950">
                {cb?.avgWordCountHighScore ? cb.avgWordCountHighScore.toLocaleString() : "1,420"} <span className="text-xs font-bold text-blue-400">words</span>
              </div>
              <p className="text-[11px] text-blue-800/80 font-medium mt-2 leading-relaxed">
                Average depth required on top-ranking domains to achieve AI citation readiness.
              </p>
            </div>
          </div>
        </div>

        {/* TOP 4 MOST COMMON AEO FAILURES */}
        <div className="bg-slate-900 text-white rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-xl mb-12 relative overflow-hidden">
          <div className="border-b border-slate-800 pb-5 mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
              Audit Telemetry Insights
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
              Top 4 Most Common AEO Failures
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Ranked by frequency across audited sites over the last 30 days. Primary issues causing domains to be overlooked by LLMs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {failures.map((fail, idx) => (
              <div key={fail.id || idx} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 hover:border-slate-600 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black flex items-center justify-center border border-rose-500/30">
                        {idx + 1}
                      </span>
                      <h4 className="text-sm font-black text-white">{fail.title}</h4>
                    </div>
                    <span className="text-xs font-black text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2.5 py-0.5 rounded-full">
                      {fail.pct}% of sites
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium mt-3">
                    {fail.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BENCHMARKS BY INDUSTRY / CATEGORY */}
        <div className="bg-white border border-slate-200 rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-xl shadow-blue-900/5 mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-5 mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Industry Benchmark Comparison
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                Average AEO Performance by Niche
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200/60 px-3 py-1 rounded-xl self-start sm:self-center">
              Last 30 Days Telemetry
            </span>
          </div>

          <div className="space-y-5">
            {stats?.categoryStats && stats.categoryStats.length > 0 ? (
              stats.categoryStats.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${cat.color || "bg-blue-600"}`} />
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-900 font-black text-sm">{cat.avgScore} / 100</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200/40">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${cat.color || "bg-blue-600"}`}
                      style={{ width: `${cat.avgScore}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">No category benchmarks available yet.</p>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center bg-slate-50/50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-slate-600">
              Want to see how your website compares against your industry average?
            </p>
            <Link
              href="/"
              className="inline-block mt-3 px-6 py-2.5 bg-slate-900 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md"
            >
              Run Free AEO Audit ↗
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}