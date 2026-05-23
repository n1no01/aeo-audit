"use client";

import { useEffect, useState, useTransition } from "react";
import { getSharedAudit } from "../../actions";
import Tooltip from "../../components/Tooltip";
import { AuditData, AEO_EXPLANATIONS } from "../../lib/types"; 
import Link from "next/link";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default function SharedAuditPage({ params }: SharePageProps) {
  const [result, setResult] = useState<{ data: AuditData } | null>(null);
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const resolvedParams = await params;
      const res = await getSharedAudit(resolvedParams.id);

      if (res.error || !res.data) {
        setError(res.error || "Failed to retrieve the report.");
      } else {
        // Kastujemo podatke u AuditData strukturu kako bi odgovaralo dashboard layoutu
        setResult({ data: res.data as unknown as AuditData });
        setTargetUrl(res.url || "");
      }
    });
  }, [params]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-[24px] p-8 max-w-md w-full text-center shadow-xl">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-black text-slate-800 mb-2">Report Not Found</h1>
          <p className="text-slate-500 text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (isPending || !result?.data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Loading Secure Intelligence Report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      
      {/* JAVNI NAVBAR */}
      <nav className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex justify-between items-center bg-transparent">
        <div className="text-2xl font-black tracking-tight italic select-none">
          AEO<span className="text-blue-600">Audit</span> Pro
        </div>
        <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-black uppercase tracking-wider text-blue-600">
          Public Intelligence Report
        </div>
      </nav>

      {/* GLAVNI OKVIR IZVJEŠTAJA (Preslikan sa Dashboarda) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 md:px-12 flex-1 w-full mt-6 mb-16">
        <div className="bg-white rounded-[24px] md:rounded-[48px] overflow-hidden border border-slate-100 shadow-2xl">
          
          {/* AUDIT TOP BAR */}
          <div className="bg-slate-900 text-white p-5 sm:p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 md:gap-8 w-full md:w-auto">
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-[16px] sm:rounded-[20px] bg-white text-slate-900 flex flex-col items-center justify-center shrink-0 shadow-lg mx-auto sm:mx-0">
                <span className="text-3xl sm:text-5xl font-black">{result.data.score}</span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-0.5 sm:mt-1">Score</span>
              </div>
              <div className="text-center sm:text-left w-full sm:w-auto overflow-hidden">
                {result.data.pageCategory && (
                  <div className="inline-flex items-center px-2.5 py-1 mb-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                    <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase text-blue-400">
                      Niche: {result.data.pageCategory}
                    </span>
                  </div>
                )}
                <h2 className="text-xl sm:text-3xl font-black tracking-tight">AEO Performance Audit</h2>
                <p className="text-slate-400 mt-1.5 text-xs sm:text-sm truncate max-w-full">Target: {targetUrl}</p>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 w-full md:w-auto text-center">
              <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-blue-400 font-black mb-0.5 sm:mb-1">OPTIMIZATION STATE</div>
              <div className="text-lg sm:text-2xl font-black italic uppercase text-white">{result.data.score >= 75 ? "Strong" : result.data.score >= 50 ? "Moderate" : "Weak"}</div>
            </div>
          </div>

          {/* SADRŽAJ KARTICA (Identifikacija Core Metrics sekcije) */}
          <div className="p-4 sm:p-8 md:p-12 space-y-6 sm:space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* CRAWLER MATRIX */}
              <div className="border border-slate-200/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-slate-50/50 flex flex-col justify-between">
                <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 flex items-center">
                  AI Search Crawler Status
                  <Tooltip text={AEO_EXPLANATIONS.crawlerStatus} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { n: "ChatGPT", v: result.data.aiBotsStatus?.gptBot },
                    { n: "OpenAI Search", v: result.data.aiBotsStatus?.oaiSearchBot },
                    { n: "Perplexity", v: result.data.aiBotsStatus?.perplexityBot },
                    { n: "ClaudeBot", v: result.data.aiBotsStatus?.claudeBot },
                    { n: "Gemini Ext.", v: result.data.aiBotsStatus?.googleExtended },
                    { n: "DeepSeek Bot", v: result.data.aiBotsStatus?.deepSeekBot },
                    { n: "Apple Bot Extended", v: result.data.aiBotsStatus?.appleBotExtended },
                    { n: "Bing Bot", v: result.data.aiBotsStatus?.bingbot },
                    { n: "Cohere AI", v: result.data.aiBotsStatus?.cohereAi },
                  ].map((b, idx) => (
                    <div key={idx} className="bg-white border border-slate-100 p-2 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-slate-600 truncate mr-1">{b.n}</span>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${b.v === "Allowed" ? "bg-emerald-500" : "bg-amber-400"}`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* BRAND DISAMBIGUATION */}
              <div className="border border-slate-200/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 flex items-center">
                    AEO Tokenizer Brand Disambiguation
                    <Tooltip text={AEO_EXPLANATIONS.brandDisambiguation} />
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      result.data.entityTrustMap?.brandDisambiguationStatus === "Optimal" ? "bg-emerald-500" :
                      result.data.entityTrustMap?.brandDisambiguationStatus === "Inconsistent" ? "bg-amber-400" : "bg-rose-500"
                    }`} />
                    <span className={`text-xs font-black tracking-wider uppercase ${
                      result.data.entityTrustMap?.brandDisambiguationStatus === "Optimal" ? "text-emerald-700" :
                      result.data.entityTrustMap?.brandDisambiguationStatus === "Inconsistent" ? "text-amber-700" : "text-rose-700"
                    }`}>
                      {result.data.entityTrustMap?.brandDisambiguationStatus === "Optimal" && "Optimal Consistency"}
                      {result.data.entityTrustMap?.brandDisambiguationStatus === "Inconsistent" && "Inconsistent Tokenization"}
                      {result.data.entityTrustMap?.brandDisambiguationStatus === "Critical Missing" && "Missing Identity Vectors"}
                    </span>
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Identified Identity Strings:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.data.entityTrustMap && result.data.entityTrustMap.detectedBrandVariants.length > 0 ? (
                      result.data.entityTrustMap.detectedBrandVariants.map((v, i) => (
                        <span key={i} className="bg-white border border-slate-200/80 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600">
                          {v}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">No explicit brand name anchors parsed cleanly.</span>
                    )}
                  </div>
                </div>
                
                <p className="text-[10px] font-medium text-slate-400 mt-4 leading-tight">
                  {result.data.entityTrustMap?.brandDisambiguationStatus === "Optimal" && "LLMs can accurately map your company name across global knowledge graphs without identity clashes."}
                  {result.data.entityTrustMap?.brandDisambiguationStatus === "Inconsistent" && "Warning: Multiple structural variations confuse AI text tokenizers. Standardize names in your Schema and Copyright text."}
                  {result.data.entityTrustMap?.brandDisambiguationStatus === "Critical Missing" && "Critical: AI crawlers cannot extract a singular brand entity name anchor. Citing chance is highly restricted."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* KNOWLEDGE GRAPH */}
              <div className="border border-slate-200/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Knowledge Graph & Entity Blueprint</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                      <span className="text-slate-600 truncate pr-2 flex items-center">
                        Authority Reference Outlinks (Wikipedia/Data)
                        <Tooltip text={AEO_EXPLANATIONS.authorityOutlinks} />
                      </span>
                      <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${result.data.entityTrustMap?.hasWikidataOrWikipedia ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {result.data.entityTrustMap?.hasWikidataOrWikipedia ? "VERIFIED" : "MISSING"}
                      </span>
                    </div>

                    {[
                      { label: "LinkedIn Identity Profile Connection", checked: result.data.entityTrustMap?.hasLinkedIn },
                      { label: "X / Twitter Account Integration", checked: result.data.entityTrustMap?.hasXAccount },
                      { label: "Facebook Page Account Integration", checked: result.data.entityTrustMap?.hasFacebookAccount },
                      { label: "NAP Local Coordinates Validation", checked: result.data.entityTrustMap?.hasPhysicalSignals },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                        <span className="text-slate-600 truncate pr-2">{item.label}</span>
                        <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${item.checked ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                          {item.checked ? "VERIFIED" : "MISSING"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SEMANTIC & MULTIMODAL */}
              <div className="border border-slate-200/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">AI Semantic & Multimodal Blueprint</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                      <span className="text-slate-600 flex items-center">
                        HTML5 Semantic &lt;main&gt; Isolation
                        <Tooltip text={AEO_EXPLANATIONS.mainTag} />
                      </span>
                      <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${result.data.semanticLayoutMap?.hasMainTag ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                        {result.data.semanticLayoutMap?.hasMainTag ? "VALID" : "GENERIC DIVS"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                      <span className="text-slate-600 flex items-center">
                        HTML5 Article Core Container
                        <Tooltip text={AEO_EXPLANATIONS.articleTag} />
                      </span>
                      <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${result.data.semanticLayoutMap?.hasArticleTag ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {result.data.semanticLayoutMap?.hasArticleTag ? "DETECTED" : "ABSENT"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                      <span className="text-slate-600 flex items-center">
                        Heading Hierarchy Structural Cascade
                        <Tooltip text={AEO_EXPLANATIONS.headingCascade} />
                      </span>
                      <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${!result.data.semanticLayoutMap?.hasHeadingLeap ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                        {!result.data.semanticLayoutMap?.hasHeadingLeap ? "HEALTHY" : "LEAP ANOMALY"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                      <span className="text-slate-600 flex items-center">
                        Multimodal Image Alt Coverage
                        <Tooltip text={AEO_EXPLANATIONS.imageAlt} />
                      </span>
                      <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${result.data.semanticLayoutMap && result.data.semanticLayoutMap.missingAltCount === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                        {result.data.semanticLayoutMap ? result.data.semanticLayoutMap.totalImages - result.data.semanticLayoutMap.missingAltCount : 0}/{result.data.semanticLayoutMap ? result.data.semanticLayoutMap.totalImages : 0} ALT TAGS
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                      <span className="text-slate-600 flex items-center">
                        Visual RAG Integration (Video Embeds)
                        <Tooltip text="Verifies if the page incorporates optimized embedded rich video content preferred by Google multimodal pipelines." />
                      </span>
                      <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${result.data.hasVideoElements ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                        {result.data.hasVideoElements ? "OPTIMIZED" : "NO VIDEO FOUND"}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] font-medium text-slate-400 mt-3 leading-tight">
                  Multimodal models (GPT-4o/Gemini) use structural HTML tags, image descriptions, and embedded rich video modules to extract rich semantic layers.
                </p>
              </div>
            </div>

            {/* HIBRIDNI SPEED & TEHNIČKI GRID */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between shadow-sm">
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 flex items-center gap-1">
                    Word Count
                    <Tooltip text={AEO_EXPLANATIONS.wordCount} />
                  </div>
                  <div className="font-bold text-slate-800 text-xs sm:text-sm break-words">{result.data.wordCount} words</div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between shadow-sm">
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 flex items-center gap-1">
                    Conversational Q&A Loops
                    <Tooltip text={AEO_EXPLANATIONS.qaLoops} />
                  </div>
                  <div className="font-bold text-slate-800 text-xs sm:text-sm break-words">{result.data.qaBlocksCount} Blocks</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs font-bold flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] sm:text-[10px] uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                    Robots.txt Architecture
                    <Tooltip text="Verifies AI agent clearance and crawling directives in the root robots.txt layout." />
                  </span>
                  <span className="text-slate-700 font-bold text-xs sm:text-sm break-words">{result.data.robotsStatus}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between shadow-sm relative">
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 flex items-center gap-1">
                    Semantic Layout Density
                    <Tooltip text={AEO_EXPLANATIONS.layoutDensity} />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
                    Status: <span className={result.data.hasTablesOrLists ? "text-emerald-700" : "text-amber-700"}>
                      {result.data.hasTablesOrLists ? "Rich Layout (Tables / Lists Active)" : "Low Density Text Blocks"}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 mt-2 leading-normal">
                    Data tables and HTML lists allow structured RAG pipelines to parse data arrays efficiently without relying on text chunking inferences.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between shadow-sm relative">
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 flex items-center gap-1">
                    JS Rendering Index
                    <Tooltip text="Measures if your content requires heavy Client-Side JavaScript execution for AI crawlers to read it." />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed flex items-center gap-2">
                    Engine State: 
                    <span className={`inline-flex items-center gap-1.5 font-bold ${result.data.javascriptDependency === "Low" ? "text-emerald-700" : "text-amber-700"}`}>
                      <span className={`w-2 h-2 rounded-full ${result.data.javascriptDependency === "Low" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                      {result.data.javascriptDependency === "Low" ? "SSR Optimized (AI-Friendly)" : "CSR Dependency (High Timeout Risk)"}
                    </span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 mt-2 leading-normal">
                    {result.data.javascriptDependency === "Low"
                      ? "Content is directly baked into the initial HTML server payload. Fast, lightweight, and perfectly optimized for strict AI crawler timeouts."
                      : "Critical Warning: Google guidelines note heavy JS architectures are complex for AI. Crawlers may time out on hydration, leaving your site invisible."}
                  </p>
                </div>
              </div>
            </div>

            {/* METADATA & SCHEMA SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <MetricCard label="Meta Title" value={result.data.title} />
              <MetricCard label="H1 Header" value={result.data.h1} />
              <MetricCard label="Meta Description" value={result.data.metaDescription} />
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 border">
                <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Detected Schema Entities</div>
                <div className="flex flex-wrap gap-1.5">{result.data.detectedSchemas.length > 0 ? result.data.detectedSchemas.map((s, i) => <span key={i} className="bg-white border text-slate-700 text-[11px] px-2.5 py-1 rounded-lg font-bold shadow-sm">{s}</span>) : <span className="text-slate-400 text-xs italic">No items parsed.</span>}</div>
              </div>
            </div>

            {/* EXECUTIVE DIAGNOSTICS */}
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Executive LLM Diagnostics</div>
              <div className="bg-slate-50 rounded-[16px] p-4 sm:p-5 border text-sm leading-relaxed text-slate-700 whitespace-pre-line font-medium shadow-inner">{result.data.aiAnalysis}</div>
            </div>

            {/* STRATEGIC PLAYBOOK */}
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Prioritized Optimization Playbook</div>
              <div className="space-y-3 sm:space-y-4">
                {result.data.recommendations.map((item, idx) => (
                  <div key={idx} className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 font-bold text-slate-800 text-sm flex items-start gap-3 sm:gap-4">
                    <span className="bg-blue-600 text-white rounded-xl w-7 h-7 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{idx + 1}</span>
                    <div className="leading-relaxed">{item}</div>
                  </div>
                ))}

                {result.data.javascriptDependency === "Critical" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-slate-800 text-sm flex items-start gap-4">
                    <span className="bg-amber-500 text-white rounded-xl w-7 h-7 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">🚨</span>
                    <div className="leading-relaxed">
                      <span className="font-black text-amber-900 block mb-1">Critical Architecture Fix: High JavaScript Framework Dependency</span>
                      Our crawl engine detected that your DOM structure loads empty initial templates and relies on heavy Client-Side JavaScript hydration. According to Google&apos;s 2026 AI guidelines, this significantly increases RAG parser timeouts. 
                      <strong className="block mt-2 font-bold text-amber-950">Required Action:</strong> Migrating to Server-Side Rendering (Next.js/Nuxt.js) or deploying an aggressive static pre-rendering middleware layer (Prerender.io) is highly recommended to make content readable for rapid AI indexers.
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* VIRAL MARKETING FOOTER LOOP */}
      <footer className="border-t border-slate-200/50 py-8 text-center text-xs bg-white w-full px-4 flex flex-col items-center gap-2">
        <div className="font-bold text-slate-400">&copy; 2026 AEO Audit Pro. All rights reserved.</div>
        <div className="bg-slate-50 border border-slate-200/60 rounded-full px-4 py-2 text-slate-600 font-bold text-[11px]">
          🚀 Want to audit your own website?{" "}
          <Link href="/" className="text-blue-600 hover:underline font-black ml-1">
            Analyze AI Visibility Free &rarr;
          </Link>
        </div>
      </footer>

    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border flex flex-col justify-between">
      <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">{label}</div>
      <div className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed break-words">{value}</div>
    </div>
  );
}