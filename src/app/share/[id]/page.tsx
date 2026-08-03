"use client";

import { useEffect, useState, useTransition } from "react";
import { getSharedAudit } from "../../actions";
import Tooltip from "../../components/Tooltip";
import DomainMetricsPanel from "../../components/dashboard/DomainMetricsPanel";
import MetricsPanel from "../../components/dashboard/MetricsPanel";
import KeywordsPanel from "../../components/dashboard/KeywordsPanel";
import InsightsPanel from "../../components/dashboard/InsightsPanel";
import RecommendationsPanel from "../../components/dashboard/RecommendationsPanel";
import SimulatorPanel from "../../components/dashboard/SimulatorPanel";
import LlmsPanel from "../../components/dashboard/LlmsPanel";
import PageSpeedCard from "../../components/PageSpeedCard";

import { AuditData, TabId } from "../../lib/types"; 
import Link from "next/link";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

type ActiveTabType = TabId | "simulator" | "speed" | "llms" | "keywords";

export default function SharedAuditPage({ params }: SharePageProps) {
  const [result, setResult] = useState<{ data: AuditData } | null>(null);
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ActiveTabType>("metrics");

  useEffect(() => {
    startTransition(async () => {
      const resolvedParams = await params;
      const res = await getSharedAudit(resolvedParams.id);

      if (res.error || !res.data) {
        setError(res.error || "Failed to retrieve the report.");
      } else {
        setResult({ data: res.data as unknown as AuditData });
        setTargetUrl(res.url || "");
      }
    });
  }, [params]);

  const getCleanHostname = () => {
    const url = targetUrl || result?.data?.website_url || "";
    if (!url) return "this brand";
    try {
      const parsingUrl = url.startsWith("http") ? url : `https://${url}`;
      return new URL(parsingUrl).hostname.replace("www.", "");
    } catch {
      return url.replace("https://", "").replace("http://", "").replace("www.", "");
    }
  };

  const navTabs = [
    { id: "metrics", label: "Overview & Metrics" },
    { id: "keywords", label: "Keywords & Entities" },
    { id: "analysis", label: "AI Insights" },
    { id: "recommendations", label: "Actions" },
    { id: "simulator", label: "SERP Simulator" },
    { id: "speed", label: "PageSpeed" },
    { id: "robots", label: "Robots.txt" },
    { id: "llms", label: "LLMs.txt" },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-[24px] p-8 max-w-md w-full text-center shadow-xl">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-black text-slate-800 mb-2">Report Not Found</h1>
          <p className="text-slate-500 text-sm font-medium">{error}</p>
          <Link href="/" className="inline-block mt-6 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (isPending || !result?.data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">Loading Intelligence Report...</p>
        </div>
      </div>
    );
  }

  const isDomain = result.data.isDomainAudit;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />

      {/* PUBLIC NAVBAR */}
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex justify-between items-center relative z-10">
        <Link href="/" className="text-2xl font-black tracking-tight italic select-none">
          AEO <span className="text-blue-600">Audit</span> Pro
        </Link>
        <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-black uppercase tracking-wider text-blue-600">
          Public Intelligence Report
        </div>
      </nav>

      {/* MAIN REPORT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full mt-2 mb-16 relative z-10 space-y-6 sm:space-y-8">
        
        {/* HERO SUMMARY BAR */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white text-slate-900 flex flex-col items-center justify-center shrink-0 shadow-lg">
              <span className="text-2xl sm:text-3xl font-black">{result.data.score}</span>
              <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold">SCORE</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                  {result.data.pageCategory || "General"}
                </span>
                {result.data.isDomainAudit && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                    Domain Audit ({result.data.pagesAuditedCount} Pages)
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-black truncate max-w-xl">{getCleanHostname()}</h2>
              <p className="text-xs text-slate-400 truncate max-w-md">{result.data.title}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 w-full md:w-auto text-center shrink-0">
            <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-blue-400 font-black mb-0.5 sm:mb-1">OPTIMIZATION STATE</div>
            <div className="text-lg sm:text-2xl font-black italic uppercase text-white">
              {result.data.score >= 75 ? "Strong" : result.data.score >= 50 ? "Moderate" : "Weak"}
            </div>
          </div>

        </div>

        {/* INTEGRATED TABS + CONTENT CARD */}
        <div className="bg-white border border-slate-200/90 rounded-2xl md:rounded-3xl shadow-xl shadow-slate-900/5 overflow-hidden">
          
          {/* TABS HEADER WITH CLEAR BORDERS & FLEX WRAP */}
          <div className="bg-slate-100/80 border-b border-slate-200 p-3 sm:p-4 flex flex-wrap items-center gap-2">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTabType)}
                  className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 border relative ${
                    isActive
                      ? "bg-white text-blue-600 border-blue-600 shadow-sm shadow-blue-600/10 ring-2 ring-blue-600/20 z-10"
                      : "bg-slate-50 hover:bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  
                  {isActive && (
                    <div className="absolute top-0 left-2 right-2 h-[2px] bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT PANEL */}
          <div className="p-4 sm:p-8 md:p-10">
            {activeTab === "metrics" && (
              <div className="space-y-6">
                {result.data.isDomainAudit && result.data.domainStats && (
                  <DomainMetricsPanel data={result.data} />
                )}
                <MetricsPanel data={result.data} />
              </div>
            )}

            {activeTab === "keywords" && <KeywordsPanel data={result.data} />}
            {activeTab === "analysis" && <InsightsPanel data={result.data} />}
            {activeTab === "recommendations" && <RecommendationsPanel data={result.data} />}
            {activeTab === "simulator" && <SimulatorPanel data={result.data} cleanHostname={getCleanHostname()} />}
            {activeTab === "speed" && result.data.website_url && <PageSpeedCard url={result.data.website_url} />}
            
            {activeTab === "robots" && (
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Raw Robots.txt Directives</h3>
                <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre">
                  {result.data.robotsRawContent || "No directives found."}
                </div>
              </div>
            )}

            {activeTab === "llms" && <LlmsPanel data={result.data} />}
          </div>

        </div>

      </div>

      {/* VIRAL MARKETING FOOTER LOOP */}
      <footer className="border-t border-slate-200/50 py-8 text-center text-xs bg-white w-full px-4 flex flex-col items-center gap-2 relative z-10">
        <div className="font-bold text-slate-400">&copy; 2026 AEO Audit Pro. All rights reserved.</div>
        <div className="bg-slate-50 border border-slate-200/60 rounded-full px-4 py-2 text-slate-600 font-bold text-[11px]">
          🚀 Want to audit your own website?{" "}
          <Link href="/" className="text-blue-600 hover:underline font-black ml-1">
            Analyze AI Visibility &rarr;
          </Link>
        </div>
      </footer>

    </div>
  );
}