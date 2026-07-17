import { AuditData } from "../../lib/types";

interface InsightsPanelProps {
  data: AuditData;
}

export default function InsightsPanel({ data }: InsightsPanelProps) {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-3 mb-4 sm:mb-5">
          <div className="w-2 h-6 bg-blue-600 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">LLM Reading Competency (AEO Content Pillars)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/60">
          {[
            { label: "BLUFF Alignment", val: data.bluffScore || 5, desc: "Delivers critical answers upfront on headings instead of burying them deep into backstory paragraphs." },
            { label: "LLM Chunking Readiness", val: data.atomicStructureScore || 5, desc: "Checks if your H2/H3 text modules are self-contained and make complete sense when extracted independently." },
            { label: "Semantic Entity Density", val: data.entityDensityScore || 5, desc: "Evaluates the injection rate of concrete terms, brand tokens, and clear relational entities against generic wording." },
            { label: "Syntactic Simplicity", val: data.sentenceSimplicityScore || 5, desc: "Measures sentence structural speed. Favors declarative Subject-Verb-Object models carrying exactly one idea." },
          ].map((pillar, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{pillar.label}</span>
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{pillar.val}/10</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${pillar.val * 10}%` }} />
              </div>
              <p className="text-[10px] font-medium text-slate-400 leading-snug">{pillar.desc}</p>
            </div>
          ))}

          <div className="bg-white p-4 rounded-xl border border-slate-100 md:col-span-2">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                | Google Non-Commodity Score
                <span className="bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Official 2026 Guideline</span>
              </span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${(data.commodityContentScore || 5) >= 7 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"}`}>
                {data.commodityContentScore || 5}/10
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
              <div className={`h-full rounded-full transition-all duration-500 ${(data.commodityContentScore || 5) >= 7 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${(data.commodityContentScore || 5) * 10}%` }} />
            </div>
            <p className="text-[10px] font-medium text-slate-400 leading-snug">
              Defines content authenticity according to Google Search requirements. Low scores indicate heavily recycled, generic text easily scraped by basic automation.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-6 bg-blue-600 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Executive LLM Diagnostics</h3>
        </div>
        <div className="bg-slate-50 rounded-[16px] p-4 sm:p-5 border text-sm leading-relaxed text-slate-700 whitespace-pre-line font-medium shadow-inner">{data.aiAnalysis}</div>
      </div>
    </div>
  );
}