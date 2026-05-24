"use client";

import { useEffect, useState, useTransition } from "react";
import { analyzeUrl, getUserStats, getUserAuditHistory } from "../actions";
import Tooltip from "../components/Tooltip";
import Footer from "../components/Footer";
import { AuditData, TabId, AEO_EXPLANATIONS } from "../lib/types"; 
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  Header,
} from "docx";
import { saveAs } from "file-saver";

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

export default function Home() {
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    data?: AuditData;
  } | null>(null);

  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("metrics");

  const [showBranding, setShowBranding] = useState(false);
  const [agencyName, setAgencyName] = useState("AEO Audit Pro");
  const [brandColor, setBrandColor] = useState("2563eb"); 
  const [authorName, setAuthorName] = useState("Senior AEO Strategist");

  // 🔗 Držanje UUID share_tokena trenutno učitanog izvještaja i stanja kopiranja
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 📜 Stanja za dinamičko učitavanje i paginaciju istorije logova
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [isLoadingAllHistory, setIsLoadingAllHistory] = useState(false);

  // 🛡️ Provera da li je korisnik na besplatnom planu
  const isFreePlan = !userStats || userStats.plan === "FREE";

  // 🔄 Učitaj statse i prva 5 audita ODMAH čim se stranica otvori
  useEffect(() => {
    async function loadInitialData() {
      const stats = await getUserStats();
      if (stats) setUserStats(stats);

      // Tražimo samo 5 najnovijih audita za instant učitavanje ⚡
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
        
        // Ako je baza vratila tačno 5 stavki, pretpostavljamo da ima još za "View All"
        if (formattedHistory.length === 5) {
          setHasMoreHistory(true);
        }
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
      
      if (res && "userStats" in res) {
        setUserStats(res.userStats as UserStats);
      }

      if ("error" in res) {
        setResult({ error: res.error });
      } else if (res.success && res.data) {
        if (res.auditId) {
          setCurrentAuditId(res.auditId);
        }

        // ⚡ Reaktivno dodavanje novog audita na vrh istorije u realnom vremenu
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

  // 📜 Funkcija koja skida klijentski limit i povlači kompletne logove iz baze
  const loadAllHistory = async () => {
    setIsLoadingAllHistory(true);
    const historyRes = await getUserAuditHistory(); // Bez parametara povlači sve unose
    
    if (historyRes?.success && historyRes.history) {
      const formattedHistory: AuditHistoryItem[] = historyRes.history.map((item) => ({
        id: item.id,
        website_url: item.website_url,
        created_at: item.created_at,
        share_token: item.share_token,
        result_data: item.result_data as unknown as AuditData,
      }));

      setHistory(formattedHistory);
      setHasMoreHistory(false); // Gasimo dugme jer je istorija kompletirana
    }
    setIsLoadingAllHistory(false);
  };

  // 📋 Funkcija za kopiranje pametnog share linka na klijentski clipboard
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
  
  // 🚀 Očišćena i direktna funkcija bez hashtagova – unosi tekst instantno unutar LinkedIn-a
  const shareOnLinkedIn = () => {
    if (!currentAuditId || !result?.data) return;

    const shareUrl = `${window.location.origin}/share/${currentAuditId}`;
    
    // 🔍 Tražimo URL skeniranog sajta na 3 nivoa
    let targetUrl = "";
    if (result.data.website_url) {
      targetUrl = result.data.website_url;
    } else {
      const matchingAudit = history.find(h => h.share_token === currentAuditId);
      if (matchingAudit) {
        targetUrl = matchingAudit.website_url;
      }
    }

    let displayUrl = "this website";
    if (targetUrl) {
      try {
        const parsingUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
        displayUrl = new URL(parsingUrl).hostname.replace("www.", "");
      } catch (e) {
        displayUrl = targetUrl.replace("https://", "").replace("http://", "").replace("www.", "");
      }
    }

    // 🛡️ Prelom domena (npr. figma . com) da se LinkedIn ne zbuni oko primarnog linka
    const lastDotIndex = displayUrl.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      displayUrl = displayUrl.substring(0, lastDotIndex) + " . " + displayUrl.substring(lastDotIndex + 1);
    }

    const text = `🎯 AI Visibility Audit for ${displayUrl} is officially LIVE via AEO Audit Pro!\n\n` +
                 `The Answer Engine Optimization (AEO) score is ${result.data.score}/100. The platform just analyzed how top-tier AI models like ChatGPT, Perplexity, and Claude crawl, parse, and extract this domain's content hierarchy.\n\n` +
                 `See how this site stacks up in the age of AI search and review the live, interactive report here: ${shareUrl}`;

    const linkedinUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;

    window.open(linkedinUrl, "_blank", "width=600,height=600,scrollbars=yes,resizable=yes");
  };

  // 🐦 DODATO: Funkcija za deljenje na platformi X (Twitter) sa Intent Popup prozorom
  // 🐦 POPRAVLJENO: Funkcija za deljenje na platformi X bez lažnih linkova domena
  const shareOnX = () => {
    if (!currentAuditId || !result?.data) return;

    const shareUrl = `${window.location.origin}/share/${currentAuditId}`;
    
    // 🔍 Tražimo URL skeniranog sajta na 3 nivoa
    let targetUrl = "";
    if (result.data.website_url) {
      targetUrl = result.data.website_url;
    } else {
      const matchingAudit = history.find(h => h.share_token === currentAuditId);
      if (matchingAudit) {
        targetUrl = matchingAudit.website_url;
      }
    }

    let displayUrl = "this website";
    if (targetUrl) {
      try {
        const parsingUrl = targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`;
        displayUrl = new URL(parsingUrl).hostname.replace("www.", "");
      } catch (e) {
        displayUrl = targetUrl.replace("https://", "").replace("http://", "").replace("www.", "");
      }
    }

    // 🛡️ RAZMAK ZA X (TWITTER): Prelom domena (npr. elitebounce . fit) da X ne napravi pogrešan link
    const lastDotIndex = displayUrl.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      displayUrl = displayUrl.substring(0, lastDotIndex) + " . " + displayUrl.substring(lastDotIndex + 1);
    }

    const tweetText = `Just ran an AI Search & AEO Audit for ${displayUrl} using AEO Audit Pro. Our optimization score is ${result.data.score}/100! Checking if ChatGPT, Perplexity, and Gemini can index and cite our brand. 🚀\n\nReview the live interactive report here:`;
    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}&hashtags=AEO,SEO,SaaS`;

    window.open(xUrl, "_blank", "width=600,height=450,scrollbars=yes,resizable=yes");
  };

  const downloadDocx = async () => {
    // 🔒 Blokada za besplatne korisnike
    if (isFreePlan) {
      alert("🔒 Word (.DOCX) Export is a Premium Feature.\n\nPlease upgrade your plan under the Pricing section to unlock downloadable executive reports for your clients.");
      return;
    }

    if (!result?.data) return;

    const {
      score,
      pageCategory,
      aiAnalysis,
      recommendations,
      title,
      metaDescription,
      h1,
      aiBotsStatus,
      entityTrustMap,
      semanticLayoutMap,
      hasVideoElements, 
      javascriptDependency,
      bluffScore,
      atomicStructureScore,
      entityDensityScore,
      sentenceSimplicityScore,
    } = result.data;

    const cleanHexColor = brandColor.replace("#", "").trim();

    const doc = new Document({
      sections: [
        {
          properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ 
                      text: `Prepared by: ${agencyName} | Strategic Intelligence`, 
                      size: 16, 
                      color: "94a3b8", 
                      italics: true 
                    })
                  ],
                }),
              ],
            }),
          },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: agencyName.toUpperCase(), bold: true, size: 18, color: cleanHexColor })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "ANSWER ENGINE OPTIMIZATION AUDIT", bold: true, size: 32, color: "0f172a" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `Detected Category / Niche: ${pageCategory || "General Website"}`.toUpperCase(), bold: true, size: 14, color: "64748b" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: `Overall Visibility Score: ${score}/100`, bold: true, size: 26, color: cleanHexColor })] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 }, children: [new TextRun({ text: "Executive Summary", color: "0f172a", bold: true, size: 24 })] }),
            new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Target Title: ", bold: true }), new TextRun({ text: title })] }),
            new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Meta Description: ", bold: true }), new TextRun({ text: metaDescription })] }),
            new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: "Primary H1 Anchor: ", bold: true }), new TextRun({ text: h1 })] }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "AEO Content Core Pillars Score", color: "0f172a", bold: true, size: 24 })] }),
            new Paragraph({ text: `• BLUFF Alignment (Bottom Line Up Front): ${bluffScore || 5}/10` }),
            new Paragraph({ text: `• LLM Chunking Readiness (Atomic Structure): ${atomicStructureScore || 5}/10` }),
            new Paragraph({ text: `• Entity Density (vs Generic Fluff): ${entityDensityScore || 5}/10` }),
            new Paragraph({ text: `• Syntactic Simplicity (Declarative Writing): ${sentenceSimplicityScore || 5}/10` }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "AI Crawler Access & Entity Token Map", color: "0f172a", bold: true, size: 24 })] }),
            new Paragraph({ text: `• OpenAI GPTBot Clearance: ${aiBotsStatus?.gptBot || "Allowed"}` }),
            new Paragraph({ text: `• OpenAI SearchBot Clearance: ${aiBotsStatus?.oaiSearchBot || "Allowed"}` }),
            new Paragraph({ text: `• Perplexity AI Engine Status: ${aiBotsStatus?.perplexityBot || "Allowed"}` }),
            new Paragraph({ text: `• Claude Bot Architecture: ${aiBotsStatus?.claudeBot || "Allowed"}` }),
            new Paragraph({ text: `• Gemini Extended Radar: ${aiBotsStatus?.googleExtended || "Allowed"}` }),
            new Paragraph({ text: `• DeepSeek Engine Visibility: ${aiBotsStatus?.deepSeekBot || "Allowed"}` }),
            new Paragraph({ text: `• Applebot Agent Deployment: ${aiBotsStatus?.appleBotExtended || "Allowed"}` }),
            new Paragraph({ text: `• Microsoft Bingbot Indexation: ${aiBotsStatus?.bingbot || "Allowed"}` }),
            new Paragraph({ text: `• Brand Disambiguation Alignment: ${entityTrustMap?.brandDisambiguationStatus || "Optimal"}` }),
            new Paragraph({ text: `• Semantic HTML5 Main Tag: ${semanticLayoutMap?.hasMainTag ? "Valid" : "Missing"}` }),
            new Paragraph({ text: `• Heading Hierarchy Defect (Leap): ${semanticLayoutMap?.hasHeadingLeap ? "Anomaly Detected" : "Healthy Cascade"}` }),
            new Paragraph({ text: `• Visual RAG Video Assets: ${hasVideoElements ? "Optimized (Embedded Video Tracked)" : "Deficit (No Rich Media Found)"}` }), 
            new Paragraph({ text: `• Multimodal Image Alt Coverage: ${semanticLayoutMap ? semanticLayoutMap.totalImages - semanticLayoutMap.missingAltCount : 0}/${semanticLayoutMap ? semanticLayoutMap.totalImages : 0} Images Configured` }),
            new Paragraph({ text: `• JavaScript Framework Dependency: ${javascriptDependency === "Critical" ? "Critical Risk (Heavy Client-Side Rendering)" : "Optimal (Server-Side Rendered / Fast)"}` }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "Prioritized Tactical Optimization Playbook", color: "0f172a", bold: true, size: 24 })] }),
            ...recommendations.map((item) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 100 }, children: [new TextRun({ text: item })] })),

            new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Audit compiled organically by ${authorName}. Powered by AEO Audit Framework.`, size: 14, color: "64748b", italics: true })] }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `AEO-Report-${agencyName.replace(/\s+/g, "-")}.docx`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      
      {/* NAVBAR */}
      <nav className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent border-b border-slate-200/40 sm:border-none">
        <Link href="/" className="group cursor-pointer select-none">
          <div className="text-2xl font-black tracking-tight italic">
            AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200">Audit</span> Pro
          </div>
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Link href="/how-it-works" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer">
            How It Works
          </Link>
          <Link href="/pricing" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer">
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
      <div className="max-w-5xl mx-auto px-4 sm:px-8 md:px-12 flex-1 w-full mt-6">
        
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

            <div className="pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowBranding(!showBranding)} className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition">
                <span className={`transform transition duration-200 ${showBranding ? "rotate-90" : ""}`}>▶</span>
                {showBranding ? "Hide Agency Branding Options" : "Show Agency White-Label Options"}
              </button>
            </div>

            {showBranding && (
              <div className="relative pt-4 border-t border-slate-50">
                {/* 🔒 PAYWALL OVERLAY ZA BELU LABELU */}
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

                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${isFreePlan ? "opacity-40 select-none pointer-events-none" : ""}`}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Agency Name</label>
                    <input type="text" disabled={isFreePlan} value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Accent Color</label>
                    <div className="flex gap-2">
                      <input type="color" disabled={isFreePlan} value={`#${brandColor.replace("#", "")}`} onChange={(e) => setBrandColor(e.target.value.replace("#", ""))} className="w-8 h-8 rounded-lg border cursor-pointer shrink-0" />
                      <input type="text" disabled={isFreePlan} value={brandColor} onChange={(e) => setBrandColor(e.target.value.replace("#", ""))} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none flex-1 focus:border-blue-500 bg-white" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Compiler Name</label>
                    <input type="text" disabled={isFreePlan} value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white" />
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
            
            {/* 🛠️ PROŠIREN ACTION GRID: Sada ima 4 ravnopravne kolone sa ubačenim X dugmetom */}
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
                {copied ? "🔗 LINK COPIED!" : "🔗 COPY SHARE LINK"}
              </button>

              <button 
                onClick={shareOnLinkedIn}
                disabled={!currentAuditId}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 py-4 rounded-[16px] sm:rounded-[24px] text-xs sm:text-sm font-black tracking-wider transition shadow-lg disabled:bg-slate-200 disabled:text-slate-400 font-sans flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="font-serif lowercase font-bold text-sm tracking-tighter">in</span> SHARE ON LINKEDIN
              </button>

              {/* 🐦 NOVO UBAČENO: SHARE ON X (TWITTER) BUTTON */}
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

              {/* TABS HEADER */}
              <div className="flex flex-wrap border-b border-slate-100 bg-slate-50/50 p-1.5 sm:p-2 gap-1">
                {(
                  [
                    { id: "metrics", label: "Core Metrics" },
                    { id: "analysis", label: "AI Semantic Insights" },
                    { id: "recommendations", label: "Strategic Actions" },
                    { id: "robots", label: "Robots.txt" },
                  ] as const 
                ).map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex-1 md:flex-none px-3 sm:px-6 py-2.5 sm:py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition ${activeTab === tab.id ? "bg-white text-blue-600 shadow-sm border border-slate-200/60" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT PANELS */}
              <div className="p-4 sm:p-8 md:p-12">
                {activeTab === "metrics" && (
                  <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                    
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

                      {/* AI SEMANTIC BLUEPRINT */}
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

                    {/* RE-DIZAJNIRANI SPEED & TEHNIČKI GRID */}
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

                    {/* METADATA SUMMARY */}
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

                {activeTab === "analysis" && (
                  <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                    
                    {/* 4 CORE AEO PILLARS */}
                    <div>
                      <div className="flex items-center gap-3 mb-4 sm:mb-5">
                        <div className="w-2 h-6 bg-blue-600 rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">LLM Reading Competency (AEO Content Pillars)</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/60">
                        
                        {/* 1. BLUFF */}
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

                        {/* 2. ATOMIC */}
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

                        {/* 3. ENTITY DENSITY */}
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

                        {/* 4. SIMPLICITY */}
                        <div className="bg-white p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wide">Syntactic Simplicity</span>
                            <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{result.data.sentenceSimplicityScore || 5}/10</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${(result.data.sentenceSimplicityScore || 5) * 10}%` }} />
                          </div>
                          <p className="text-[10px] font-medium text-slate-400 leading-snug">Measures sentence structural speed. Favors declarative Subject-Verb-Object models carrying exactly one idea.</p>
                        </div>

                      </div>
                    </div>

                    {/* AI TEXT MODULE */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-6 bg-blue-600 rounded-full" />
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Executive LLM Diagnostics</h3>
                      </div>
                      <div className="bg-slate-50 rounded-[16px] p-4 sm:p-5 border text-sm leading-relaxed text-slate-700 whitespace-pre-line font-medium shadow-inner">{result.data.aiAnalysis}</div>
                    </div>

                  </div>
                )}

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

                      {/* 🚨 DINAMIČKI DODATAK ZA JAVASCRIPT UKOLIKO POSTOJI KRITIČAN RIZIK */}
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
                )}

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

        {/* 📜 MODERAN PANEL ZA AUTOMATSKU PAGINACIJU KORISNIČKE ISTORIJE */}
        <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 shadow-xl shadow-blue-900/5 mt-12 mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-slate-900 rounded-full" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Your Recent Audit Logs</h3>
            </div>
            {/* 💡 Elegantno obavještenje o brisanju nakon 30 dana */}
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
                      
                      {/* ⏱️ Računica za preostale dane do brisanja */}
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

              {/* 🔽 DUGME ZA DINAMIČKI DOHVAT SVIH PREOSTALIH AUDITA IZ BAZE REAKTIVNO */}
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border flex flex-col justify-between">
      <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">{label}</div>
      <div className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed break-words">{value}</div>
    </div>
  );
}