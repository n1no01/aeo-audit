import { AuditData } from "../../lib/types";

interface SimulatorPanelProps {
  data: AuditData;
  cleanHostname: string;
}

export default function SimulatorPanel({ data, cleanHostname }: SimulatorPanelProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="p-4 bg-slate-900/5 border border-slate-950/10 rounded-2xl">
        <p className="text-xs font-medium text-slate-500 leading-relaxed">
          <strong>AEO LIVE PARAGRAPH ANALYSIS:</strong> Language Models evaluate content density row-by-row. Below is a real-time extraction preview showing exactly which sections pass citation filters.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-800">AEO Engine (Behavioral Content Tokenizer)</span>
        </div>

        <div className="p-6 flex-1 space-y-6 bg-gradient-to-b from-white to-slate-50/30">
          <div className="flex justify-end">
            <div className="bg-slate-100 text-slate-800 text-sm px-4 py-3 rounded-2xl rounded-tr-sm max-w-md font-medium shadow-sm">
              Extract the core value proposition and analytical claims from {cleanHostname}.
            </div>
          </div>

          <div className="flex gap-4 max-w-3xl">
            <div className="h-8 w-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-md">🤖</div>
            <div className="space-y-6 flex-1">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded">Block #1 Preview</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${data.entityDensityScore >= 7 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>Entity Density: {data.entityDensityScore || 5}/10</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium italic border-l-2 border-slate-300 pl-3">
                  {data.aiAnalysis ? data.aiAnalysis.split("\n\n")[0] : "Extracting main layout text variables..."}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[9px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded">Block #2 Preview</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${data.bluffScore >= 7 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>BLUFF Alignment: {data.bluffScore || 5}/10</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-medium italic border-l-2 border-slate-300 pl-3">
                  {data.aiAnalysis && data.aiAnalysis.split("\n\n")[1] ? data.aiAnalysis.split("\n\n")[1] : "Evaluating secondary layout vectors..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}