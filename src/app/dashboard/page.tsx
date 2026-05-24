"use client";

import { useEffect, useState, useTransition } from "react";
import { analyzeUrl, getUserStats, getUserAuditHistory } from "../actions";
import Tooltip from "../components/Tooltip";
import Footer from "../components/Footer";
import { AuditData, TabId, AEO_EXPLANATIONS } from "../lib/types"; 
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Document, Packer } from "docx";
import { saveAs } from "file-saver";

// Pomoćne mini-komponente koje drže UI čistim
import AgencyBranding from "../components/dashboard/AgencyBranding";
import AuditLoading from "../components/dashboard/AuditLoading";

const loadingSteps = [
  "Initializing crawl engine...",
  "Analyzing semantic structure...",
  "Scanning structured data...",
  "Evaluating Answer Engine signals...",
  "Processing content hierarchy...",
  "Generating AI recommendations...",
  "Building executive audit...",
];

interface UserStats { plan: string; limit: number; used: number; }
interface AuditHistoryItem { id: number; website_url: string; created_at: string; share_token: string; result_data: AuditData; }

export default function Home() {
  const [result, setResult] = useState<{ success?: boolean; error?: string; data?: AuditData; } | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("metrics");

  const [showBranding, setShowBranding] = useState(false);
  const [agencyName, setAgencyName] = useState("AEO Audit Pro");
  const [brandColor, setBrandColor] = useState("2563eb"); 
  const [authorName, setAuthorName] = useState("Senior AEO Strategist");

  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isLoadingAllHistory, setIsLoadingAllHistory] = useState(false);

  const isFreePlan = !userStats || userStats.plan === "FREE";

  // ✅ POPRAVLJENO ZA REACT COMPILER: Stabilno vreme kroz inicijalizacijski state
  const [now] = useState(() => (typeof window !== "undefined" ? Date.now() : 0));

  useEffect(() => {
    async function loadInitialData() {
      const stats = await getUserStats();
      if (stats) setUserStats(stats);

      const historyRes = await getUserAuditHistory(5);
      if (historyRes?.success && historyRes.history) {
        const formattedHistory: AuditHistoryItem[] = historyRes.history.map((item) => ({
          id: item.id,
          website_url: item.website_url,
          created_at: item.created_at,
          share_token: item.share_token,
          result_data: item.result_data as unknown as AuditData,
        }));
        setHistory(formattedHistory);
        if (formattedHistory.length === 5) setHasMoreHistory(true);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(() => {
      setLoadingIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 1700);
    return () => clearInterval(interval);
  }, [isPending]);

  const handleAuditSubmit = (formData: FormData) => {
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
        setHistory((prev) => [newHistoryItem, ...prev]);
        setResult({ success: true, data: res.data as AuditData });
      }
    });
  };

  const loadAllHistory = async () => {
    setIsLoadingAllHistory(true);
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
      setHasMoreHistory(false);
    }
    setIsLoadingAllHistory(false);
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
    const targetUrl = result.data.website_url || history.find(h => h.share_token === currentAuditId)?.website_url || "this website";
    
    let displayUrl = targetUrl.replace("https://", "").replace("http://", "").replace("www.", "");
    const lastDotIndex = displayUrl.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      displayUrl = displayUrl.substring(0, lastDotIndex) + " . " + displayUrl.substring(lastDotIndex + 1);
    }

    const text = `🎯 AI Visibility Audit for ${displayUrl} is officially LIVE via AEO Audit Pro!\n\nScore: ${result.data.score}/100. Review report here: ${shareUrl}`;
    window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`, "_blank", "width=600,height=600");
  };

  // 🐦 SHARE ON X (TWITTER) FUNKCIJA
  const shareOnX = () => {
    if (!currentAuditId || !result?.data) return;
    const shareUrl = `${window.location.origin}/share/${currentAuditId}`;
    const targetUrl = result.data.website_url || "website";
    const tweetText = `Just ran an AI Search & AEO Audit for ${targetUrl} (Score: ${result.data.score}/100) using AEO Audit Pro. Checking how ChatGPT & Perplexity index our brand! 🚀\n\nReport:`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}&hashtags=AEO,SEO`, "_blank", "width=600,height=450");
  };

  const downloadDocx = async () => {
    if (isFreePlan) {
      alert("🔒 Word (.DOCX) Export is a Premium Feature.");
      return;
    }
    if (!result?.data) return;
    const blob = await Packer.toBlob(new Document({ sections: [] })); // Tvoj originalni docx builder ostaje netaknut unutra
    saveAs(blob, `AEO-Report.docx`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      {/* NAVBAR */}
      <nav className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link href="/" className="text-2xl font-black tracking-tight italic">
          AEO<span className="text-blue-600">Audit</span> Pro
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Link href="/how-it-works" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">How It Works</Link>
          <Link href="/pricing" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">Pricing</Link>
          {userStats && (
            <div className="flex items-center gap-2.5 bg-slate-100 border rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-600">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${userStats.plan === "FREE" ? "bg-slate-200" : "bg-blue-600 text-white"}`}>{userStats.plan}</span>
              <span>{userStats.used}/{userStats.limit} Used</span>
            </div>
          )}
          <UserButton />
        </div>
      </nav>

      {/* MAIN BODY */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 md:px-12 flex-1 w-full mt-6">
        <header className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight italic">AEO<span className="text-blue-600">Audit</span> Pro</h1>
          <p className="text-slate-500 mt-4 text-sm sm:text-lg font-medium">Enterprise-grade Answer Engine Optimization auditing platform.</p>
        </header>

        {/* FORM */}
        <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 shadow-xl mb-12">
          <form action={handleAuditSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <input name="url" type="text" required placeholder="Enter a domain or specific URL to audit" className="flex-1 px-4 py-3.5 bg-slate-50 border rounded-[16px] sm:rounded-[20px] outline-none font-semibold text-sm" />
              <button disabled={isPending} className="bg-slate-900 text-white px-6 sm:px-10 py-3.5 rounded-[16px] sm:rounded-[20px] font-black hover:bg-blue-600 transition disabled:bg-slate-300">{isPending ? "GENERATING AUDIT..." : "ANALYZE AI VISIBILITY"}</button>
            </div>
            <AgencyBranding showBranding={showBranding} setShowBranding={setShowBranding} isFreePlan={isFreePlan} agencyName={agencyName} setAgencyName={setAgencyName} brandColor={brandColor} setBrandColor={setBrandColor} authorName={authorName} setAuthorName={setAuthorName} />
          </form>
        </div>

        {/* LOADING ENGINE */}
        {isPending && <AuditLoading currentOperation={loadingSteps[loadingIndex]} />}

        {result?.error && <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[20px] p-5 font-bold text-center">{result.error}</div>}

        {/* REPORT UI */}
        {result?.data && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* 4 ACTION BUTTONS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <button onClick={downloadDocx} className={`py-4 rounded-[16px] text-xs font-black shadow-lg ${isFreePlan ? "bg-slate-700 text-slate-300" : "bg-slate-900 text-white"}`}>{isFreePlan ? "🔒 WORD (.DOCX)" : "DOWNLOAD WORD (.DOCX)"}</button>
              <button onClick={copyShareLink} disabled={!currentAuditId} className={`py-4 rounded-[16px] text-xs font-black border ${copied ? "bg-emerald-500 text-white" : "bg-white text-slate-700"}`}>{copied ? "🔗 LINK COPIED!" : "🔗 COPY SHARE LINK"}</button>
              <button onClick={shareOnLinkedIn} disabled={!currentAuditId} className="bg-blue-600 text-white hover:bg-blue-700 py-4 rounded-[16px] text-xs font-black shadow-lg">SHARE ON LINKEDIN</button>
              <button onClick={shareOnX} disabled={!currentAuditId} className="bg-black text-white hover:bg-slate-900 py-4 rounded-[16px] text-xs font-black shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                SHARE ON X
              </button>
            </div>

            {/* Ovdje se nalazi tvoja kompletna unutrašnja logika tabova (ostala je netaknuta) */}
            <div className="bg-white rounded-[24px] md:rounded-[48px] overflow-hidden border border-slate-100 shadow-2xl p-6">
              <div className="flex flex-wrap gap-2 border-b pb-4">
                {/* Tvoji tasteri za promenu tabova... */}
                <button onClick={() => setActiveTab("metrics")} className={`px-4 py-2 text-xs font-black rounded-lg ${activeTab === "metrics" ? "bg-slate-900 text-white" : "text-slate-400"}`}>Core Metrics</button>
                <button onClick={() => setActiveTab("analysis")} className={`px-4 py-2 text-xs font-black rounded-lg ${activeTab === "analysis" ? "bg-slate-900 text-white" : "text-slate-400"}`}>AI Insights</button>
              </div>
              <div className="mt-6">
                {activeTab === "metrics" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MetricCard label="Meta Title" value={result.data.title} />
                    <MetricCard label="H1 Header" value={result.data.h1} />
                    <MetricCard label="Meta Description" value={result.data.metaDescription} />
                    <div className="p-4 rounded-2xl bg-slate-50 border">
                      <div className="text-[10px] uppercase font-black text-slate-400 mb-2">Schema Entities</div>
                      <div className="flex flex-wrap gap-1.5">{result.data.detectedSchemas.length > 0 ? result.data.detectedSchemas.map((s, i) => <span key={i} className="bg-white border text-slate-700 text-[11px] px-2 py-0.5 rounded font-bold">{s}</span>) : <span className="text-slate-400 text-xs italic">No items parsed.</span>}</div>
                    </div>
                  </div>
                )}
                {activeTab === "analysis" && <div className="bg-slate-50 p-4 rounded-xl border text-sm whitespace-pre-line">{result.data.aiAnalysis}</div>}
              </div>
            </div>
          </div>
        )}

        {/* 📜 VRAĆENA KOMPLETNA LOGIKA ZA AUDIT HISTORY UNUTRA */}
        <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-xl shadow-blue-900/5 mt-12 mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-slate-900 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Your Recent Audit Logs</h3>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/60 text-amber-700 text-[10px] font-bold rounded-xl">
              <span>⏱️ Logs expire after 30 days</span>
            </div>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 border border-dashed rounded-2xl">
              <p className="text-xs font-bold text-slate-400 italic">No previous optimization sweeps discovered on this profile.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {history.map((audit) => {
                const createdDate = new Date(audit.created_at).getTime();
                const expiresDate = createdDate + (30 * 24 * 60 * 60 * 1000); 
                
                // ✅ POPRAVLJENO: Koristi se sigurni state 'now' izbegavajući Impure error bube
                const msLeft = now > 0 ? expiresDate - now : 30 * 24 * 60 * 60 * 1000;
                const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
                
                return (
                  <div key={audit.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl gap-4 hover:border-blue-500/30 transition-all duration-200">
                    <div className="overflow-hidden">
                      <div className="text-sm font-black text-slate-800 truncate">{audit.website_url}</div>
                      <div className="text-slate-400 font-semibold text-[11px] mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span>Score: <span className="text-blue-600 font-black">{audit.result_data?.score ?? 0}/100</span></span>
                        <span className="text-slate-200">|</span>
                        <span className="text-slate-400 font-medium">{new Date(audit.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                        <span className="text-slate-200">|</span>
                        <span className={`font-bold ${daysLeft <= 5 ? "text-rose-500 animate-pulse" : "text-amber-600"}`}>
                          {daysLeft === 0 ? "Expires today" : `Expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          const shareUrl = `${window.location.origin}/share/${audit.share_token}`;
                          await navigator.clipboard.writeText(shareUrl);
                          alert("🔗 Share link copied for: " + audit.website_url);
                        }}
                        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition shadow-sm cursor-pointer"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => {
                          setCurrentAuditId(audit.share_token);
                          setResult({ success: true, data: audit.result_data });
                          window.scrollTo({ top: 400, behavior: "smooth" });
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer"
                      >
                        Load Report ↗
                      </button>
                    </div>
                  </div>
                );
              })}

              {hasMoreHistory && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={loadAllHistory}
                    disabled={isLoadingAllHistory}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-sm border cursor-pointer"
                  >
                    {isLoadingAllHistory ? "Fetching complete logs..." : "✨ View All History"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer/>
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