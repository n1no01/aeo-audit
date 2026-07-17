import { AuditData, Recommendation } from "../../lib/types";

interface RecommendationsPanelProps {
  data: AuditData;
}

export default function RecommendationsPanel({ data }: RecommendationsPanelProps) {
  const criticalCount = data.recommendations.filter(r => r.severity === "CRITICAL").length + (data.javascriptDependency === "Critical" ? 1 : 0);
  const mediumCount = data.recommendations.filter(r => r.severity === "MEDIUM").length;
  const lowCount = data.recommendations.filter(r => r.severity === "LOW").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-blue-600 rounded-full" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Prioritized Optimization Playbook</h3>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4 text-center">
          <span className="block text-2xl font-black text-red-600">{criticalCount}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Critical Fixes</span>
        </div>
        <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 text-center">
          <span className="block text-2xl font-black text-amber-600">{mediumCount}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Medium Priority</span>
        </div>
        <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-center">
          <span className="block text-2xl font-black text-blue-600">{lowCount}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Low Priority</span>
        </div>
      </div>

      <div className="space-y-4">
        {data.javascriptDependency === "Critical" && (
          <div className="bg-white border-l-4 border-l-red-500 border-red-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded-md">Technical Architecture</span>
                <h4 className="font-black text-slate-900 text-base mt-1">High JavaScript Framework Dependency</h4>
              </div>
              <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-1 rounded-xl uppercase tracking-wider">CRITICAL</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">Our crawl engine detected that your DOM structure loads empty initial templates and relies on heavy Client-Side JavaScript hydration.</p>
          </div>
        )}

        {data.recommendations.map((item: Recommendation, idx: number) => {
          const isCritical = item.severity === "CRITICAL";
          const isMedium = item.severity === "MEDIUM";

          return (
            <div key={idx} className={`bg-white border rounded-2xl p-5 shadow-sm space-y-3 border-l-4 ${isCritical ? "border-l-red-500 border-red-100" : isMedium ? "border-l-amber-500 border-amber-100" : "border-l-blue-500 border-blue-100"}`}>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isCritical ? "text-red-500 bg-red-50" : isMedium ? "text-amber-600 bg-amber-50" : "text-blue-500 bg-blue-50"}`}>{item.category || "General Optimization"}</span>
                  <h4 className="font-black text-slate-900 text-base mt-1">{item.title}</h4>
                </div>
                <span className={`font-black text-[10px] px-2.5 py-1 rounded-xl uppercase tracking-wider shrink-0 ${isCritical ? "bg-red-600 text-white" : isMedium ? "bg-amber-500 text-white" : "bg-blue-600 text-white"}`}>{item.severity}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
              <div className="bg-slate-50/50 p-3 rounded-xl text-xs text-slate-600 border border-slate-100"><strong className="font-bold text-slate-800">AEO Impact:</strong> {item.impact}</div>
              {item.fixSteps && item.fixSteps.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-2">
                  <strong className="block font-bold text-slate-900 uppercase tracking-wide">🛠️ How to Fix:</strong>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    {item.fixSteps.map((step, sIdx) => <li key={sIdx} className="leading-relaxed">{step}</li>)}
                  </ol>
                </div>
              )}
              {item.codeSnippet && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block">Implementation Snippet:</span>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-w-full"><code>{item.codeSnippet}</code></pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}