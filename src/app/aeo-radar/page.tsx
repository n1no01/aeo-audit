'use client';

import { useState, FormEvent, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { getUserStats, getUserRadarHistory } from '../actions';
import Footer from '../components/Footer';

const loadingSteps = [
  "Initializing radar components...",
  "Routing live matrix nodes...",
  "Crawling Conversational SERPs...",
  "Evaluating citations on Perplexity networks...",
  "Parsing semantic competitive vectors...",
  "Synthesizing RAG answer summary...",
  "Building live matrix profile...",
];

interface RadarAuditResult {
  isMentioned: boolean;
  mentionContext: string;
  aiAnswerSummary: string;
  topCompetitors: string[];
}

interface RadarResultData {
  auditResult: RadarAuditResult;
  allSourcesCrawled: string[];
}

interface DBRadarHistoryItem {
  id: number;
  website_url: string;
  keyword: string;
  created_at: string;
  share_token: string;
  result_data: RadarResultData;
}

interface ApiResponse {
  auditResult: RadarAuditResult;
  allSourcesCrawled: string[];
}

interface UserStats {
  plan: string;
  limit: number;
  used: number;
  radar_used: number;
  radar_limit: number;
}

export default function AEORadarPage() {
  // Input stanja (mogu se slobodno mijenjati tokom kucanja)
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  
  // Stanja zaključanih podataka za trenutno prikazani izvještaj
  const [scannedUrl, setScannedUrl] = useState<string>('');
  const [scannedKeyword, setScannedKeyword] = useState<string>('');
  
  const [results, setResults] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // 🔗 Dijeljenje i kopiranje linkova
  const [currentRadarShareToken, setCurrentRadarShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Stanja za istoriju pretraga
  const [history, setHistory] = useState<DBRadarHistoryItem[]>([]);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isLoadingAllHistory, setIsLoadingAllHistory] = useState(false);

  // 🔒 Provjera da li je korisnik na besplatnom planu
  const isFreePlan = userStats?.plan?.toLowerCase() === 'free';
  const isRadarLimitReached = userStats ? userStats.radar_used >= userStats.radar_limit : false;

  // 🔄 1. Učitavanje inicijalnih podataka (Top 5 logova i statistika)
  useEffect(() => {
    async function initPage() {
      try {
        const stats = await getUserStats();
        if (stats) setUserStats(stats as unknown as UserStats);

        const historyRes = await getUserRadarHistory(5);
        if (historyRes.success && historyRes.history) {
          setHistory(historyRes.history);
          if (historyRes.history.length === 5) {
            setHasMoreHistory(true);
          }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        loadingStats && setLoadingStats(false);
      }
    }
    initPage();
  }, []);

  // 🔄 2. Korak kroz loading animacije
  useEffect(() => {
    if (!isPending) return;
    const interval = setInterval(() => {
      setLoadingIndex((prev) => (prev + 1) % loadingSteps.length);
    }, 1700);
    return () => clearInterval(interval);
  }, [isPending]);

  // 🔄 3. Učitavanje kompletne istorije (View All History)
  const loadAllHistory = async () => {
    if (isFreePlan) return;
    setIsLoadingAllHistory(true);
    const historyRes = await getUserRadarHistory();
    if (historyRes.success && historyRes.history) {
      setHistory(historyRes.history);
      setHasMoreHistory(false);
    }
    setIsLoadingAllHistory(false);
  };

  // 🔄 4. Instantno i besplatno učitavanje istorijskog skena u UI
  const handleLoadFromHistory = (item: DBRadarHistoryItem) => {
    if (isFreePlan) return;
    
    // Sinkronizujemo inpute, ali zaključavamo prikazane podatke
    setTargetUrl(item.website_url);
    setKeyword(item.keyword);
    setScannedUrl(item.website_url);
    setScannedKeyword(item.keyword);
    
    setCurrentRadarShareToken(item.share_token); 
    setResults({
      auditResult: item.result_data.auditResult,
      allSourcesCrawled: item.result_data.allSourcesCrawled
    });
    setError(null);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // 🔄 5. Funkcije za generisanje i slanje linkova na mreže
  const copyShareLink = async () => {
    if (!currentRadarShareToken) return;
    const shareUrl = `${window.location.origin}/share-radar/${currentRadarShareToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy share link:", err);
    }
  };

  const shareOnLinkedIn = () => {
    if (!currentRadarShareToken || !results) return;
    const shareUrl = `${window.location.origin}/radar-share/${currentRadarShareToken}`;
    
    // Koristimo zaključani scannedUrl i scannedKeyword umjesto dinamičkih inputa
    const cleanDisplayUrl = scannedUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    const antiPreviewDomain = cleanDisplayUrl.replace('.', ' . ');
    
    const text = `🎯 Live AI Visibility Radar Check for ${antiPreviewDomain} is officially LIVE!\n\n` +
                 `The Answer Engine Optimization (AEO) scan checked if leading LLMs cite or recommend our brand for the query: "${scannedKeyword}".\n\n` +
                 `State: ${results.auditResult.isMentioned ? "🟢 Optimized Node" : "🔴 Invisible Vector"}\n\n` +
                 `Review the live, interactive RAG report here: ${shareUrl}`;
                 
    const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    window.open(linkedinUrl, "_blank", "width=600,height=600,scrollbars=yes,resizable=yes");
  };

  const shareOnX = () => {
    if (!currentRadarShareToken || !results) return;
    const shareUrl = `${window.location.origin}/radar-share/${currentRadarShareToken}`;
    
    // Koristimo zaključani scannedUrl i scannedKeyword umjesto dinamičkih inputa
    const cleanDisplayUrl = scannedUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    const antiPreviewDomain = cleanDisplayUrl.replace('.', ' . ');
    
    const tweetText = `Just ran an AI Radar scan for ${antiPreviewDomain} regarding "${scannedKeyword}".\n\n` +
                      `State: ${results.auditResult.isMentioned ? "🟢 AI Optimized" : "🔴 AI Invisible"}\n\n` +
                      `Review the interactive report matrix here: ${shareUrl} #AEO #LLM #SaaS`;
                      
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(xUrl, "_blank", "width=600,height=450,scrollbars=yes,resizable=yes");
  };

  const handleAudit = (e: FormEvent) => {
    e.preventDefault();
    if (isFreePlan) {
      setError('🔒 AI Radar is a premium feature. Please upgrade your plan to access it.');
      return;
    }
    if (isRadarLimitReached) {
      setError('🔒 You have reached your AI Radar credit limit. Please upgrade your plan.');
      return;
    }

    setResults(null);
    setLoadingIndex(0);
    setError(null);
    setCurrentRadarShareToken(null);

    const cleanUrl = targetUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    // Privremeno čuvamo pojam jer se 'keyword' može promijeniti tokom asinhronog rada mrežnog zahtjeva
    const currentActiveKeyword = keyword;

    startTransition(async () => {
      try {
        const response = await fetch('/api/aeo-radar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUrl: cleanUrl, keyword: currentActiveKeyword }),
        });

        const resData = await response.json();

        if (!response.ok) {
          throw new Error(resData.error || 'Failed to run AEO radar scan.');
        }

        // Zaključavamo podatke tek nakon uspješnog API odgovora
        setScannedUrl(cleanUrl);
        setScannedKeyword(currentActiveKeyword);
        setResults(resData);
        
        if (resData.shareToken) {
          setCurrentRadarShareToken(resData.shareToken);
        }
        
        if (userStats) {
          setUserStats({ ...userStats, radar_used: userStats.radar_used + 1 });
        }

        const newHistoryItem: DBRadarHistoryItem = {
          id: Date.now(),
          website_url: cleanUrl,
          keyword: currentActiveKeyword,
          created_at: new Date().toISOString(),
          share_token: resData.shareToken || "",
          result_data: resData
        };
        setHistory((prev) => [newHistoryItem, ...prev]);

      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      
      {/* 📡 GLOBALNA POZADINSKA MREŽA */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />

      {/* NAVBAR */}
      <nav className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent border-b border-slate-200/40 sm:border-none relative z-10">
        <Link href="/dashboard" className="group cursor-pointer select-none">
          <div className="text-2xl font-black tracking-tight italic">
            AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200">Audit</span> Pro
          </div>
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Link href="/dashboard" className="text-xs sm:text-sm font-bold text-slate-500 hover:text-blue-600 transition">
            &larr; Back to Dashboard
          </Link>
          
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          
          {!loadingStats && userStats && !isFreePlan && (
            <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-200/50 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm animate-in fade-in duration-200">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-900 text-white">
                📡 RADAR
              </span>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[10px] text-slate-700 font-black">
                  {userStats.radar_used ?? 0}/{userStats.radar_limit} Used
                </span>
                <div className="w-16 bg-slate-200 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${ (userStats.radar_used ?? 0) >= (userStats.radar_limit || 1) ? "bg-rose-500" : "bg-blue-600" }`}
                    style={{ 
                      width: `${Math.min(((userStats.radar_used ?? 0) / (userStats.radar_limit || 1)) * 100, 100)}%` 
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
              Real-Time Answer Engine Scanner
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight italic">
            AI Visibility<span className="text-blue-600"> Radar</span>
          </h1>
          <p className="text-slate-500 mt-4 sm:mt-5 text-sm sm:text-lg max-w-2xl mx-auto font-medium">
            Scan the live web through the eyes of Conversational AI engines. Track citations safely using your package credits.
          </p>
        </header>

        {/* CONTROLS CONTAINER (FORM & BLUR OVERLAYS) */}
        <div className="relative">
          
          {/* PREMIUM BLOCK OVERLAY */}
          {!loadingStats && isFreePlan && (
            <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-md z-30 flex flex-col items-center justify-center rounded-[24px] sm:rounded-[32px] p-6 text-center border border-slate-200/60 shadow-inner">
              <div className="bg-slate-950 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-3 shadow-md flex items-center gap-2">
                <span>🔒 PREMIUM FEATURE</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
                Unlock AI Visibility Radar
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold max-w-md mb-6 leading-relaxed">
                Real-time tracking across conversational nodes and Perplexity networks is exclusive to Premium accounts. Upgrade today to launch your matrix scans.
              </p>
              <Link 
                href="/pricing" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-sm font-black tracking-wide shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                UPGRADE NOW &rarr;
              </Link>
            </div>
          )}

          {/* FORM */}
          <div className={`bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 shadow-xl shadow-blue-900/5 mb-12 relative ${isFreePlan ? 'pointer-events-none select-none opacity-50' : ''}`}>
            
            {!isFreePlan && isRadarLimitReached && (
              <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center rounded-[24px] sm:rounded-[32px] p-4 text-center">
                <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-1 shadow-sm">
                  🔒 Radar Limit Reached
                </span>
                <p className="text-[11px] text-slate-500 font-bold max-w-sm">
                  You have used all {userStats?.radar_limit} available radar scans for this billing period.{" "}
                  <Link href="/pricing" className="text-blue-600 underline hover:text-blue-700">
                    Upgrade your plan
                  </Link>
                </p>
              </div>
            )}

            <form onSubmit={handleAudit} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text" 
                  required
                  disabled={isRadarLimitReached || isFreePlan}
                  placeholder="Your domain (e.g., example.com)"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="flex-1 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-200/60 rounded-[16px] sm:rounded-[20px] outline-none font-semibold text-sm sm:text-base text-slate-700 focus:border-blue-500 focus:bg-white transition"
                />
                <input
                  type="text" 
                  required
                  disabled={isRadarLimitReached || isFreePlan}
                  placeholder="Target Search Query / Keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="flex-1 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-200/60 rounded-[16px] sm:rounded-[20px] outline-none font-semibold text-sm sm:text-base text-slate-700 focus:border-blue-500 focus:bg-white transition"
                />
                <button disabled={isPending || isRadarLimitReached || isFreePlan} className="bg-slate-900 text-white px-6 sm:px-10 py-3.5 sm:py-4 rounded-[16px] sm:rounded-[20px] text-sm sm:text-base font-black hover:bg-blue-600 transition disabled:bg-slate-300 shrink-0">
                  {isPending ? "SCANNING VECTOR..." : "LAUNCH RADAR SCAN"}
                </button>
              </div>
            </form>
          </div>

          {/* LOADING SCREEN */}
          {isPending && (
            <div className="mb-10 block animate-in fade-in duration-200">
              <div className="bg-white border border-slate-100 rounded-[24px] sm:rounded-[40px] p-5 sm:p-10 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-blue-500/5 animate-pulse" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-1.5">Live Radar Engine</div>
                    <h2 className="text-xl sm:text-3xl font-black tracking-tight">Running Live Matrix Scan</h2>
                  </div>
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0"><div className="absolute inset-0 rounded-full border-4 border-slate-100" /><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" /></div>
                </div>
                <div className="h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden mb-6 sm:mb-8"><div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" /></div>
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border"><div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 sm:mb-3">Current Operation</div><p className="text-sm sm:text-base font-bold text-slate-700 animate-pulse">{loadingSteps[loadingIndex]}</p></div>
              </div>
            </div>
          )}

          {error && <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[20px] p-5 sm:p-6 font-bold text-center text-sm sm:text-base mb-10">{error}</div>}

          {/* REZULTATI SA PROZORIMA I AKCIONIM GRIDOM ZA RADAR SHARE */}
          {results && !isFreePlan && (
            <div className="space-y-6 sm:space-y-8 mb-12 animate-in fade-in slide-in-from-bottom-10 duration-700">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button 
                  onClick={copyShareLink}
                  disabled={!currentRadarShareToken}
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
                  disabled={!currentRadarShareToken}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 py-4 rounded-[16px] sm:rounded-[24px] text-xs sm:text-sm font-black tracking-wider transition shadow-lg disabled:bg-slate-200 disabled:text-slate-400 font-sans flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="font-serif lowercase font-bold text-sm tracking-tighter">in</span> SHARE ON LINKEDIN
                </button>

                <button 
                  onClick={shareOnX}
                  disabled={!currentRadarShareToken}
                  className="w-full bg-black text-white hover:bg-slate-900 py-4 rounded-[16px] sm:rounded-[24px] text-xs sm:text-sm font-black tracking-wider transition shadow-lg disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  SHARE ON X
                </button>
              </div>

              <div className="bg-white rounded-[24px] md:rounded-[48px] overflow-hidden border border-slate-100 shadow-2xl">
                
                {/* STATUS TOP BAR */}
                <div className="bg-slate-900 text-white p-5 sm:p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 md:gap-8 w-full md:w-auto">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[16px] sm:rounded-[20px] bg-white text-slate-900 flex flex-col items-center justify-center shrink-0 shadow-lg mx-auto sm:mx-0">
                      <span className="text-3xl sm:text-4xl font-black">{results.auditResult.isMentioned ? "🟢" : "🔴"}</span>
                    </div>
                    <div className="text-center sm:text-left w-full sm:w-auto overflow-hidden">
                      <div className="inline-flex items-center px-2.5 py-1 mb-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                        <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase text-blue-400">
                          Live RAG Status Tracker
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-3xl font-black tracking-tight">
                        {results.auditResult.isMentioned ? "AI Optimized Node" : "AI Invisible Vector"}
                      </h2>
                      {/* Koristimo zaključanu vrijednost za query podnaslov */}
                      <p className="text-slate-400 mt-1.5 text-xs sm:text-sm max-w-full italic font-medium">
                        &ldquo;{scannedKeyword}&rdquo;
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 w-full md:w-auto text-center">
                    <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-blue-400 font-black mb-0.5 sm:mb-1">CITATION PROBABILITY</div>
                    <div className="text-lg sm:text-2xl font-black italic uppercase text-white">
                      {results.auditResult.isMentioned ? "High Focus" : "Suppressed"}
                    </div>
                  </div>
                </div>

                {/* GRIDS SA DIAGNOSTIKOM */}
                <div className="p-4 sm:p-8 md:p-12 space-y-6">
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 border">
                    <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">AI Engine Context Output</div>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">{results.auditResult.mentionContext}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 border flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">🤖 AI Generated Summary Loop</div>
                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold italic border-l-2 border-slate-300 pl-3 bg-white p-4 rounded-xl shadow-sm">
                          &quot;{results.auditResult.aiAnswerSummary}&quot;
                        </p>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 border flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">🏆 Captured Citation Leaders</div>
                        <ul className="space-y-2">
                          {results.auditResult.topCompetitors.map((comp, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-200/60 p-2.5 rounded-xl shadow-sm">
                              <span className="text-[9px] font-black px-2 py-0.5 bg-slate-900 text-white rounded">#{idx + 1}</span>
                              {comp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {results.allSourcesCrawled.length > 0 && (
                    <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 border">
                      <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Live RAG Matrix Sources ({results.allSourcesCrawled.length})</div>
                      <div className="max-h-32 overflow-y-auto text-xs font-semibold text-slate-600 space-y-2 pr-1">
                        {results.allSourcesCrawled.map((source, idx) => (
                          <a key={idx} href={source} target="_blank" rel="noopener noreferrer" className="block truncate bg-white border p-2 rounded-xl hover:text-blue-500 transition shadow-sm">
                            🔗 {source}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* RECENT RADAR LOGS */}
          <div className={`bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-xl shadow-blue-900/5 mt-12 mb-12 relative z-10 ${isFreePlan ? 'pointer-events-none select-none opacity-40' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-6 bg-slate-900 rounded-full" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Your Recent Radar Logs</h3>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/60 text-amber-700 text-[10px] font-bold rounded-xl shrink-0">
                <span>⏱️ Logs cached instantly</span>
              </div>
            </div>
            
            {history.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-dashed rounded-2xl">
                <p className="text-xs font-bold text-slate-400 italic">No previous radar matrix scans discovered on this profile.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {history.map((scan) => (
                  <div key={scan.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 border border-slate-100 p-4 rounded-2xl gap-4 hover:border-blue-500/30 transition-all duration-200">
                    <div className="overflow-hidden">
                      <div className="text-sm font-black text-slate-800 truncate">{scan.website_url}</div>
                      <div className="text-slate-400 font-semibold text-[11px] mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span>Query: <span className="text-blue-600 font-black">&ldquo;{scan.keyword}&rdquo;</span></span>
                        <span className="text-slate-200">|</span>
                        <span>State: <span className={`font-black ${scan.result_data.auditResult.isMentioned ? "text-emerald-600" : "text-amber-600"}`}>{scan.result_data.auditResult.isMentioned ? "Optimized" : "Invisible"}</span></span>
                        <span className="text-slate-200">|</span>
                        <span className="text-slate-400 font-medium">{new Date(scan.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                        
                        <span className="text-slate-200">|</span>
                        {(() => {
                          const createdDate = new Date(scan.created_at).getTime();
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
                          if (isFreePlan) return;
                          if (!scan.share_token) {
                            alert("⚠️ This historical record is missing a share token.");
                            return;
                          }
                          const shareUrl = `${window.location.origin}/radar-share/${scan.share_token}`;
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            alert(`🔗 Share link successfully copied for: ${scan.website_url}`);
                          } catch (err) {
                            console.error("Failed to copy link from history:", err);
                          }
                        }}
                        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition shadow-sm"
                      >
                        Copy Link
                      </button>
                      
                      <button
                        onClick={() => handleLoadFromHistory(scan)}
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
                      disabled={isLoadingAllHistory || isFreePlan}
                      className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-black uppercase tracking-wider rounded-xl transition shadow-sm border border-slate-200/40"
                    >
                      {isLoadingAllHistory ? "Fetching complete matrix..." : "✨ View All History"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}