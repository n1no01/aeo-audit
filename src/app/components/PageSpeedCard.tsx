"use client";

import { useEffect, useState } from "react";

interface PageSpeedData {
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  metrics: {
    lcp: string;
    cls: string;
    fcp: string;
    ttfb: string;
  };
  opportunities: {
    id: string;
    title: string;
    passed: boolean;
  }[];
  error?: string;
}

export default function PageSpeedCard({ url }: { url: string }) {
  const [data, setData] = useState<PageSpeedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSpeed() {
      try {
        setLoading(true);
        const res = await fetch(`/api/page-speed?url=${encodeURIComponent(url)}&strategy=desktop`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Failed to fetch PageSpeed data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (url) {
      fetchSpeed();
    }
  }, [url]);

  if (loading) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-dashed rounded-2xl animate-pulse">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-3"></div>
        <p className="text-xs font-bold text-slate-500">
          Google Lighthouse is analyzing system performance and Core Web Vitals...
        </p>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="p-6 text-center bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-bold">
        ⚠️ Could not retrieve PageSpeed insights for this domain.
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 bg-emerald-50/50 border-emerald-100";
    if (score >= 50) return "text-amber-600 bg-amber-50/50 border-amber-100";
    return "text-rose-600 bg-rose-50/50 border-rose-100";
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* NASLOV SEKCIJE */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-2 h-6 bg-blue-600 rounded-full" />
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Google Lighthouse & AI-Agent Accessibility Audit
        </h3>
      </div>

      {/* 1. GLOBALNE OCJENE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Performance */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between bg-white shadow-sm transition-all ${getScoreColor(data.performanceScore)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400">
              Lighthouse Performance
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-800">{Math.round(data.performanceScore)}</span>
            <span className="text-xs text-slate-400 font-bold">/100</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-2 leading-tight">
            Overall raw loading power budget. Critical for execution window margins.
          </p>
        </div>

        {/* Accessibility */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between bg-white shadow-sm transition-all ${getScoreColor(data.accessibilityScore)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400">
              AI Agent Accessibility
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-800">{Math.round(data.accessibilityScore)}</span>
            <span className="text-xs text-slate-400 font-bold">/100</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-2 leading-tight">
            Measures DOM parsing efficiency. High scores mean autonomous browser agents read layout easily.
          </p>
        </div>

        {/* SEO Score */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between bg-white shadow-sm transition-all ${getScoreColor(data.seoScore)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400">
              Technical SEO Foundation
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-800">{Math.round(data.seoScore)}</span>
            <span className="text-xs text-slate-400 font-bold">/100</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-2 leading-tight">
            Basic verification of indexation tags, mobile styling parameters, and valid HTTP protocols.
          </p>
        </div>
      </div>

      {/* 2. PROŠIRENE METRIKE S TOOLTIPOVIMA */}
      <div className="bg-slate-50/50 border border-slate-200/60 rounded-3xl p-4 sm:p-6">
        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-4">
          Core RAG Grounding Performance Metrics
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* LCP METRIKA S UPITNIKOM */}
          <div className="p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">LCP</span>
              {/* Tooltip Kontejner */}
              <div className="group relative cursor-pointer">
                <span className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 transition-all">?</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 font-medium leading-normal">
                  Measures how fast the main text/content block loads. Slow LAG or RAG times cause LLM scrapers to face an empty screen snapshot due to strict internal script execution timeouts.
                </div>
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-800">{data.metrics.lcp}</div>
            <div className="text-[9px] text-slate-400 font-semibold mt-1">Main content delivery.</div>
          </div>

          {/* FCP METRIKA S UPITNIKOM */}
          <div className="p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">FCP</span>
              <div className="group relative cursor-pointer">
                <span className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 transition-all">?</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 font-medium leading-normal">
                  The exact timestamp when the browser renders the very first DOM element. High speeds confirm to crawling AI engines that the host node is fully alive and responding.
                </div>
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-800">{data.metrics.fcp}</div>
            <div className="text-[9px] text-slate-400 font-semibold mt-1">First element execution.</div>
          </div>

          {/* CLS METRIKA S UPITNIKOM */}
          <div className="p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">CLS</span>
              <div className="group relative cursor-pointer">
                <span className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 transition-all">?</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 font-medium leading-normal">
                  Measures structural layout stability. Massive content shifts confuse modern multimodal LLMs, causing them to map header titles to incorrect paragraph containers.
                </div>
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-800">{data.metrics.cls}</div>
            <div className="text-[9px] text-slate-400 font-semibold mt-1">Structural stability.</div>
          </div>

          {/* TTFB METRIKA S UPITNIKOM */}
          <div className="p-4 rounded-xl border bg-white shadow-sm flex flex-col justify-between relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">TTFB</span>
              <div className="group relative cursor-pointer">
                <span className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400 transition-all">?</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50 font-medium leading-normal">
                  Measures total server response latency. If your server takes too long to dispatch the initial payload byte, AI tools (like SearchGPT or Perplexity live pipelines) will immediately drop the task.
                </div>
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-800">{data.metrics.ttfb}</div>
            <div className="text-[9px] text-slate-400 font-semibold mt-1">Initial response byte.</div>
          </div>

        </div>
      </div>

      {/* 3. OPPORTUNITIES CHECKLIST */}
      <div className="space-y-3">
        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
          AI Agent Optimization Opportunities Checklist
        </div>
        
        <div className="space-y-2">
          {data.opportunities?.map((item) => (
            <div 
              key={item.id} 
              className={`p-3.5 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-between transition ${
                item.passed 
                  ? "bg-emerald-50/30 border-emerald-100 text-slate-700" 
                  : "bg-amber-50/40 border-amber-100 text-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                  item.passed ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                }`}>
                  {item.passed ? "✓" : "!"}
                </span>
                <span>{item.title}</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                item.passed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}>
                {item.passed ? "Optimal" : "Fix Required"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AEO INSIGHT INFO BOX */}
      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
        <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
          💡 <strong>Core AEO Insight:</strong> Page speed and DOM accessibility are fundamental grounding factors for LLM pipelines and autonomous browser agents. If a page takes too long to hydrate, executes heavy render-blocking scripts, or triggers massive layout shifts, crawling AI engines (like OpenAI&apos;s or Perplexity&apos;s live retrieval systems) face internal execution script timeouts, resulting in index dropping or stripped citations.
        </p>
      </div>

    </div>
  );
}