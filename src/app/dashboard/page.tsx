"use client";

import { useEffect, useState, useTransition } from "react";
import { analyzeUrl, getUserStats } from "../actions";
import Tooltip from "../components/Tooltip";

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

  // 🔗 Držanje ID-ja trenutno učitanog izvještaja i stanja kopiranja
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 🔄 Učitaj statse ODMAH čim se stranica otvori i korisnik uloguje
  useEffect(() => {
    async function loadStats() {
      const stats = await getUserStats();
      if (stats) setUserStats(stats);
    }
    loadStats();
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
        // Hvatamo proslijeđeni ID iz baze za kreiranje Share linka
        if (res.auditId) {
          setCurrentAuditId(res.auditId);
        }
        setResult({
          success: true,
          data: res.data as AuditData
        });
      }
    });
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

  const downloadDocx = async () => {
    if (!result?.data) return;

    const {
      score,
      pageCategory,
      aiAnalysis,
      recommendations,
      title,
      metaDescription,
      h1,
      robotsStatus,
      aiBotsStatus,
      entityTrustMap,
      semanticLayoutMap,
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
            new Paragraph({ text: `• Brand Disambiguation Alignment: ${entityTrustMap?.brandDisambiguationStatus || "Optimal"}` }),
            new Paragraph({ text: `• Semantic HTML5 Main Tag: ${semanticLayoutMap?.hasMainTag ? "Valid" : "Missing"}` }),
            new Paragraph({ text: `• Heading Hierarchy Defect (Leap): ${semanticLayoutMap?.hasHeadingLeap ? "Anomaly Detected" : "Healthy Cascade"}` }),
            new Paragraph({ text: `• Multimodal Image Alt Coverage: ${semanticLayoutMap ? semanticLayoutMap.totalImages - semanticLayoutMap.missingAltCount : 0}/${semanticLayoutMap ? semanticLayoutMap.totalImages : 0} Images Configured` }),

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white print:hidden">
      
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
          
          {/* 💎 KORISNIČKI STATS WIDGET UGRAĐEN U NAVBAR */}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Agency Name</label>
                  <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Accent Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={`#${brandColor.replace("#", "")}`} onChange={(e) => setBrandColor(e.target.value.replace("#", ""))} className="w-8 h-8 rounded-lg border cursor-pointer shrink-0" />
                    <input type="text" value={brandColor} onChange={(e) => setBrandColor(e.target.value.replace("#", ""))} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none flex-1" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Compiler Name</label>
                  <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none" />
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

        {/* RESULTS */}
        {result?.data && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            
            {/* 🛠️ SPREMNI GRID SA TRI MATIČNE EXPORT I SHARE OPCIJE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                onClick={downloadDocx} 
                className="w-full bg-slate-900 text-white hover:bg-blue-600 py-4 rounded-[16px] sm:rounded-[24px] text-xs sm:text-sm font-black tracking-wider transition shadow-lg shadow-blue-900/10"
              >
                DOWNLOAD WORD (.DOCX)
              </button>

              <button 
                onClick={copyShareLink}
                disabled={!currentAuditId}
                className={`w-full py-4 rounded-[16px] sm:rounded-[24px] text-xs sm:text-sm font-black tracking-wider transition shadow-lg border ${
                  copied 
                    ? "bg-emerald-500 text-white border-emerald-500" 
                    : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600 shadow-blue-900/10 disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-400"
                }`}
              >
                {copied ? "🔗 LINK COPIED!" : "🔗 COPY SHARE LINK"}
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
                          </div>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-3 leading-tight">
                          Multimodal models (GPT-4o/Gemini) use structural HTML tags and image descriptions to extract data context directly for rich chat snippets.
                        </p>
                      </div>
                    </div>

                    {/* SPEED METRICS GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border flex flex-col justify-between">
                        <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 flex items-center">
                          Word Count
                          <Tooltip text={AEO_EXPLANATIONS.wordCount} />
                        </div>
                        <div className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed break-words">{result.data.wordCount}</div>
                      </div>

                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border flex flex-col justify-between">
                        <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 flex items-center">
                          Conversational Q&A Loops
                          <Tooltip text={AEO_EXPLANATIONS.qaLoops} />
                        </div>
                        <div className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed break-words">{result.data.qaBlocksCount} Blocks</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border text-xs font-bold flex flex-col justify-between">
                        <span className="text-[9px] sm:text-[10px] uppercase text-slate-400 tracking-wider flex items-center mb-1">
                          Semantic Layout Density
                          <Tooltip text={AEO_EXPLANATIONS.layoutDensity} />
                        </span>
                        <span className={result.data.hasTablesOrLists ? "text-emerald-700 truncate" : "text-amber-700 truncate"}>{result.data.hasTablesOrLists ? "Tables / Lists Active" : "Low Density Blocks"}</span>
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-slate-50 border text-xs font-bold flex flex-col justify-between">
                        <span className="text-[9px] sm:text-[10px] uppercase text-slate-400 tracking-wider mb-1">Robots.txt Architecture</span>
                        <span className="truncate text-slate-700">{result.data.robotsStatus}</span>
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
      </div>

     

      {/* FOOTER */}
      <footer className="border-t border-slate-200/50 py-6 text-center text-xs font-bold text-slate-400 bg-white w-full px-4 leading-relaxed mt-12 flex flex-col items-center">
        <div>&copy; 2026 AEO Audit Pro. All rights reserved.</div>
        
        <div className="mt-1 text-slate-400/80">
          📬 For enterprise inquiries or support:{" "}
          <a 
            href="mailto:hello@aeoaudit-pro.com?subject=AEO Audit Pro Inquiry" 
            className="text-blue-600/80 hover:text-blue-600 transition-colors underline decoration-blue-500/20"
          >
            hello@aeoaudit-pro.com
          </a>
        </div>

        <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-slate-400 font-medium w-full">
          <Link 
            href="/privacy" 
            className="hover:text-slate-900 underline decoration-slate-200 hover:decoration-blue-500 transition-colors duration-200"
          >
            Privacy Policy
          </Link>
          <span className="text-slate-200">|</span>
          <Link 
            href="/terms" 
            className="hover:text-slate-900 underline decoration-slate-200 hover:decoration-blue-500 transition-colors duration-200"
          >
            Terms of Service
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