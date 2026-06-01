"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { analyzeUrl, getUserStats, getUserAuditHistory } from "../actions";
import Tooltip from "../components/Tooltip";
import Footer from "../components/Footer";
import { AuditData, TabId, AEO_EXPLANATIONS } from "../lib/types"; 
import { exportAuditToDocx } from "../lib/docxExport";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const loadingSteps = [
  "Initializing crawl engine...",
  "Analyzing semantic structure...",
  "Scanning structured data...",
  "Evaluating Answer Engine signals...",
  "Processing content hierarchy...",
  "Generating AI recommendations...",
  "Building executive audit...",
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border flex flex-col justify-between">
      <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">{label}</div>
      <div className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed break-words">{value}</div>
    </div>
  );
}

export default function Home() {
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    data?: AuditData;
  } | null>(null);

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId | "simulator">("metrics");

  const [showBranding, setShowBranding] = useState(false);
  
  // 🎨 WHITE-LABEL AGENCIJSKE POSTAVKE SA LOCALSTORAGE PODRŠKOM
  const [agencyName, setAgencyName] = useState("AEO Audit Pro");
  const [brandColor, setBrandColor] = useState("2563eb"); 
  const [authorName, setAuthorName] = useState("Senior AEO Strategist");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  // 🛠️ REFEERENCA ZA LOGO INPUT (Zamjena za document.getElementById bug)
  const logoInputRef = useRef<HTMLInputElement>(null);

  // 🔗 Držanje UUID share_tokena trenutno učitanog izvještaja i stanja kopiranja
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 📜 Stanja za dinamičko učitavanje i paginaciju istorije logova
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isLoadingAllHistory, setIsLoadingAllHistory] = useState(false);

  // 🛡️ Provera da li je korisnik na besplatnom planu
  const isFreePlan = !userStats || userStats.plan === "FREE";

  // Dobijanje čistog URL hostnam-a za simulaciju pitanja u SERP-u
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

  // 🔄 Učitaj statse, istoriju, ali i SAČUVANI BRAND KIT iz localStorage-a
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
        
        if (formattedHistory.length === 5) {
          setHasMoreHistory(true);
        }
      }
    }
    loadInitialData();
  }, [currentAuditId]);

  const handleAgencyNameChange = (val: string) => {
    setAgencyName(val);
    localStorage.setItem("aeo_agency_name", val);
  };

  const handleBrandColorChange = (val: string) => {
    const cleanColor = val.replace("#", "").trim();
    setBrandColor(cleanColor);
    localStorage.setItem("aeo_brand_color", cleanColor);
  };

  const handleAuthorNameChange = (val: string) => {
    setAuthorName(val);
    localStorage.setItem("aeo_author_name", val);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setLogoBase64(base64String);
      localStorage.setItem("aeo_logo_base64", base64String);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    if (logoInputRef.current) logoInputRef.current.value = "";
    setLogoBase64(null);
    localStorage.removeItem("aeo_logo_base64");
  };

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
      
      if (res && "userStats" in res) {
        setUserStats(res.userStats as UserStats);
      }

      if ("error" in res) {
        setResult({ error: res.error });
      } else if (res.success && res.data) {
        if (res.auditId) {
          setCurrentAuditId(res.auditId);
        }

        const newHistoryItem: AuditHistoryItem = {
          id: Date.now(),
          website_url: formData.get("url") as string,
          created_at: new Date().toISOString(),
          share_token: res.auditId || "",
          result_data: res.data as AuditData
        };
        
        setHistory((prevHistory) => [newHistoryItem, ...prevHistory]);

        setResult({
          success: true,
          data: res.data as AuditData
        });
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
      console.error("Failed to copy share link:", err);
    }
  };
  
  const shareOnLinkedIn = () => {
    if (!currentAuditId || !result?.data) return;
    const shareUrl = `${window.location.origin}/share/${currentAuditId}`;
    const displayUrl = getCleanHostname();

    const text = `🎯 AI Visibility Audit for ${displayUrl} is officially LIVE via AEO Audit Pro!\n\n` +
                 `The Answer Engine Optimization (AEO) score is ${result.data.score}/100. The platform just analyzed how top-tier AI models like ChatGPT, Perplexity, and Claude crawl, parse, and extract this domain's content hierarchy.\n\n` +
                 `See how this site stacks up in the age of AI search and review the live, interactive report here: ${shareUrl}`;

    const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    window.open(linkedinUrl, "_blank", "width=600,height=600,scrollbars=yes,resizable=yes");
  };

  const shareOnX = () => {
    if (!currentAuditId || !result?.data) return;
    const shareUrl = `${window.location.origin}/share/${currentAuditId}`;
    const displayUrl = getCleanHostname();

    const tweetText = `Just ran an AI Search & AEO Audit for ${displayUrl} using AEO Audit Pro. Our optimization score is ${result.data.score}/100! Checking if ChatGPT, Perplexity, and Gemini can index and cite our brand. 🚀\n\nReview the live interactive report here:`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}&hashtags=AEO,SEO,SaaS`;
    window.open(xUrl, "_blank", "width=600,height=450,scrollbars=yes,resizable=yes");
  };

  const downloadDocx = async () => {
    if (isFreePlan) {
      alert("🔒 Word (.DOCX) Export is a Premium Feature.\n\nPlease upgrade your plan under the Pricing section to unlock downloadable executive reports for your clients.");
      return;
    }

    if (!result?.data) return;

    await exportAuditToDocx(result.data, {
      agencyName,
      brandColor,
      authorName,
      logoBase64,
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />
      
      {/* NAVBAR */}
      <nav className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent border-b border-slate-200/40 sm:border-none relative z-10">
        <Link href="/" className="group cursor-pointer select-none">
          <div className="text-2xl font-black tracking-tight italic">
            AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200">Audit</span> Pro
          </div>
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {/* DODAN GRADIENT BEDŽ LINK ZA NOVI ALAT */}
          <Link href="/aeo-radar" className="text-xs sm:text-sm font-black text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full hover:bg-blue-100 transition cursor-pointer flex items-center gap-1 shadow-sm">
            📡 AI Visibility Radar
          </Link>
           <Link href="/pricing" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition m-0">
             Pricing
          </Link>
          
          
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          
          {userStats && (
            <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-200/50 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm animate-in fade-in duration-200">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                userStats.plan === "FREE" ? "bg-slate-200 text-slate-700" : "bg-blue-600 text-white"
              }`}>
                {userStats.plan}
              </span>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[10px] text-slate-700 font-black">
                  {userStats.used ?? 0}/{userStats.limit || (userStats.plan === "FREE" ? 1 : userStats.plan === "STARTER" ? 50 : 200)} Used
                </span>
                <div className="w-16 bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${ (userStats.used ?? 0) >= (userStats.limit || 1) ? "bg-rose-500" : "bg-blue-600" }`}
                    style={{ 
                      width: `${Math.min(
                        ((userStats.used ?? 0) / (userStats.limit || (userStats.plan === "FREE" ? 1 : userStats.plan === "STARTER" ? 50 : 200))) * 100, 
                        100
                      )}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <UserButton /> 
        </div>
      </nav>

      {/* MAIN CONTENT WRAPPER */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 md:px-12 flex-1 w-full mt-6 relative z-10">
        
        {/* HEADER */}
        <header className="text-center mb-10 sm:mb-14 md:mb-16 px-2">
          <div className="inline-block px-4 py-2 mb-5 rounded-full bg-blue-50 border border-blue-100 max-w-full">
            <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase text-blue-600 block truncate">
              AI Answer Engine Optimization
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight italic">
            AEO<span className="text-blue-600">Audit</span> Pro
          </h1>
          <p className="text-slate-500 mt-4 sm:mt-5 text-sm sm:text-lg max-w-2xl mx-auto font-medium">
            Enterprise-grade Answer Engine Optimization auditing platform powered by AI semantic analysis.
          </p>
        </header>

        {/* FORM */}
        <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 shadow-xl shadow-blue-900/5 mb-12">
          <form action={handleAuditSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                name="url"
                type="text" 
                required
                placeholder="Enter a domain or specific URL to audit"
                className="flex-1 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-200/60 rounded-[16px] sm:rounded-[20px] outline-none font-semibold text-sm sm:text-base text-slate-700 focus:border-blue-500 focus:bg-white transition"
              />
              <button disabled={isPending} className="bg-slate-900 text-white px-6 sm:px-10 py-3.5 sm:py-4 rounded-[16px] sm:rounded-[20px] text-sm sm:text-base font-black hover:bg-blue-600 transition disabled:bg-slate-300 shrink-0">
                {isPending ? "GENERATING AUDIT..." : "ANALYZE AI VISIBILITY"}
              </button>
            </div>

            {/* DODAN POMOĆNI SUB-LINK ISPOD PRETRAGE ZA DIREKTAN PRELAZ NA RADAR */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <button type="button" onClick={() => setShowBranding(!showBranding)} className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition">
                <span className={`transform transition duration-200 ${showBranding ? "rotate-90" : ""}`}>▶</span>
                {showBranding ? "Hide Agency Branding Options" : "Show Agency White-Label Options"}
              </button>
              
              <Link href="/aeo-radar" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition self-start sm:self-center">
                👉 Want real-time LLM recommendation checks? Try the AI Visibility Radar &rarr;
              </Link>
            </div>

            {showBranding && (
              <div className="relative pt-4 border-t border-slate-50">
                {isFreePlan && (
                  <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center rounded-xl p-4 text-center">
                    <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-1 shadow-sm">
                      🔒 Agency Override Locked
                    </span>
                    <p className="text-[11px] text-slate-500 font-bold max-w-sm">
                      Custom branding and DOCX report generation requires an{" "}
                      <Link href="/pricing" className="text-blue-600 underline hover:text-blue-700">
                        Agency Plan
                      </Link>.
                    </p>
                  </div>
                )}

                <div className={`grid grid-cols-1 sm:grid-cols-4 gap-4 ${isFreePlan ? "opacity-40 select-none pointer-events-none" : ""}`}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Agency Name</label>
                    <input type="text" disabled={isFreePlan} value={agencyName} onChange={(e) => handleAgencyNameChange(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Accent Color</label>
                    <div className="flex gap-2">
                      <input type="color" disabled={isFreePlan} value={`#${brandColor.replace("#", "")}`} onChange={(e) => handleBrandColorChange(e.target.value)} className="w-8 h-8 rounded-lg border cursor-pointer shrink-0" />
                      <input type="text" disabled={isFreePlan} value={brandColor} onChange={(e) => handleBrandColorChange(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none flex-1 focus:border-blue-500 bg-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Compiler Name</label>
                    <input type="text" disabled={isFreePlan} value={authorName} onChange={(e) => handleAuthorNameChange(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Agency Logo (png)</label>
                    {logoBase64 ? (
                      <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50/50 p-1 rounded-xl h-[34px]">
                        <span className="text-[10px] font-black text-emerald-700 px-2 truncate flex-1">✓ Logo Saved</span>
                        <button type="button" onClick={removeLogo} className="text-[10px] font-black text-rose-500 hover:text-rose-700 px-2 bg-white rounded-lg h-full border border-slate-200">Remove</button>
                      </div>
                    ) : (
                      <label className="border border-slate-200 hover:border-blue-500 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:text-blue-600 text-center cursor-pointer transition h-[34px] flex items-center justify-center">
                        Upload Image Logo
                        <input ref={logoInputRef} id="logo-upload-input" type="file" accept="image/png, image/jpeg" onChange={handleLogoUpload} className="hidden" disabled={isFreePlan} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
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
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-1.5">Live Audit Engine</div>
                  <h2 className="text-xl sm:text-3xl font-black tracking-tight">Running Analysis</h2>
                </div>
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0"><div className="absolute inset-0 rounded-full border-4 border-slate-100" /><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" /></div>
              </div>
              <div className="h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden mb-6 sm:mb-8"><div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" /></div>
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border"><div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 sm:mb-3">Current Operation</div><p className="text-sm sm:text-base font-bold text-slate-700 animate-pulse">{loadingSteps[loadingIndex]}</p></div>
            </div>
          </div>
        )}

        {result?.error && <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[20px] p-5 sm:p-6 font-bold text-center text-sm sm:text-base">{result.error}</div>}

        {result?.data && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            
            {/* ACTION GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <button 
                onClick={downloadDocx} 
                className={`w-full py-4 rounded-[16px] sm:rounded-[24px] text-xs sm:text-sm font-black tracking-wider transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer ${
                  isFreePlan 
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-800" 
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {isFreePlan ? "🔒 EXPORT .DOCX" : "EXPORT .DOCX"}
              </button>

              <button 
                onClick={copyShareLink}
                disabled={!currentAuditId}
                className={`w-full py-4 rounded-[16px] sm:rounded-[24px] text-xs sm:text-sm font-black tracking-wider transition shadow-lg border cursor-pointer ${
                  copied 
                    ? "bg-emerald-500 text-white border-emerald-500" 
                    : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                }`}
              >
                {copied ? "LINK COPIED!" : "COPY SHARE LINK"}
              </button>

              <button 
                onClick={shareOnLinkedIn}
                disabled={!currentAuditId}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 py-4 rounded-[16px] sm:rounded-[24px] text-xs sm:text-sm font-black tracking-wider transition shadow-lg disabled:bg-slate-200 disabled:text-slate-400 font-sans flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="font-serif lowercase font-bold text-sm tracking-tighter">in</span> SHARE ON LINKEDIN
              </button>

              <button 
                onClick={shareOnX}
                disabled={!currentAuditId}
                className="w-full bg-black text-white hover:bg-slate-900 py-4 rounded-[16px] sm:rounded-[24px] text-xs sm:text-sm font-black tracking-wider transition shadow-lg disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                SHARE ON X
              </button>
            </div>

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
                    <p className="text-slate-400 mt-1.5 text-xs sm:text-sm truncate max-w-full">{result.data.title}</p>
                  </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 w-full md:w-auto text-center">
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-blue-400 font-black mb-0.5 sm:mb-1">OPTIMIZATION STATE</div>
                  <div className="text-lg sm:text-2xl font-black italic uppercase text-white">{result.data.score >= 75 ? "Strong" : result.data.score >= 50 ? "Moderate" : "Weak"}</div>
                </div>
              </div>

              {/* TABS HEADER WITH ACCENTED RECONGNITION DIRECTIVES */}
              <div className="flex flex-wrap border-b border-slate-100 bg-slate-50/50 p-1.5 sm:p-2 gap-1">
                {(
                  [
                    { id: "metrics", label: "Core Metrics" },
                    { id: "analysis", label: "AI Semantic Insights" },
                    { id: "recommendations", label: "Strategic Actions" },
                    { id: "simulator", label: "AI SERP Simulator" }, 
                    { id: "robots", label: "Robots.txt" },
                  ] as const 
                ).map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex-1 md:flex-none px-3 sm:px-5 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition ${activeTab === tab.id ? "bg-white text-blue-600 shadow-sm border border-slate-200/60" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT PANELS */}
              <div className="p-4 sm:p-8 md:p-12">
                
                {/* PANEL 1: CORE METRICS */}
                {activeTab === "metrics" && (
                  <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
                            {result.data.pageType === "Commercial" && (
                            <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold animate-in fade-in duration-300">
                              <span className="text-slate-600 flex items-center">
                                Google Merchant & AI Product Graph Connectivity
                                <Tooltip text="Checks if your Product Schema contains explicit core subsets (offers, brand, or aggregateRating) required for rich conversational AI product listings." />
                              </span>
                              <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${result.data.entityTrustMap?.hasDeepProductSchema ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                                {result.data.entityTrustMap?.hasDeepProductSchema ? "MERCHANT GRAPH ACTIVE" : "TRUST PROPERTIES MISSING"}
                              </span>
                            </div>
                          )}

                          {result.data.pageType === "Homepage" && result.data.detectedSchemas.includes("LocalBusiness") && (
                            <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold animate-in fade-in duration-300">
                              <span className="text-slate-600 flex items-center">
                                📍 Local Business AI Coordinates Mapping
                                <Tooltip text="Validates if your LocalBusiness graph contains deep data fields (telephone, address, openingHours) utilized by grounding algorithms to verify offline trust." />
                              </span>
                              <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${result.data.entityTrustMap?.hasDeepLocalBusinessSchema ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                                {result.data.entityTrustMap?.hasDeepLocalBusinessSchema ? "LOCAL GRAPH OPTIMAL" : "CRITICAL MISSING DATA"}
                              </span>
                            </div>
                          )}

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

                            <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                              <span className="text-slate-600 flex items-center">
                                Autonomous AI Agent Readiness (ARIA Tree)
                                <Tooltip text="Evaluates if your interactive models, buttons, and checkout elements use ARIA attributes. Crucial for browser-based AI agents executing tasks for users." />
                              </span>
                              <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${result.data.semanticLayoutMap?.hasAriaLabels ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                                {result.data.semanticLayoutMap?.hasAriaLabels ? "AGENT READY" : "OPTIMIZATION REQUIRED"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-3 leading-tight">
                          Multimodal models (GPT-4o/Gemini) use structural HTML tags, image descriptions, and embedded rich video modules to extract rich semantic layers.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between shadow-sm">
                          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 flex items-center gap-1">
                            Word Count
                            <Tooltip text={result?.data?.wordCount?.toString() || "0"} />
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <MetricCard label="Meta Title" value={result.data.title} />
                      <MetricCard label="H1 Header" value={result.data.h1} />
                      <MetricCard label="Meta Description" value={result.data.metaDescription} />
                      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 border">
                        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Detected Schema Entities</div>
                        <div className="flex flex-wrap gap-1.5">{result.data.detectedSchemas.length > 0 ? result.data.detectedSchemas.map((s, i) => <span key={i} className="bg-white border text-slate-700 text-[11px] px-2.5 py-1 rounded-lg font-bold shadow-sm">{s}</span>) : <span className="text-slate-400 text-xs italic">No items parsed.</span>}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PANEL 2: AI SEMANTIC INSIGHTS */}
                {activeTab === "analysis" && (
                  <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                    <div>
                      <div className="flex items-center gap-3 mb-4 sm:mb-5">
                        <div className="w-2 h-6 bg-blue-600 rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">LLM Reading Competency (AEO Content Pillars)</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/60">
                        <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">BLUFF Alignment</span>
                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{result.data.bluffScore || 5}/10</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${(result.data.bluffScore || 5) * 10}%` }} />
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 leading-snug">Delivers critical answers upfront on headings instead of burying them deep into backstory paragraphs.</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">LLM Chunking Readiness</span>
                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{result.data.atomicStructureScore || 5}/10</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${(result.data.atomicStructureScore || 5) * 10}%` }} />
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 leading-snug">Checks if your H2/H3 text modules are self-contained and make complete sense when extracted independently.</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-100 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Semantic Entity Density</span>
                              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{result.data.entityDensityScore || 5}/10</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                              <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${(result.data.entityDensityScore || 5) * 10}%` }} />
                            </div>
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 leading-snug">Evaluates the injection rate of concrete terms, brand tokens, and clear relational entities against generic wording.</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Syntactic Simplicity</span>
                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{result.data.sentenceSimplicityScore || 5}/10</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${(result.data.sentenceSimplicityScore || 5) * 10}%` }} />
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 mt-2 leading-snug">Measures sentence structural speed. Favors declarative Subject-Verb-Object models carrying exactly one idea.</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-100 md:col-span-2">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                              ⭐ Google Non-Commodity Score
                              <span className="bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Official 2026 Guideline</span>
                            </span>
                            <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                              (result.data.commodityContentScore || 5) >= 7 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
                            }`}>
                              {result.data.commodityContentScore || 5}/10
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                (result.data.commodityContentScore || 5) >= 7 ? "bg-emerald-500" : "bg-amber-500"
                              }`} 
                              style={{ width: `${(result.data.commodityContentScore || 5) * 10}%` }} 
                            />
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 leading-snug">
                            Defines content authenticity according to Google Search requirements. Low scores indicate heavily recycled, generic text easily scraped by basic automation. High scores ensure unique first-hand experience, data tables, or specialized expert perspectives favored by RAG search models.
                          </p>
                        </div>

                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-6 bg-blue-600 rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Executive LLM Diagnostics</h3>
                      </div>
                      <div className="bg-slate-50 rounded-[16px] p-4 sm:p-5 border text-sm leading-relaxed text-slate-700 whitespace-pre-line font-medium shadow-inner">{result.data.aiAnalysis}</div>
                    </div>
                  </div>
                )}

                {/* PANEL 3: STRATEGIC ACTIONS */}
                {activeTab === "recommendations" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-2"><div className="w-2 h-6 bg-blue-600 rounded-full" /><h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Prioritized Optimization Playbook</h3></div>
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
                            Our crawl engine detected that your DOM structure loads empty initial templates and relies on heavy Client-Side JavaScript hydration. According to Google&apos;s AI guidelines, this significantly increases RAG parser timeouts. 
                            <strong className="block mt-2 font-bold text-amber-950">Required Action:</strong> Migrating to Server-Side Rendering (Next.js/Nuxt.js) or deploying an aggressive static pre-rendering middleware layer (Prerender.io) is highly recommended to make content readable for rapid AI indexers.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PANEL 4: AI SERP SIMULATOR */}
                {activeTab === "simulator" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="p-4 bg-slate-900/5 border border-slate-950/10 rounded-2xl">
                      <p className="text-xs font-medium text-slate-500 leading-relaxed">
                        <strong>AEO LIVE PARAGRAPH ANALYSIS:</strong> Language Models evaluate content density and syntactic speed row-by-row. Below is a real-time extraction preview showing exactly which sections of your page pass LLM citation filters and which are flagged as &apos;low-potential fluff&apos;.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                      {/* Zaglavlje četa */}
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-6 w-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                            A
                          </div>
                          <span className="text-sm font-bold text-slate-800">AEO Engine (Behavioral Content Tokenizer)</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block"></span>
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block"></span>
                        </div>
                      </div>

                      {/* Telo četa (Poruke) */}
                      <div className="p-6 flex-1 space-y-6 bg-gradient-to-b from-white to-slate-50/30">
                        {/* Korisničko Pitanje */}
                        <div className="flex justify-end">
                          <div className="bg-slate-100 text-slate-800 text-sm px-4 py-3 rounded-2xl rounded-tr-sm max-w-md font-medium shadow-sm">
                            Extract the core value proposition and analytical claims from {getCleanHostname()}.
                          </div>
                        </div>

                        {/* AI Odgovor - Segmentirana analiza */}
                        <div className="flex gap-4 max-w-3xl">
                          <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-md shadow-emerald-600/10">
                            🤖
                          </div>
                          
                          <div className="space-y-6 flex-1">
                            {/* PARAGRAF 1 */}
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-[9px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded">Block #1 Preview</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${result.data.entityDensityScore >= 7 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                  Entity Density: {result.data.entityDensityScore || 5}/10
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${result.data.sentenceSimplicityScore >= 6 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                  Syntax Simplicity: {result.data.sentenceSimplicityScore || 5}/10
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${result.data.commodityContentScore >= 7 ? "bg-indigo-100 text-indigo-800" : "bg-amber-100 text-amber-700"}`}>
                                  Google Non-Commodity: {result.data.commodityContentScore || 5}/10
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed font-medium italic border-l-2 border-slate-300 pl-3">
                                {result.data.aiAnalysis ? result.data.aiAnalysis.split("\n\n")[0] : "Extracting main layout text variables..."}
                              </p>
                              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                {result.data.entityDensityScore >= 7 && (result.data.commodityContentScore || 5) >= 7 ? (
                                  <span className="text-emerald-600">✅ High Citation Potential: Highly specific expert-led textual nodes recognized.</span>
                                ) : (
                                  <span className="text-rose-600">⚠️ Low Citation Potential: Block flagged as commodity/recycled context. AI filters may link-strip this segment.</span>
                                )}
                              </div>
                            </div>

                            {/* PARAGRAF 2 */}
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                              <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-[9px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded">Block #2 Preview</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${result.data.bluffScore >= 7 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                  BLUFF Alignment: {result.data.bluffScore || 5}/10
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${result.data.atomicStructureScore >= 7 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                                  RAG Chunk Readiness: {result.data.atomicStructureScore || 5}/10
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed font-medium italic border-l-2 border-slate-300 pl-3">
                                {result.data.aiAnalysis && result.data.aiAnalysis.split("\n\n")[1] 
                                  ? result.data.aiAnalysis.split("\n\n")[1] 
                                  : "Evaluating secondary layout vectors and chunk distribution frameworks..."}
                              </p>
                              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                {result.data.atomicStructureScore >= 7 ? (
                                  <span className="text-emerald-600">✅ Clean RAG Splitting: Node structure is self-contained.</span>
                                ) : (
                                  <span className="text-amber-600">⚠️ Risk: Content relies on context from other paragraphs. In danger of bad chunking fragments.</span>
                                )}
                              </div>
                            </div>

                            {/* Generisanje RAG Izvora */}
                            <div className="pt-2">
                              <span className="text-[10px] uppercase tracking-wider font-black text-slate-400 block mb-2">
                                RAG Citation Engine Status:
                              </span>
                              <div className="flex flex-wrap gap-2">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-bold ${
                                  result.data.score >= 75 
                                    ? "bg-emerald-50 border-emerald-100/80 text-emerald-700" 
                                    : "bg-amber-50 border-amber-100/80 text-amber-700"
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${result.data.score >= 75 ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                                  Source: {getCleanHostname()} — {result.data.score >= 75 ? "Highly Actionable Graph Node" : "Low Density Text Cluster"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lažni input bar na dnu četa */}
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 items-center">
                        <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-400 font-medium">
                          Ask follow up questions...
                        </div>
                        <div className="h-8 w-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 text-xs select-none">
                          ▲
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PANEL 5: ROBOTS.TXT */}
                {activeTab === "robots" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-2"><div className="w-2 h-6 bg-slate-700 rounded-full" /><h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Raw Crawl Directives Content Mapping</h3></div>
                    <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 sm:p-5 font-mono text-[11px] sm:text-xs shadow-inner overflow-x-auto whitespace-pre leading-relaxed">{result.data.robotsRawContent || "No crawling instructions discovered during standard sweeps."}</div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* RECENT AUDIT LOGS */}
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
                      <span className="text-slate-400 font-medium">{new Date(audit.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      
                      <span className="text-slate-200">|</span>
                      {(() => {
                        const createdDate = new Date(audit.created_at).getTime();
                        const expiresDate = createdDate + (30 * 24 * 60 * 60 * 1000); 
                        const msLeft = expiresDate - Date.now();
                        const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
                        
                        return (
                          <span className={`font-bold ${daysLeft <= 5 ? "text-rose-500 animate-pulse" : "text-amber-600"}`}>
                            {daysLeft === 0 ? "Expires today" : `Expires in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        const shareUrl = `${window.location.origin}/share/${audit.share_token}`;
                        await navigator.clipboard.writeText(shareUrl);
                        alert("🔗 Share link copied for: " + audit.website_url);
                      }}
                      className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition shadow-sm"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        setCurrentAuditId(audit.share_token);
                        setResult({
                          success: true,
                          data: audit.result_data
                        });
                        window.scrollTo({ top: 400, behavior: "smooth" });
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-xl text-xs transition shadow-md"
                    >
                      Load Report ↗
                    </button>
                  </div>
                </div>
              ))}

              {hasMoreHistory && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={loadAllHistory}
                    disabled={isLoadingAllHistory}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-sm border border-slate-200/40"
                  >
                    {isLoadingAllHistory ? "Fetching complete logs..." : "✨ View All History"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}