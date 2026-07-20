"use client";

import { useState } from "react";
import { AuditData } from "../../lib/types";

interface DomainMetricsPanelProps {
  data: AuditData;
}

type SubTab = "overview" | "crawl" | "entities";

export default function DomainMetricsPanel({ data }: DomainMetricsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("overview");
  const stats = data.domainStats;
  
  // Safe Fallbacks za nizove da se spriječi "Cannot read properties of undefined (reading 'length')"
  const sampledPages = data?.sampledPages || [];
  const totalPagesCount = sampledPages.length || stats?.totalPagesAudited || 1;

  const missingSchemaPages = stats?.missingSchemaPages || [];
  const missingH1Pages = stats?.missingH1Pages || [];
  const detectedSchemaTypes = stats?.detectedSchemaTypes || [];

  if (!stats) {
    return (
      <div className="text-center py-8 text-slate-400 font-medium">
        No aggregated domain metrics available for this report.
      </div>
    );
  }

  const strongPages = sampledPages.filter((p) => p && typeof p.score === "number" && p.score >= 75).length;
  const moderatePages = sampledPages.filter((p) => p && typeof p.score === "number" && p.score >= 50 && p.score < 75).length;
  const weakPages = sampledPages.filter((p) => p && typeof p.score === "number" && p.score < 50).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 🚀 SUB-TABS HEADER */}
      <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
        <div className="text-xs font-black uppercase tracking-wider text-slate-500 px-3 hidden sm:block">
          Domain Intelligence
        </div>
        <div className="flex gap-1 w-full sm:w-auto">
          {[
            { id: "overview", label: "📊 Overview & Health" },
            { id: "crawl", label: "🤖 AI Crawl & Indexability" },
            { id: "entities", label: "🏷️ Semantic Graph & Entities" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
                activeSubTab === tab.id
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1. OVERVIEW & HEALTH SUB-TAB */}
      {/* =================================================================== */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                  📊 Multi-Page Sample Overview
                </div>
                <h3 className="text-xl font-black">Domain Architecture Breakdown</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Aggregated findings from {stats.totalPagesAudited || 0} discovered and sampled domain routes.
                </p>
              </div>
              <div className="bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/50 shrink-0">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Depth</span>
                <span className="text-lg font-black text-blue-400">{stats.avgWordCount || 0} words/page</span>
              </div>
            </div>

            {/* Quality Distribution Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300 font-mono">Route Quality Distribution</span>
                <span className="text-slate-400">{sampledPages.length} Routes Total</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-700/50">
                {strongPages > 0 && (
                  <div style={{ width: `${(strongPages / totalPagesCount) * 100}%` }} className="bg-emerald-500 rounded-sm h-full" />
                )}
                {moderatePages > 0 && (
                  <div style={{ width: `${(moderatePages / totalPagesCount) * 100}%` }} className="bg-amber-500 rounded-sm h-full" />
                )}
                {weakPages > 0 && (
                  <div style={{ width: `${(weakPages / totalPagesCount) * 100}%` }} className="bg-rose-500 rounded-sm h-full" />
                )}
              </div>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400 pt-1">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Strong ({strongPages})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Moderate ({moderatePages})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Weak ({weakPages})</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Schema Coverage</div>
              <div className="text-3xl font-black text-slate-900">{stats.schemaCoveragePercent || 0}%</div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Pages with JSON-LD graph objects.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">H1 Cascade Health</div>
              <div className="text-3xl font-black text-slate-900">{stats.hasH1CoveragePercent || 0}%</div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Routes with strict single-H1 tags.</p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Meta Snippet Presence</div>
              <div className="text-3xl font-black text-slate-900">{stats.hasMetaDescriptionPercent || 0}%</div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Pages with explicit meta descriptions.</p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. AI CRAWL & INDEXABILITY SUB-TAB */}
      {/* =================================================================== */}
      {activeSubTab === "crawl" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Global Robots.txt</div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-black ${stats.robotsStatus === "Blocking AI" ? "text-rose-600" : "text-emerald-600"}`}>
                  {stats.robotsStatus || "Allowed"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">AI bot crawl permissions in robots.txt.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">LLMs.txt Protocol</div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-black ${stats.hasLlmsTxt ? "text-emerald-600" : "text-amber-600"}`}>
                  {stats.hasLlmsTxt ? "Detected" : "Not Found"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Dedicated markdown guide for LLM crawlers.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Bot Protection Wall</div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-black ${stats.botProtectionDetected ? "text-rose-600" : "text-emerald-600"}`}>
                  {stats.botProtectionDetected ? "Active WAF" : "Clean Access"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Cloudflare or Soft/Hard bot challenge status.</p>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-200">OpenGraph & Social Meta Coverage</h4>
              <p className="text-xs text-slate-400 mt-1">Percentage of sampled pages with complete OG tags for multimodal AI context.</p>
            </div>
            <div className="text-2xl font-black text-blue-400 shrink-0 ml-4">
              {stats.openGraphCoveragePercent || 0}%
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. SEMANTIC GRAPH & ENTITIES SUB-TAB */}
      {/* =================================================================== */}
      {activeSubTab === "entities" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Q&A Block Density</div>
              <div className="text-3xl font-black text-slate-900">{stats.qaBlocksCoveragePercent || 0}%</div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Pages with direct Q&A blocks optimized for LLM answer extraction.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Table & List Structures</div>
              <div className="text-3xl font-black text-slate-900">{stats.tablesOrListsCoveragePercent || 0}%</div>
              <p className="text-xs text-slate-500 mt-2 font-medium">Routes containing structured tables or bullet lists easily chunked by RAG.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Discovered Schema Entity Graph Diversity
            </h4>
            {detectedSchemaTypes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No JSON-LD schema objects detected across sampled routes.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {detectedSchemaTypes.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/60 text-blue-800 text-xs font-mono font-extrabold px-3 py-1.5 rounded-xl">
                    <span>{item.type}</span>
                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-md font-sans font-bold">
                      {item.count} {item.count === 1 ? "page" : "pages"}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-800">Brand Identity Anchors (E-E-A-T)</h4>
              <p className="text-xs text-slate-500 mt-0.5">LinkedIn, X, Wikipedia, or Wikidata entity anchors mapped across domain code.</p>
            </div>
            <div className="flex gap-3 text-xs font-bold shrink-0">
              <span className={`px-3 py-1 rounded-lg ${(stats.hasSocialAnchorsPercent || 0) > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                Social Footprint: {stats.hasSocialAnchorsPercent || 0}%
              </span>
              <span className={`px-3 py-1 rounded-lg ${(stats.hasWikiLinksPercent || 0) > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                Wiki Anchor: {stats.hasWikiLinksPercent || 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ SPISAK PROBLEMATIČNIH RUTA */}
      {(missingSchemaPages.length > 0 || missingH1Pages.length > 0) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xs uppercase tracking-wider">
            <span>⚠️</span> Specific Route Deficits Across Sampled Pages
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missingSchemaPages.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-black text-slate-700">Missing Schema ({missingSchemaPages.length})</h5>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                  {missingSchemaPages.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-[11px] font-mono text-slate-600 hover:text-blue-600 truncate bg-white p-2 rounded-lg border border-slate-200">
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {missingH1Pages.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-black text-slate-700">Missing H1 Tag ({missingH1Pages.length})</h5>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                  {missingH1Pages.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-[11px] font-mono text-slate-600 hover:text-blue-600 truncate bg-white p-2 rounded-lg border border-slate-200">
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}