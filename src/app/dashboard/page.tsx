"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { analyzeUrl, getUserStats, getUserAuditHistory } from "../actions";
import PageSpeedCard from "../components/PageSpeedCard"; 
import Tooltip from "../components/Tooltip";
import Footer from "../components/Footer";
import Link from "next/link";
import Navbar from "../components/Navbar";
import DomainMetricsPanel from "../components/dashboard/DomainMetricsPanel";

// Uvoz izdvojenih panela i white-label forme
import WhiteLabelForm from "../components/dashboard/WhiteLabelForm";
import MetricsPanel from "../components/dashboard/MetricsPanel";
import KeywordsPanel from "../components/dashboard/KeywordsPanel";
import InsightsPanel from "../components/dashboard/InsightsPanel";
import RecommendationsPanel from "../components/dashboard/RecommendationsPanel";
import SimulatorPanel from "../components/dashboard/SimulatorPanel";
import LlmsPanel from "../components/dashboard/LlmsPanel";

import { AuditData, TabId } from "../lib/types"; 
import { exportAuditToDocx } from "../lib/docxExport";

const singleLoadingSteps = [
  "Initializing crawl engine...",
  "Analyzing semantic structure...",
  "Scanning structured data...",
  "Evaluating Answer Engine signals...",
  "Processing content hierarchy...",
  "Generating AI recommendations...",
  "Building executive audit...",
];

const domainLoadingSteps = [
  "Discovering XML Sitemaps...",
  "Sampling key domain templates (Homepage, Docs, Blog)...",
  "Analyzing multi-page semantic hierarchy...",
  "Parsing global schema graph & entity linkages...",
  "Testing AI Crawler directives across domain routes...",
  "Calculating aggregate domain AEO score...",
  "Finalizing multi-page report...",
];

interface UserStats {
  plan: string;
  limit: number;
  used: number;
}

interface AuditHistoryItem {
  id: number;
  website_url: string;
  created_at: string;
  share_token: string;
  result_data: AuditData;
}

type ActiveTabType = TabId | "simulator" | "speed" | "llms" | "keywords";

export default function Home() {
  const [result, setResult] = useState<{ success?: boolean; error?: string; data?: AuditData } | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTabType>("metrics");
  const [showBranding, setShowBranding] = useState(false);
  
  // 🚀 Audit Scope State ('single' ili 'domain')
  const [auditMode, setAuditMode] = useState<"single" | "domain">("single");

  const [agencyName, setAgencyName] = useState("AEO Audit Pro");
  const [brandColor, setBrandColor] = useState("2563eb"); 
  const [authorName, setAuthorName] = useState("Senior AEO Strategist");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);

  const isFreePlan = !userStats || userStats.plan === "FREE";

  const currentLoadingSteps = auditMode === "domain" ? domainLoadingSteps : singleLoadingSteps;

  const getCleanHostname = () => {
    let targetUrl = result?.data?.website_url || "";
    if (!targetUrl && currentAuditId) {
      const matchingAudit = history.find(h => h.share_token === currentAuditId);
      if (matchingAudit) targetUrl = matchingAudit.website_url;
    }
    if (!targetUrl) return "this brand";
    try {
      const parsingUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
      return new URL(parsingUrl).hostname.replace("www.", "");
    } catch (e) {
      return targetUrl.replace("https://", "").replace("http://", "").replace("www.", "");
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      const stats = await getUserStats();
      if (stats) setUserStats(stats);

      const savedAgency = localStorage.getItem("aeo_agency_name");
      const savedColor = localStorage.getItem("aeo_brand_color");
      const savedAuthor = localStorage.getItem("aeo_author_name");
      const savedLogo = localStorage.getItem("aeo_logo_base64");

      if (savedAgency) setAgencyName(savedAgency);
      if (savedColor) setBrandColor(savedColor);
      if (savedAuthor) setAuthorName(savedAuthor);
      if (savedLogo) setLogoBase64(savedLogo);

      const historyRes = await getUserAuditHistory();
      if (historyRes?.success && historyRes.history) {
        const formattedHistory: AuditHistoryItem[] = historyRes.history.map((item) => ({
          id: item.id,
          website_url: item.website_url,
          created_at: item.created_at,
          share_token: item.share_token,
          result_data: item.result_data as unknown as AuditData,
        }));
        setHistory(formattedHistory);
      }
    }
    loadInitialData();
  }, [currentAuditId]);

  useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(() => {
      setLoadingIndex((prev) => (prev + 1) % currentLoadingSteps.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isPending, currentLoadingSteps]);

  const handleAuditSubmit = (formData: FormData) => {
    formData.set("mode", auditMode);
    setResult(null);
    setLoadingIndex(0);
    setCurrentAuditId(null);
    setActiveTab("metrics"); 
    startTransition(async () => {
      const res = await analyzeUrl(formData);
      if (res && "userStats" in res) setUserStats(res.userStats as UserStats);

      if ("error" in res) {
        setResult({ error: res.error });
      } else if (res.success && res.data) {
        if (res.auditId) setCurrentAuditId(res.auditId);
        const newHistoryItem: AuditHistoryItem = {
          id: Date.now(),
          website_url: formData.get("url") as string,
          created_at: new Date().toISOString(),
          share_token: res.auditId || "",
          result_data: res.data as AuditData
        };
        setHistory((prevHistory) => [newHistoryItem, ...prevHistory]);
        setResult({ success: true, data: res.data as AuditData });
      }
    });
  };

  const copyShareLink = async () => {
    if (!currentAuditId) return;
    const shareUrl = `${window.location.origin}/share/${currentAuditId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const shareOnLinkedIn = () => {
    if (!currentAuditId || !result?.data) return;
    const shareUrl = `${window.location.origin}/share/${currentAuditId}`;
    const displayUrl = getCleanHostname();
    const text = `🎯 AI Visibility Audit for ${displayUrl} is officially LIVE via AEO Audit Pro!\n\nScore: ${result.data.score}/100. Interactive report here: ${shareUrl}`;
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`, "_blank", "width=600,height=600,scrollbars=yes,resizable=yes");
  };

  const shareOnX = () => {
    if (!currentAuditId || !result?.data) return;
    const shareUrl = `${window.location.origin}/share/${currentAuditId}`;
    const tweetText = `Just ran an AI Search & AEO Audit for ${getCleanHostname()} using AEO Audit Pro. Our optimization score is ${result.data.score}/100! 🚀`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=450,scrollbars=yes,resizable=yes");
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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />
      <Navbar userStats={userStats} />

      {/* PROŠIREN KONTEJNER (max-w-7xl) ZBOG NOVOG PROSTRANOG DASHBOARDA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full mt-6 relative z-10">
        
        {/* VELIKA PROŠIRENA FORMA (BEZ NASLOVA I SUBHEADINGA) */}
        <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-xl shadow-blue-900/5 mb-10">
          <form action={handleAuditSubmit} className="space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 px-2">
                Audit Scope
              </span>
              <div className="inline-flex rounded-xl bg-slate-200/70 p-1 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setAuditMode("single")}
                  className={`flex-1 sm:flex-none px-5 py-2 text-xs font-black rounded-lg transition-all ${
                    auditMode === "single"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  Single Path Audit
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setAuditMode("domain")}
                  className={`flex-1 sm:flex-none px-5 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    auditMode === "domain"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span>Full Domain Audit</span>
                  <span className="text-[9px] bg-blue-100 text-blue-700 font-extrabold px-1.5 py-0.5 rounded-md">
                    Sample 15
                  </span>
                </button>
              </div>
            </div>

            <input type="hidden" name="mode" value={auditMode} />

            <div className="flex flex-col md:flex-row gap-3">
              <input 
                name="url" 
                type="text" 
                required 
                placeholder={auditMode === "domain" ? "Enter root domain (e.g. acme.com)" : "Enter a domain or specific URL to audit"} 
                className="flex-1 px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-200/60 rounded-[16px] sm:rounded-[20px] outline-none font-semibold text-sm focus:border-blue-500 focus:bg-white transition" 
              />
              <button
                disabled={isPending}
                className="w-full sm:w-[240px] bg-slate-900 text-white px-6 py-3.5 sm:py-4 rounded-[16px] sm:rounded-[20px] text-sm sm:text-base font-black hover:bg-blue-600 transition disabled:bg-slate-300 shrink-0 text-center flex items-center justify-center cursor-pointer"
              >
                {isPending ? "GENERATING AUDIT..." : auditMode === "domain" ? "ANALYZE DOMAIN" : "ANALYZE PATH"}
              </button>
            </div>
            
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <button type="button" onClick={() => setShowBranding(!showBranding)} className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition cursor-pointer">
                <span className={`transform transition duration-200 ${showBranding ? "rotate-90" : ""}`}>▶</span>
                {showBranding ? "Hide Agency Branding Options" : "Show Agency White-Label Options"}
              </button>
            </div>

            {showBranding && (
              <WhiteLabelForm
                isFreePlan={isFreePlan}
                agencyName={agencyName}
                brandColor={brandColor}
                authorName={authorName}
                logoBase64={logoBase64}
                logoInputRef={logoInputRef}
                onAgencyNameChange={(v) => { setAgencyName(v); localStorage.setItem("aeo_agency_name", v); }}
                onBrandColorChange={(v) => { const c = v.replace("#", "").trim(); setBrandColor(c); localStorage.setItem("aeo_brand_color", c); }}
                onAuthorNameChange={(v) => { setAuthorName(v); localStorage.setItem("aeo_author_name", v); }}
                onLogoUpload={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => { setLogoBase64(reader.result as string); localStorage.setItem("aeo_logo_base64", reader.result as string); };
                  reader.readAsDataURL(file);
                }}
                onRemoveLogo={() => { if (logoInputRef.current) logoInputRef.current.value = ""; setLogoBase64(null); localStorage.removeItem("aeo_logo_base64"); }}
              />
            )}
          </form>
        </div>

        {/* LOADING SCREEN */}
        {isPending && (
          <div className="mb-10 block">
            <div className="bg-white border border-slate-100 rounded-[24px] sm:rounded-[40px] p-5 sm:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-blue-500/5 animate-pulse" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-1.5">
                    {auditMode === "domain" ? "Multi-Page Crawl Engine" : "Live Audit Engine"}
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black tracking-tight">
                    {auditMode === "domain" ? "Sampling Domain Architecture" : "Running Analysis"}
                  </h2>
                </div>
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0"><div className="absolute inset-0 rounded-full border-4 border-slate-100" /><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" /></div>
              </div>
              <div className="h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden mb-6 sm:mb-8"><div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" /></div>
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border"><div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">Current Operation</div><p className="text-sm sm:text-base font-bold text-slate-700 animate-pulse">{currentLoadingSteps[loadingIndex]}</p></div>
            </div>
          </div>
        )}

        {result?.error && <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[20px] p-5 sm:p-6 font-bold text-center text-sm sm:text-base mb-8">{result.error}</div>}

        {/* 🚀 MODERN SAAS DASHBOARD VIEW FOR AUDIT RESULTS */}
        {result?.data && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            
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

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button 
                  onClick={async () => { if (isFreePlan) { alert("🔒 Premium Feature"); return; } await exportAuditToDocx(result.data!, { agencyName, brandColor, authorName, logoBase64 }); }}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {isFreePlan ? "🔒 .DOCX" : "Export .DOCX"}
                </button>
                <button 
                  onClick={copyShareLink} 
                  disabled={!currentAuditId}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer border border-slate-700"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                <button 
                  onClick={shareOnLinkedIn} 
                  disabled={!currentAuditId}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span className="font-serif lowercase font-bold text-xs">in</span>
                  <span>Share on LinkedIn</span>
                </button>
                <button 
                  onClick={shareOnX} 
                  disabled={!currentAuditId}
                  className="px-3.5 py-2 bg-black hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-700 disabled:opacity-50"
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <span>Share on X</span>
                </button>
              </div>

            </div>

            {/* 🚀 INTEGRATED TABS + CONTENT CARD (ODVOJENI TAB DUGMIĆI SA JASNUM BORDERIMA) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl md:rounded-3xl shadow-xl shadow-slate-900/5 overflow-hidden">
              
              {/* TABS HEADER - FLEX WRAP SA BORDERIMA OKO SVAKOG TABA */}
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
                      
                      {/* Akcentna plava linija na vrhu aktivnog taba */}
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
        )}

        {/* ORIGINAL RECENT AUDIT LOGS */}
        <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-xl shadow-blue-900/5 mt-12 mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-slate-900 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Your Recent Audit Logs</h3>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/60 text-amber-700 text-[10px] font-bold rounded-xl shrink-0">
              <span>⏱️ Logs expire after 30 days</span>
            </div>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 border border-dashed rounded-2xl">
              <p className="text-xs font-bold text-slate-400 italic">No previous optimization sweeps discovered on this profile.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {history.map((audit) => (
                <div key={audit.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl gap-4 hover:border-blue-500/30 transition-all duration-200">
                  <div className="overflow-hidden">
                    <div className="text-sm font-black text-slate-800 truncate">{audit.website_url}</div>
                    <div className="text-slate-400 font-semibold text-[11px] mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span>Score: <span className="text-blue-600 font-black">{audit.result_data?.score ?? 0}/100</span></span>
                      <span className="text-slate-200">|</span>
                      
                      <span className="font-bold text-slate-600">
                        {audit.result_data?.pagesAuditedCount && audit.result_data.pagesAuditedCount > 1 
                          ? `🌐 Domain (${audit.result_data.pagesAuditedCount} pages)` 
                          : audit.result_data?.isDomainAudit 
                          ? `🌐 Domain (1 page found)`
                          : "📄 Single Page"}
                      </span>

                      <span className="text-slate-200">|</span>
                      <span className="text-slate-400 font-medium">{new Date(audit.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      <span className="text-slate-200">|</span>
                      {(() => {
                        const msLeft = (new Date(audit.created_at).getTime() + (30 * 24 * 60 * 60 * 1000)) - Date.now();
                        const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
                        return <span className={`font-bold ${daysLeft <= 5 ? "text-rose-500 animate-pulse" : "text-amber-600"}`}>{daysLeft === 0 ? "Expires today" : `Expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}</span>;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/share/${audit.share_token}`); alert("🔗 Share link copied for: " + audit.website_url); }} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition shadow-sm cursor-pointer">Copy Link</button>
                    <button onClick={() => { setCurrentAuditId(audit.share_token); setResult({ success: true, data: audit.result_data }); window.scrollTo({ top: 150, behavior: "smooth" }); }} className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer">Load Report ↗</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      <Footer />
    </div>
  );
}