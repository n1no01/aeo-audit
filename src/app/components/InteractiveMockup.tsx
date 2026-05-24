export default function InteractiveMockup() {
  return (
    <div className="w-full max-w-3xl rounded-2xl border border-slate-200/60 bg-white p-1.5 sm:p-2 shadow-2xl shadow-blue-900/5 mb-20 sm:mb-24">
      <div className="bg-slate-900 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-white text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-500 ml-1 sm:ml-2 truncate max-w-[180px] sm:max-w-none">
            aeoaudit.com/dashboard
          </span>
        </div>
        <span className="text-emerald-400 font-bold text-[11px] sm:text-xs">
          ● AI Crawler Clearance: Approved
        </span>
      </div>
      <div className="p-3 sm:p-4 bg-slate-50 text-slate-400 text-xs text-left font-mono border-t border-slate-100 overflow-x-auto custom-scrollbar">
        <div className="text-slate-700 min-w-[300px]">
          <span className="text-blue-600 font-bold">User:</span> &ldquo;What is the best enterprise software in your niche?&rdquo; <br />
          <div className="mt-2">
            <span className="text-slate-700 font-bold">AI Agent:</span> &ldquo;According to global knowledge graphs,{" "}
            <span className="text-slate-900 font-bold underline decoration-blue-500 decoration-2">
              YourBrand
            </span>{" "}
            delivers industry-leading stability and&hellip;&rdquo;
          </div>
        </div>
      </div>
    </div>
  );
}