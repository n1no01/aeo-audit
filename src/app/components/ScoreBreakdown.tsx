const ScoreBreakdown: React.FC<{
  breakdown: {
    metaAndCore: { scored: number; max: number };
    aiBlueprint: { scored: number; max: number };
    botAccess: { scored: number; max: number };
    structuredData: { scored: number; max: number };
    entityTrust: { scored: number; max: number };
    semanticCode: { scored: number; max: number };
  };
  totalScore: number;
}> = ({ breakdown, totalScore }) => {
  const categories = [
    {
      title: "Meta & Core Tags",
      scored: breakdown.metaAndCore.scored,
      max: breakdown.metaAndCore.max,
      description: "Validates optimal character lengths for Meta Title, Description, and presence of an isolated H1 tag.",
    },
    {
      title: "AI Content Blueprint",
      scored: breakdown.aiBlueprint.scored,
      max: breakdown.aiBlueprint.max,
      description: "Measures content commodity risks, conversational Q&A loops, and ARIA tree readiness for autonomous agents.",
    },
    {
      title: "Bot Access & Rendering",
      scored: breakdown.botAccess.scored,
      max: breakdown.botAccess.max,
      description: "Evaluates robots.txt bypass directives, Cloudflare firewall severity, and client-side JS timeouts.",
    },
    {
      title: "Structured Data (Schema)",
      scored: breakdown.structuredData.scored,
      max: breakdown.structuredData.max,
      description: "Checks for the presence of high-value contextual schemas matched dynamically to your current page type.",
    },
    {
      title: "Entity & Brand Trust",
      scored: breakdown.entityTrust.scored,
      max: breakdown.entityTrust.max,
      description: "Validates brand tokenization consistency, cross-platform identity links, and authority outlinks.",
    },
    {
      title: "Semantic Code & Visual RAG",
      scored: breakdown.semanticCode.scored,
      max: breakdown.semanticCode.max,
      description: "Analyzes semantic HTML5 layouts (<main>, <article>), heading cascade jumps, video elements, and image alt text coverage.",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6 mb-6 shadow-sm">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            AEO Score Analysis
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Granular vectors mapping your platform&apos;s visibility across modern generative engine optimization frameworks.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100/50 self-start sm:self-auto">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-wider">Overall AI Ready:</span>
          <span className="text-xl font-black text-blue-600">{totalScore}<span className="text-xs text-blue-400 font-normal">/100</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat, idx) => {
          const percentage = Math.max(0, Math.min((cat.scored / cat.max) * 100, 100));
          return (
            <div key={idx} className="flex flex-col justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/30">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-wide">
                    {cat.title}
                  </h4>
                  <span className={`text-[11px] font-black ${cat.scored < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                    {cat.scored} / {cat.max} pts
                  </span>
                </div>
                <p className="text-[10px] leading-normal text-slate-400 mb-3">
                  {cat.description}
                </p>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoreBreakdown;