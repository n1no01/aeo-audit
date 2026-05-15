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

export default function Home() {
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    data?: AuditData;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"metrics" | "analysis" | "recommendations">("metrics");

  // WHITE-LABEL BRANDING STATE
  const [showBranding, setShowBranding] = useState(false);
  const [agencyName, setAgencyName] = useState("AEO Pulse Pro");
  const [brandColor, setBrandColor] = useState("2563eb"); 
  const [authorName, setAuthorName] = useState("Senior AEO Strategist");

  // ROTATING LOADING STATES
  useEffect(() => {
    if (!isPending) return;

    const interval = setInterval(() => {
      setLoadingIndex((prev) => {
        return (prev + 1) % loadingSteps.length;
      });
    }, 1700);

    return () => clearInterval(interval);
  }, [isPending]);

  // HANDLER FOR FORM SUBMISSION
  const handleAuditSubmit = (formData: FormData) => {
    setResult(null);
    setLoadingIndex(0);
    setActiveTab("metrics"); 
    
    startTransition(async () => {
      const res = await analyzeUrl(formData);
      setResult(res); 
    });
  };

  // BRANDED WHITE-LABEL DOCX EXPORT ENGINE
  const downloadDocx = async () => {
    if (!result?.data) return;

    const {
      score,
      aiAnalysis,
      recommendations,
      title,
      metaDescription,
      h1,
      detectedSchemas,
      wordCount,
      h2Count,
      robotsStatus,
      qaBlocksCount,
      hasTablesOrLists,
    } = result.data;

    const cleanHexColor = brandColor.replace("#", "").trim();

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1000, 
                right: 1000,
                bottom: 1000,
                left: 1000,
              },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: `${agencyName} | SEO AGENCY`,
                      size: 16,
                      color: "94a3b8",
                      italics: true,
                    }),
                  ],
                }),
              ],
            }),
          },

          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 100 },
              children: [
                new TextRun({
                  text: agencyName.toUpperCase(),
                  bold: true,
                  size: 18,
                  color: cleanHexColor,
                }),
              ],
            }),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [
                new TextRun({
                  text: "ANSWER ENGINE OPTIMIZATION AUDIT",
                  bold: true,
                  size: 32,
                  color: "0f172a",
                }),
              ],
            }),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
              children: [
                new TextRun({
                  text: `Overall Visibility Score: ${score}/100`,
                  bold: true,
                  size: 26,
                  color: cleanHexColor,
                }),
              ],
            }),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 200 },
              children: [
                new TextRun({ text: "Executive Summary & Meta Configuration", color: "0f172a", bold: true, size: 24 })
              ]
            }),

            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({ text: "Target Page Title: ", bold: true, color: "334155" }),
                new TextRun({ text: title }),
              ],
            }),

            new Paragraph({
              spacing: { after: 120 },
              children: [
                new TextRun({ text: "Meta Description String: ", bold: true, color: "334155" }),
                new TextRun({ text: metaDescription }),
              ],
            }),

            new Paragraph({
              spacing: { after: 400 },
              children: [
                new TextRun({ text: "Primary H1 Semantic Anchor: ", bold: true, color: "334155" }),
                new TextRun({ text: h1 }),
              ],
            }),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 200 },
              children: [
                new TextRun({ text: "Semantic Engine Technical Metrics", color: "0f172a", bold: true, size: 24 })
              ]
            }),

            new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `• Parsed Content Size: `, bold: true }), new TextRun(`${wordCount} words`)] }),
            new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `• Core Subheading Structures (H2): `, bold: true }), new TextRun(`${h2Count} elements`)] }),
            new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `• Conversational Intent Q&A Blocks: `, bold: true }), new TextRun(`${qaBlocksCount} blocks indexed`)] }),
            new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `• Tabular/List Structural Data Density: `, bold: true }), new TextRun(hasTablesOrLists ? "Optimal Layout Map Detected" : "Low Density Text Layout")] }),
            new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `• AI Discovery Agent Clearance (Robots.txt): `, bold: true }), new TextRun(robotsStatus)] }),
            new Paragraph({ spacing: { after: 400 }, children: [new TextRun({ text: `• Structured Knowledge Entities Mapped: `, bold: true }), new TextRun(detectedSchemas.join(", ") || "None")] }),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 200 },
              children: [
                new TextRun({ text: "AI Strategic Evaluation Insights", color: "0f172a", bold: true, size: 24 })
              ]
            }),

            new Paragraph({
              spacing: { after: 400 },
              children: [
                new TextRun({ text: aiAnalysis, font: "Arial" })
              ]
            }),

            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 300, after: 200 },
              children: [
                new TextRun({ text: "Prioritized Tactical Optimization Playbook", color: "0f172a", bold: true, size: 24 })
              ]
            }),

            ...recommendations.map(
              (item) =>
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { after: 100 },
                  children: [
                    new TextRun({ text: item }),
                  ],
                })
            ),

            new Paragraph({
              spacing: { before: 800 },
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${authorName}. Powered by AEO Pulse Framework.`,
                  size: 14,
                  color: "64748b",
                  italics: true,
                }),
              ],
            }),
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
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-600">
              AI Answer Engine Optimization
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight italic">
            AEO<span className="text-blue-600">Pulse</span> Pro
          </h1>

          <p className="text-slate-500 mt-5 text-base sm:text-lg max-w-2xl mx-auto">
            Enterprise-grade Answer Engine Optimization auditing platform powered by AI semantic analysis.
          </p>
        </header>

        {/* INPUT AND OPTIMIZATION FORM */}
        <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 shadow-xl shadow-blue-900/5 mb-12">
          <form action={handleAuditSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                name="url"
                type="url"
                required
                placeholder="https://example.com"
                className="flex-1 px-4 sm:px-6 py-4 bg-slate-50 border border-slate-200/60 rounded-[16px] sm:rounded-[20px] outline-none font-semibold text-slate-700 focus:border-blue-500 focus:bg-white transition"
              />

              <button
                disabled={isPending}
                className="bg-slate-900 text-white px-8 sm:px-10 py-4 rounded-[16px] sm:rounded-[20px] font-black hover:bg-blue-600 transition-all duration-300 disabled:bg-slate-300 shrink-0"
              >
                {isPending ? "GENERATING AUDIT..." : "ANALYZE AI VISIBILITY"}
              </button>
            </div>

            {/* WHITE-LABEL ACCORDION TRIGGER */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBranding(!showBranding)}
                className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition"
              >
                <span className={`transform transition duration-200 ${showBranding ? "rotate-90" : ""}`}>▶</span>
                {showBranding ? "Hide Agency Branding Options" : "Show Agency Branding Options"}
              </button>
            </div>

            {/* EXPANDABLE BRAND CONTROL SECTIONS */}
            {showBranding && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-50 animate-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Agency/Company Name</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Brand Hex Color Accent</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={`#${brandColor.replace("#", "")}`}
                      onChange={(e) => setBrandColor(e.target.value.replace("#", ""))}
                      className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0 overflow-hidden shrink-0"
                    />
                    <input
                      type="text"
                      maxLength={7}
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value.replace("#", ""))}
                      className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 flex-1"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Report Compiler Name</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* LOADING UI */}
        {isPending && (
          <div className="transition-all duration-500 mb-10 opacity-100 block">
            <div className="bg-white border border-slate-100 rounded-[24px] sm:rounded-[40px] p-6 sm:p-10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-blue-500/5 animate-pulse"></div>
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-2">Live Audit Engine</div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Running Analysis</h2>
                  </div>
                  <div className="relative self-start sm:self-auto">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-slate-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                  </div>
                </div>
                <div className="mb-8">
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100">
                  <div className="text-xs uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Current Operation</div>
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
                    <p key={loadingIndex} className="text-base sm:text-lg font-bold text-slate-700 animate-[pulse_1.5s_infinite]">
                      {loadingSteps[loadingIndex]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR SCREEN */}
        {result?.error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[20px] p-6 font-bold text-center">
            {result.error}
          </div>
        )}

        {/* DATA PRESENTATION GRAPHICS */}
        {result?.data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <button
              onClick={downloadDocx}
              className="w-full bg-slate-900 text-white hover:bg-blue-600 py-4 sm:py-5 rounded-[16px] sm:rounded-[24px] font-black tracking-wider transition-all duration-300 shadow-lg shadow-blue-900/10"
            >
              GENERATE WHITE-LABEL EXPORT (.DOCX)
            </button>

            <div className="bg-white rounded-[24px] md:rounded-[48px] overflow-hidden border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
              {/* TOP BRANDED RESULTS HEADER */}
              <div className="bg-slate-900 text-white p-6 sm:p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex items-center gap-6 sm:gap-8">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[20px] bg-white text-slate-900 flex flex-col items-center justify-center shrink-0 shadow-lg">
                    <span className="text-4xl sm:text-5xl font-black">{result.data.score}</span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">Score</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">AEO Performance Audit</h2>
                    <p className="text-slate-400 mt-2 text-xs sm:text-sm truncate max-w-xs sm:max-w-md">{result.data.title}</p>
                  </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 w-full md:w-auto text-center md:text-left">
                  <div className="text-[10px] uppercase tracking-widest text-blue-400 font-black mb-1">OPTIMIZATION STATE</div>
                  <div className="text-xl sm:text-2xl font-black italic uppercase text-white">
                    {result.data.score >= 75 ? "Strong" : result.data.score >= 50 ? "Moderate" : "Weak"}
                  </div>
                </div>
              </div>

              {/* TAB NAVIGATION PANEL */}
              <div className="flex flex-wrap border-b border-slate-100 bg-slate-50/50 p-2 gap-1 sm:gap-2">
                {[
                  { id: "metrics", label: "Core Metrics" },
                  { id: "analysis", label: "AI Semantic Insights" },
                  { id: "recommendations", label: "Strategic Actions" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as "metrics" | "analysis" | "recommendations")}
                    className={`flex-1 md:flex-none px-4 sm:px-6 py-3 font-black uppercase tracking-wider rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* ACTIVE RUNTIME TAB RENDERINGS */}
              <div className="p-6 sm:p-8 md:p-12">
                {activeTab === "metrics" && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <MetricCard label="Meta Title" value={result.data.title} />
                      <MetricCard label="H1 Header" value={result.data.h1} />
                      <MetricCard label="Meta Description" value={result.data.metaDescription} />
                      <MetricCard label="Word Count" value={String(result.data.wordCount)} />
                      
                      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Conversational Q&A Loops</div>
                          <div className="font-bold text-slate-800 text-xl leading-none flex items-baseline gap-2">
                            <span>{result.data.qaBlocksCount}</span>
                            <span className="text-xs text-slate-400 font-medium">Blocks Detected</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Semantic Layout Structure</div>
                          <div className="font-bold text-base sm:text-lg leading-none flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${result.data.hasTablesOrLists ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`}></span>
                            <span className={result.data.hasTablesOrLists ? "text-emerald-700" : "text-amber-700"}>
                              {result.data.hasTablesOrLists ? "Data Tables / Lists Present" : "Missing Dense Layouts"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`p-6 rounded-3xl border ${result.data.robotsStatus === "Valid" ? "bg-emerald-50/40 border-emerald-100 text-emerald-900" : result.data.robotsStatus === "Blocking AI" ? "bg-amber-50/40 border-amber-100 text-amber-900" : "bg-rose-50/40 border-rose-100 text-rose-900"}`}>
                        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Robots.txt Gateway</div>
                        <div className="font-bold text-base sm:text-lg leading-relaxed flex items-center gap-2.5">
                          <span className={`w-3 h-3 rounded-full shrink-0 ${result.data.robotsStatus === "Valid" ? "bg-emerald-500 animate-pulse" : result.data.robotsStatus === "Blocking AI" ? "bg-amber-500" : "bg-rose-500"}`}></span>
                          <span className="truncate">
                            {result.data.robotsStatus === "Valid" && "Valid & AI Agent Friendly"}
                            {result.data.robotsStatus === "Blocking AI" && "Restricts AI Crawlers"}
                            {result.data.robotsStatus === "Missing" && "Open Policy (No robots.txt)"}
                            {result.data.robotsStatus === "Error" && "Unreachable Gateway"}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Detected Schema Entities</div>
                        <div className="flex flex-wrap gap-2">
                          {result.data.detectedSchemas.length > 0 ? (
                            result.data.detectedSchemas.map((schema, idx) => (
                              <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl font-bold shadow-sm">{schema}</span>
                            ))
                          ) : (
                            <span className="text-slate-400 font-bold text-sm">No structured entity configurations mapped.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "analysis" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Executive LLM Diagnostics</h3>
                    </div>
                    <div className="bg-slate-50 rounded-[16px] p-5 border border-slate-100 text-sm leading-relaxed text-slate-700 whitespace-pre-line font-medium">
                      {result.data.aiAnalysis}
                    </div>
                  </div>
                )}

                {activeTab === "recommendations" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Prioritized Optimization Playbook</h3>
                    </div>
                    <div className="space-y-4">
                      {result.data.recommendations.map((item, index) => (
                        <div key={index} className="bg-blue-50/60 border border-blue-100/70 rounded-2xl p-4 font-bold text-slate-800 text-sm flex items-start gap-4 shadow-sm">
                          <span className="bg-blue-600 text-white rounded-xl w-7 h-7 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{index + 1}</span>
                          <div className="leading-relaxed">{item}</div>
                        </div>
                      ))}
                    </div>
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
    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
      <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">{label}</div>
      <div className="font-bold text-slate-800 text-sm leading-relaxed break-words">{value}</div>
    </div>
  );
}