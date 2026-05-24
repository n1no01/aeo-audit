"use client";

interface AuditLoadingProps {
  currentOperation: string;
}

export default function AuditLoading({ currentOperation }: AuditLoadingProps) {
  return (
    <div className="mb-10 block">
      <div className="bg-white border border-slate-100 rounded-[24px] sm:rounded-[40px] p-5 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-blue-500/5 animate-pulse" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-1.5">Live Audit Engine</div>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight">Running Analysis</h2>
          </div>
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          </div>
        </div>
        <div className="h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden mb-6 sm:mb-8">
          <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse" />
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border">
          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 sm:mb-3">Current Operation</div>
          <p className="text-sm sm:text-base font-bold text-slate-700 animate-pulse">{currentOperation}</p>
        </div>
      </div>
    </div>
  );
}