"use client";

import { useEffect, useState, useTransition } from "react";
import { analyzeUrl, AuditData } from "./actions";
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

type TabId = "metrics" | "analysis" | "recommendations" | "robots";

export default function Home() {
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    data?: AuditData;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("metrics");

  const [showBranding, setShowBranding] = useState(false);
  const [agencyName, setAgencyName] = useState("AEO Pulse Pro");
  const [brandColor, setBrandColor] = useState("2563eb"); 
  const [authorName, setAuthorName] = useState("Senior AEO Strategist");

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
    setActiveTab("metrics"); 
    startTransition(async () => {
      const res = await analyzeUrl(formData);
      setResult(res); 
    });
  };

  const downloadDocx = async () => {
    if (!result?.data) return;

    const {
      score,
      aiAnalysis,
      recommendations,
      title,
      metaDescription,
      h1,
      wordCount,
      robotsStatus,
      aiBotsStatus,
      entityTrustMap,
      semanticLayoutMap,
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
                  children: [new TextRun({ text: `Prepared by: ${agencyName} | Strategic Intelligence`, size: 16, color: "94a3b8", italics: true })],
                }),
              ],
            }),
          },
          children: [
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: agencyName.toUpperCase(), bold: true, size: 18, color: cleanHexColor })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "ANSWER ENGINE OPTIMIZATION AUDIT", bold: true, size: 32, color: "0f172a" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: `Overall Visibility Score: ${score}/100`, bold: true, size: 26, color: cleanHexColor })] }),
            
            new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 }, children: [new TextRun({ text: "Executive Summary", color: "0f172a", bold: true, size: 24 })] }),
            new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Target Title: ", bold: true }), new TextRun({ text: title })] }),
            new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Meta Description: ", bold: true }), new TextRun({ text: metaDescription })] }),
            new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: "Primary H1 Anchor: ", bold: true }), new TextRun({ text: h1 })] }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "AI Crawler Access & Entity Token Map", color: "0f172a", bold: true, size: 24 })] }),
            new Paragraph({ text: `• OpenAI GPTBot Clearance: ${aiBotsStatus?.gptBot || "Allowed"}` }),
            new Paragraph({ text: `• OpenAI SearchBot Clearance: ${aiBotsStatus?.oaiSearchBot || "Allowed"}` }),
            new Paragraph({ text: `• Perplexity AI Engine Status: ${aiBotsStatus?.perplexityBot || "Allowed"}` }),
            new Paragraph({ text: `• Brand Disambiguation Alignment: ${entityTrustMap?.brandDisambiguationStatus || "Optimal"}` }),
            new Paragraph({ text: `• Semantic HTML5 Main Tag: ${semanticLayoutMap?.hasMainTag ? "Valid" : "Missing"}` }),
            new Paragraph({ text: `• Heading Hierarchy Defect (Leap): ${semanticLayoutMap?.hasHeadingLeap ? "Anomaly Detected" : "Healthy Cascade"}` }),
            new Paragraph({ text: `• Multimodal Image Alt Coverage: ${semanticLayoutMap?.totalImages - semanticLayoutMap?.missingAltCount}/${semanticLayoutMap?.totalImages} Images Configured` }),

            new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 200 }, children: [new TextRun({ text: "Prioritized Tactical Optimization Playbook", color: "0f172a", bold: true, size: 24 })] }),
            ...recommendations.map((item) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 100 }, children: [new TextRun({ text: item })] })),

            new Paragraph({ spacing: { before: 800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Audit compiled organically by ${authorName}. Powered by AEO Pulse Framework.`, size: 14, color: "64748b", italics: true })] }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `AEO-Report-${agencyName.replace(/\s+/g, "-")}.docx`);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] p-4 sm:p-8 md:p-24 text-slate-900">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <header className="text-center mb-12 md:mb-16">
          <div className="inline-block px-4 py-2 mb-5 rounded-full bg-blue-50 border border-blue-100">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-600">AI Answer Engine Optimization</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight italic">
            AEO<span className="text-blue-600">Pulse</span> Pro
          </h1>
          <p className="text-slate-500 mt-5 text-base sm:text-lg max-w-2xl mx-auto">
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
                placeholder="domain.com or https://example.com/page"
                className="flex-1 px-4 sm:px-6 py-4 bg-slate-50 border border-slate-200/60 rounded-[16px] sm:rounded-[20px] outline-none font-semibold text-slate-700 focus:border-blue-500 focus:bg-white transition"
              />
              <button disabled={isPending} className="bg-slate-900 text-white px-8 sm:px-10 py-4 rounded-[16px] sm:rounded-[20px] font-black hover:bg-blue-600 transition disabled:bg-slate-300 shrink-0">
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
                    <input type="color" value={`#${brandColor.replace("#", "")}`} onChange={(e) => setBrandColor(e.target.value.replace("#", ""))} className="w-8 h-8 rounded-lg border cursor-pointer" />
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
            <div className="bg-white border border-slate-100 rounded-[24px] sm:rounded-[40px] p-6 sm:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-blue-500/5 animate-pulse" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-2">Live Audit Engine</div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Running Analysis</h2>
                </div>
                <div className="relative w-14 h-14 shrink-0"><div className="absolute inset-0 rounded-full border-4 border-slate-100" /><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" /></div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-8"><div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" /></div>
              <div className="bg-slate-50 rounded-2xl p-5 border"><div className="text-xs uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Current Operation</div><p className="text-base font-bold text-slate-700 animate-pulse">{loadingSteps[loadingIndex]}</p></div>
            </div>
          </div>
        )}

        {result?.error && <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[20px] p-6 font-bold text-center">{result.error}</div>}

        {/* RESULTS */}
        {result?.data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <button onClick={downloadDocx} className="w-full bg-slate-900 text-white hover:bg-blue-600 py-4 sm:py-5 rounded-[16px] sm:rounded-[24px] font-black tracking-wider transition shadow-lg shadow-blue-900/10">
              GENERATE WHITE-LABEL EXPORT (.DOCX)
            </button>

            <div className="bg-white rounded-[24px] md:rounded-[48px] overflow-hidden border border-slate-100 shadow-2xl">
              <div className="bg-slate-900 text-white p-6 sm:p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex items-center gap-6 sm:gap-8">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[20px] bg-white text-slate-900 flex flex-col items-center justify-center shrink-0 shadow-lg">
                    <span className="text-4xl sm:text-5xl font-black">{result.data.score}</span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Score</span>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">AEO Performance Audit</h2>
                    <p className="text-slate-400 mt-2 text-xs sm:text-sm truncate max-w-xs sm:max-w-md">{result.data.title}</p>
                  </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 w-full md:w-auto text-center">
                  <div className="text-[10px] uppercase tracking-widest text-blue-400 font-black mb-1">OPTIMIZATION STATE</div>
                  <div className="text-xl sm:text-2xl font-black italic uppercase text-white">{result.data.score >= 75 ? "Strong" : result.data.score >= 50 ? "Moderate" : "Weak"}</div>
                </div>
              </div>

              {/* TABS HEADER */}
              <div className="flex flex-wrap border-b border-slate-100 bg-slate-50/50 p-2 gap-1 sm:gap-2">
                {(
                  [
                    { id: "metrics", label: "Core Metrics" },
                    { id: "analysis", label: "AI Semantic Insights" },
                    { id: "recommendations", label: "Strategic Actions" },
                    { id: "robots", label: "Raw Directives (Robots.txt)" },
                  ] as const 
                ).map((tab) => (
                  <button 
                    key={tab.id} 
                    onClick={() => setActiveTab(tab.id)} 
                    className={`flex-1 md:flex-none px-4 sm:px-6 py-3 font-black uppercase tracking-wider rounded-xl transition ${activeTab === tab.id ? "bg-white text-blue-600 shadow-sm border" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT */}
              <div className="p-6 sm:p-8 md:p-12">
                {activeTab === "metrics" && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    
                    {/* TOP DUAL TECHNICAL ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* CRAWLER MATRIX */}
                      <div className="border border-slate-200/60 rounded-3xl p-5 bg-slate-50/50 flex flex-col justify-between">
                        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">AI Search Crawler Status</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { n: "ChatGPT", v: result.data.aiBotsStatus?.gptBot },
                            { n: "OpenAI Search", v: result.data.aiBotsStatus?.oaiSearchBot },
                            { n: "Perplexity", v: result.data.aiBotsStatus?.perplexityBot },
                            { n: "ClaudeBot", v: result.data.aiBotsStatus?.claudeBot },
                            { n: "Gemini Ext.", v: result.data.aiBotsStatus?.googleExtended },
                            { n: "Cohere AI", v: result.data.aiBotsStatus?.cohereAi },
                          ].map((b, idx) => (
                            <div key={idx} className="bg-white border p-2 rounded-xl flex items-center justify-between">
                              <span className="font-bold text-slate-600 truncate mr-1">{b.n}</span>
                              <span className={`w-2 h-2 rounded-full shrink-0 ${b.v === "Allowed" ? "bg-emerald-500" : "bg-amber-400"}`} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* BRAND DISAMBIGUATION CARD */}
                      <div className="border border-slate-200/60 rounded-3xl p-5 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">
                            AEO Tokenizer Brand Disambiguation
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
                            {result.data.entityTrustMap?.detectedBrandVariants?.length > 0 ? (
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
                        
                        <p className="text-[10px] font-medium text-slate-400 mt-3 leading-tight">
                          {result.data.entityTrustMap?.brandDisambiguationStatus === "Optimal" && "LLMs can accurately map your company name across global knowledge graphs without identity clashes."}
                          {result.data.entityTrustMap?.brandDisambiguationStatus === "Inconsistent" && "Warning: Multiple structural variations confuse AI text tokenizers. Standardize names in your Schema and Copyright text."}
                          {result.data.entityTrustMap?.brandDisambiguationStatus === "Critical Missing" && "Critical: AI crawlers cannot extract a singular brand entity name anchor. Citing chance is highly restricted."}
                        </p>
                      </div>

                    </div>

                    {/* DUAL CARD SPLIT: ENTITY GRAPH VS NEW SEMANTIC HTML AUDIT */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* ENTITY GRAPH CHECKLIST */}
                      <div className="border border-slate-200/60 rounded-3xl p-5 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Knowledge Graph & Entity Blueprint</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between bg-white border p-2 rounded-xl text-xs font-semibold">
                              <span className="text-slate-600 truncate pr-2">Authority Reference Outlinks (Wikipedia/Data)</span>
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
                              <div key={index} className="flex items-center justify-between bg-white border p-2 rounded-xl text-xs font-semibold">
                                <span className="text-slate-600 truncate pr-2">{item.label}</span>
                                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${item.checked ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                                  {item.checked ? "VERIFIED" : "MISSING"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* NOVI KLIJENTSKI ZASLON: SEMANTIC HTML & MULTIMODAL COMPLIANCE CARD */}
                      <div className="border border-slate-200/60 rounded-3xl p-5 bg-slate-50/50 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">AI Semantic & Multimodal Blueprint</div>
                          <div className="space-y-2">
                            
                            <div className="flex items-center justify-between bg-white border p-2 rounded-xl text-xs font-semibold">
                              <span className="text-slate-600">HTML5 Semantic &lt;main&gt; Isolation</span>
                              <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${result.data.semanticLayoutMap?.hasMainTag ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                                {result.data.semanticLayoutMap?.hasMainTag ? "VALID" : "GENERIC DIVS"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between bg-white border p-2 rounded-xl text-xs font-semibold">
                              <span className="text-slate-600">HTML5 Article Core Container</span>
                              <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${result.data.semanticLayoutMap?.hasArticleTag ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                                {result.data.semanticLayoutMap?.hasArticleTag ? "DETECTED" : "ABSENT"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between bg-white border p-2 rounded-xl text-xs font-semibold">
                              <span className="text-slate-600">Heading Hierarchy Structural Cascade</span>
                              <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${!result.data.semanticLayoutMap?.hasHeadingLeap ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                                {!result.data.semanticLayoutMap?.hasHeadingLeap ? "HEALTHY" : "LEAP ANOMALY"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between bg-white border p-2 rounded-xl text-xs font-semibold">
                              <span className="text-slate-600">Multimodal Image Alt Coverage</span>
                              <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${result.data.semanticLayoutMap?.missingAltCount === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                                {result.data.semanticLayoutMap?.totalImages - result.data.semanticLayoutMap?.missingAltCount}/{result.data.semanticLayoutMap?.totalImages} ALT TAGS
                              </span>
                            </div>

                          </div>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-2 leading-tight">
                          Multimodal models (GPT-4o/Gemini) use structural HTML tags and image descriptions to extract data context directly for rich chat snippets.
                        </p>
                      </div>

                    </div>

                    {/* CORE SPEED METRICS ROW */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricCard label="Word Count" value={String(result.data.wordCount)} />
                      <MetricCard label="Conversational Q&A Loops" value={`${result.data.qaBlocksCount} Blocks`} />
                      <div className="p-4 rounded-2xl bg-slate-50 border text-xs font-bold flex flex-col justify-between">
                        <span className="text-[10px] uppercase text-slate-400 tracking-wider">Semantic Layout Density</span>
                        <span className={result.data.hasTablesOrLists ? "text-emerald-700" : "text-amber-700"}>{result.data.hasTablesOrLists ? "Tables / Lists Active" : "Low Density Blocks"}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border text-xs font-bold flex flex-col justify-between">
                        <span className="text-[10px] uppercase text-slate-400 tracking-wider">Robots.txt Architecture</span>
                        <span className="truncate text-slate-700">{result.data.robotsStatus}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <MetricCard label="Meta Title" value={result.data.title} />
                      <MetricCard label="H1 Header" value={result.data.h1} />
                      <MetricCard label="Meta Description" value={result.data.metaDescription} />
                      <div className="p-6 rounded-3xl bg-slate-50 border">
                        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Detected Schema Entities</div>
                        <div className="flex flex-wrap gap-1.5">{result.data.detectedSchemas.length > 0 ? result.data.detectedSchemas.map((s, i) => <span key={i} className="bg-white border text-slate-700 text-xs px-2.5 py-1 rounded-lg font-bold shadow-sm">{s}</span>) : <span className="text-slate-400 text-xs italic">No items parsed.</span>}</div>
                      </div>
                    </div>

                  </div>
                )}

                {activeTab === "analysis" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-2"><div className="w-2 h-6 bg-blue-600 rounded-full" /><h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Executive LLM Diagnostics</h3></div>
                    <div className="bg-slate-50 rounded-[16px] p-5 border text-sm leading-relaxed text-slate-700 whitespace-pre-line font-medium">{result.data.aiAnalysis}</div>
                  </div>
                )}

                {activeTab === "recommendations" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-2"><div className="w-2 h-6 bg-blue-600 rounded-full" /><h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Prioritized Optimization Playbook</h3></div>
                    <div className="space-y-4">
                      {result.data.recommendations.map((item, idx) => (
                        <div key={idx} className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 font-bold text-slate-800 text-sm flex items-start gap-4">
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
                    <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 font-mono text-xs shadow-inner overflow-x-auto whitespace-pre leading-relaxed">{result.data.robotsRawContent || "No crawling instructions discovered during standard sweeps."}</div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-50 border flex flex-col justify-between">
      <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">{label}</div>
      <div className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed break-words">{value}</div>
    </div>
  );
}