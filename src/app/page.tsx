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
  
  // Upravljanje aktivnim tabom za rezultate
  const [activeTab, setActiveTab] = useState<"metrics" | "analysis" | "recommendations">("metrics");

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
    setActiveTab("metrics"); // Vrati na početni tab pri novom skeniranju
    
    startTransition(async () => {
      const res = await analyzeUrl(formData);
      setResult(res);
    });
  };

  // DOCX EXPORT
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
    } = result.data;

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720,
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },

          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
              children: [
                new TextRun({
                  text: "AEO PULSE EXECUTIVE AUDIT",
                  bold: true,
                  size: 34,
                  color: "2563eb",
                }),
              ],
            }),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 500 },
              children: [
                new TextRun({
                  text: `Overall Score: ${score}/100`,
                  bold: true,
                  size: 28,
                }),
              ],
            }),

            // WEBSITE METADATA
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              text: "Website Metadata",
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Title: ", bold: true }),
                new TextRun(title),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Meta Description: ", bold: true }),
                new TextRun(metaDescription),
              ],
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "H1: ", bold: true }),
                new TextRun(h1),
              ],
            }),

            // TECHNICAL METRICS
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              text: "Technical Metrics",
            }),

            new Paragraph({
              text: `Word Count: ${wordCount}`,
            }),

            new Paragraph({
              text: `H2 Count: ${h2Count}`,
            }),

            new Paragraph({
              text: `Robots.txt Status: ${robotsStatus}`,
            }),

            new Paragraph({
              text: `Detected Schema: ${detectedSchemas.join(", ") || "None"}`,
            }),

            // AI ANALYSIS
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              text: "Executive Analysis",
            }),

            new Paragraph({
              text: aiAnalysis,
            }),

            // RECOMMENDATIONS
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              text: "Strategic Recommendations",
            }),

            ...recommendations.map(
              (item) =>
                new Paragraph({
                  bullet: { level: 0 },
                  children: [
                    new TextRun({ text: item }),
                  ],
                })
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `AEO-Audit-${score}.docx`);
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

        {/* FORM */}
        <form
          action={handleAuditSubmit}
          className="relative group mb-12"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[24px] sm:rounded-[32px] blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>

          <div className="relative flex flex-col md:flex-row gap-3 p-3 bg-white border border-slate-200 rounded-[20px] sm:rounded-[30px] shadow-2xl shadow-blue-900/5">
            <input
              name="url"
              type="url"
              required
              placeholder="https://example.com"
              className="flex-1 px-4 sm:px-6 py-4 sm:py-5 bg-transparent outline-none font-semibold text-slate-700 placeholder:text-slate-300"
            />

            <button
              disabled={isPending}
              className="bg-slate-900 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-[16px] sm:rounded-[24px] font-black hover:bg-blue-600 transition-all duration-300 disabled:bg-slate-300 shrink-0"
            >
              {isPending ? "GENERATING AUDIT..." : "ANALYZE AI VISIBILITY"}
            </button>
          </div>
        </form>

        {/* LOADING UI */}
        {isPending && (
          <div className="transition-all duration-500 mb-10 opacity-100 block">
            <div className="bg-white border border-slate-100 rounded-[24px] sm:rounded-[40px] p-6 sm:p-10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] overflow-hidden relative">
              
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-blue-500/5 animate-pulse"></div>

              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-2">
                      Live Audit Engine
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                      Running Analysis
                    </h2>
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
                  <div className="text-xs uppercase tracking-[0.2em] font-black text-slate-400 mb-3">
                    Current Operation
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping"></div>
                    <p 
                      key={loadingIndex} 
                      className="text-base sm:text-lg font-bold text-slate-700 animate-[pulse_1.5s_infinite]"
                    >
                      {loadingSteps[loadingIndex]}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="text-xs text-slate-400 font-black uppercase mb-2">
                      Status
                    </div>
                    <div className="font-bold text-slate-700">Active</div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="text-xs text-slate-400 font-black uppercase mb-2">
                      AI Engine
                    </div>
                    <div className="font-bold text-slate-700">Gemini 2.5</div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="text-xs text-slate-400 font-black uppercase mb-2">
                      Crawl Mode
                    </div>
                    <div className="font-bold text-slate-700">Semantic</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR */}
        {result?.error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[20px] sm:rounded-[30px] p-6 sm:p-8 font-bold text-center">
            {result.error}
          </div>
        )}

        {/* RESULTS */}
        {result?.data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <button
              onClick={downloadDocx}
              className="w-full bg-white border-2 border-slate-900 py-4 sm:py-5 rounded-[16px] sm:rounded-[24px] font-black hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm"
            >
              DOWNLOAD REPORT (.DOCX)
            </button>

            <div className="bg-white rounded-[24px] md:rounded-[48px] overflow-hidden border border-slate-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)]">
              {/* TOP HEADER */}
              <div className="bg-slate-900 text-white p-6 sm:p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex items-center gap-6 sm:gap-8">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[20px] sm:rounded-[30px] bg-white text-slate-900 flex flex-col items-center justify-center shrink-0 shadow-lg">
                    <span className="text-4xl sm:text-5xl font-black">
                      {result.data.score}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-1">
                      Score
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                      AEO Performance Audit
                    </h2>
                    <p className="text-slate-400 mt-2 text-xs sm:text-sm truncate max-w-xs sm:max-w-md">
                      {result.data.title}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-6 py-4 w-full md:w-auto text-center md:text-left">
                  <div className="text-[10px] uppercase tracking-widest text-blue-400 font-black mb-1">
                    OPTIMIZATION STATE
                  </div>
                  <div className="text-xl sm:text-2xl font-black italic uppercase text-white">
                    {result.data.score >= 75
                      ? "Strong"
                      : result.data.score >= 50
                      ? "Moderate"
                      : "Weak"}
                  </div>
                </div>
              </div>

              {/* TAB NAVIGATION */}
              <div className="flex flex-wrap border-b border-slate-100 bg-slate-50/50 p-2 gap-1 sm:gap-2">
                {[
                  { id: "metrics", label: "Core Metrics" },
                  { id: "analysis", label: "AI Semantic Insights" },
                  { id: "recommendations", label: "Strategic Actions" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as "metrics" | "analysis" | "recommendations")}
                    className={`flex-1 md:flex-none px-4 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wider rounded-xl sm:rounded-2xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT CONTAINER */}
              <div className="p-6 sm:p-8 md:p-12">
                
                {/* TAB 1: CORE METRICS */}
                {activeTab === "metrics" && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <MetricCard label="Meta Title" value={result.data.title} />
                      <MetricCard label="H1 Header" value={result.data.h1} />
                      <MetricCard label="Meta Description" value={result.data.metaDescription} />
                      <MetricCard label="Word Count" value={String(result.data.wordCount)} />

                      {/* ROBOTS.TXT CARD */}
                      <div
                        className={`p-6 rounded-3xl border ${
                          result.data.robotsStatus === "Valid"
                            ? "bg-emerald-50/40 border-emerald-100 text-emerald-900"
                            : result.data.robotsStatus === "Blocking AI"
                            ? "bg-amber-50/40 border-amber-100 text-amber-900"
                            : "bg-rose-50/40 border-rose-100 text-rose-900"
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">
                          Robots.txt Gateway
                        </div>
                        <div className="font-bold text-base sm:text-lg leading-relaxed flex items-center gap-2.5">
                          <span
                            className={`w-3 h-3 rounded-full shrink-0 ${
                              result.data.robotsStatus === "Valid"
                                ? "bg-emerald-500 animate-pulse"
                                : result.data.robotsStatus === "Blocking AI"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          ></span>
                          <span className="truncate">
                            {result.data.robotsStatus === "Valid" && "Valid & AI Crawler Friendly"}
                            {result.data.robotsStatus === "Blocking AI" && "Restricts AI Crawlers"}
                            {result.data.robotsStatus === "Missing" && "Missing (404 Not Found)"}
                            {result.data.robotsStatus === "Error" && "Unreachable Gateway"}
                          </span>
                        </div>
                      </div>

                      {/* STRUCTURED DATA CARD */}
                      <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">
                          Detected Schema Engines
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.data.detectedSchemas.length > 0 ? (
                            result.data.detectedSchemas.map((schema, idx) => (
                              <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-xl font-bold shadow-sm">
                                {schema}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 font-bold text-sm">No structured data engines mapped.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: AI SEMANTIC ANALYSIS */}
                {activeTab === "analysis" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        Executive LLM Diagnostics
                      </h3>
                    </div>
                    <div className="bg-slate-50 rounded-[16px] md:rounded-[32px] p-5 sm:p-6 md:p-10 border border-slate-100 text-sm sm:text-base md:text-lg leading-relaxed text-slate-700 whitespace-pre-line font-medium">
                      {result.data.aiAnalysis}
                    </div>
                  </div>
                )}

                {/* TAB 3: STRATEGIC RECOMMENDATIONS */}
                {activeTab === "recommendations" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        Prioritized Optimization Playbook
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {result.data.recommendations.map((item, index) => (
                        <div
                          key={index}
                          className="bg-blue-50/60 border border-blue-100/70 rounded-2xl p-4 sm:p-5 font-bold text-slate-800 text-sm sm:text-base flex items-start gap-4 shadow-sm"
                        >
                          <span className="bg-blue-600 text-white rounded-xl w-7 h-7 flex items-center justify-center text-xs font-black shrink-0 shadow-sm mt-0.5">
                            {index + 1}
                          </span>
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
      <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">
        {label}
      </div>
      <div className="font-bold text-slate-800 text-sm sm:text-base leading-relaxed break-words">{value}</div>
    </div>
  );
}