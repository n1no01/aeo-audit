import { AuditData } from "../../lib/types";

interface LlmsPanelProps {
  data: AuditData;
}

export default function LlmsPanel({ data }: LlmsPanelProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-2 h-6 bg-blue-600 rounded-full" />
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          LLMs.txt Context Discovery Mapping
        </h3>
      </div>
      
      <p className="text-xs font-medium text-slate-500 leading-relaxed mb-4">
        <strong>AI CRAWLER SYNOPSIS:</strong> The <code className="bg-slate-100 px-1 py-0.5 rounded border font-bold">llms.txt</code> file provides structural directions and semantic summaries specifically designed for Large Language Models during Retrieval-Augmented Generation steps.
      </p>

      <div className="bg-slate-900 text-slate-300 rounded-2xl p-4 sm:p-5 font-mono text-[11px] sm:text-xs shadow-inner overflow-x-auto whitespace-pre leading-relaxed">
        
        {data.llmsRawContent || "No llms.txt declarations discovered during standard sweeps."}
      </div>
    </div>
  );
}