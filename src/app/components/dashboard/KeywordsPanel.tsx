import { AuditData } from "../../lib/types";

interface KeywordsPanelProps {
  data: AuditData;
}

export default function KeywordsPanel({ data }: KeywordsPanelProps) {
  // Fallback podaci ako backend još uvijek nije napunio objekat
  const kw = data.keywordsData || {
    primaryTopic: "Not Detected",
    aeoKeywordScore: 0,
    extractedKeywords: [],
    missingSemanticEntities: [],
    recommendedAeoQuestions: [],
    optimizationTips: [],
  };

  const getRelevanceBadge = (rel: "High" | "Medium" | "Low") => {
    switch (rel) {
      case "High":
        return "text-emerald-600 bg-emerald-50 border-emerald-200/60";
      case "Medium":
        return "text-amber-600 bg-amber-50 border-amber-200/60";
      default:
        return "text-slate-500 bg-slate-100 border-slate-200/60";
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* SECTION 1: TOPIC & AEO KEYWORD SCORE */}
      <div>
        <div className="flex items-center gap-3 mb-4 sm:mb-5">
          <div className="w-2 h-6 bg-blue-600 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            AEO Keyword & Entity Coverage
          </h3>
        </div>

        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/60 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Primary Detected Topic */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 md:col-span-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Primary Detected Entity / Topic
                </span>
                <h4 className="text-lg font-black text-slate-800 capitalize">
                  {kw.primaryTopic}
                </h4>
              </div>
              <p className="text-[10px] font-medium text-slate-400 leading-snug mt-2">
                Main relational entity extracted by LLM crawlers from your H1, Title, and core body DOM nodes.
              </p>
            </div>

            {/* AEO Keyword Score */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                  AEO Keyword Score
                </span>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-md ${
                    kw.aeoKeywordScore >= 70
                      ? "text-emerald-600 bg-emerald-50"
                      : "text-amber-600 bg-amber-50"
                  }`}
                >
                  {kw.aeoKeywordScore}/100
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    kw.aeoKeywordScore >= 70 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${kw.aeoKeywordScore}%` }}
                />
              </div>
              <p className="text-[10px] font-medium text-slate-400 leading-snug">
                Evaluates how well keywords are contextualized into direct answer units.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* SECTION 2: EXTRACTED KEYWORDS TABLE & MISSING ENTITIES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Found Keywords */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">
              Extracted Keywords
            </h4>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {kw.extractedKeywords.length} Detected
            </span>
          </div>

          <div className="bg-slate-50 p-2 sm:p-3 rounded-2xl border border-slate-200/60 space-y-2">
            {kw.extractedKeywords.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {item.keyword}
                  </p>
                  <p className="text-[9px] font-medium text-slate-400">
                    {item.foundInH1OrTitle ? "✓ In H1/Title Tag" : "• In Body Content"}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getRelevanceBadge(
                    item.aeoRelevance
                  )}`}
                >
                  {item.aeoRelevance}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Semantic Entities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">
              Missing Semantic Entities
            </h4>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Action Required
            </span>
          </div>

          <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200/60 space-y-2">
            <p className="text-[10px] font-medium text-slate-400 mb-2 leading-relaxed">
              LLMs expect these terms to establish entity authority for your primary topic.
            </p>
            {kw.missingSemanticEntities.map((entity, idx) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700">{entity}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECTION 3: RECOMMENDED AEO QUESTIONS (TARGET INTENTS) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-black uppercase tracking-[0.15em] text-slate-700">
            Target AI Intent Questions
          </h4>
          <span className="bg-blue-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
            High Citation Potential
          </span>
        </div>

        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/60 grid grid-cols-1 md:grid-cols-3 gap-3">
          {kw.recommendedAeoQuestions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between space-y-2"
            >
              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                Question #{idx + 1}
              </span>
              <p className="text-xs font-bold text-slate-800 leading-snug">
                &quot;{q}&quot;
              </p>
              <p className="text-[9px] font-medium text-slate-400 pt-1 border-t border-slate-50">
                Add an explicit H2/H3 module answering this directly.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: OPTIMIZATION TIPS */}
      {kw.optimizationTips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-blue-600 rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              AEO Keyword Action Plan
            </h3>
          </div>
          <div className="bg-slate-50 rounded-[16px] p-4 sm:p-5 border border-slate-200/60 space-y-2">
            {kw.optimizationTips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                <span className="text-blue-600 font-black">→</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}