"use client";

import Link from "next/link";

interface AgencyBrandingProps {
  showBranding: boolean;
  setShowBranding: (show: boolean) => void;
  isFreePlan: boolean;
  agencyName: string;
  setAgencyName: (val: string) => void;
  brandColor: string;
  setBrandColor: (val: string) => void;
  authorName: string;
  setAuthorName: (val: string) => void;
}

export default function AgencyBranding({
  showBranding,
  setShowBranding,
  isFreePlan,
  agencyName,
  setAgencyName,
  brandColor,
  setBrandColor,
  authorName,
  setAuthorName,
}: AgencyBrandingProps) {
  return (
    <div className="space-y-4">
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowBranding(!showBranding)}
          className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-2 transition cursor-pointer"
        >
          <span className={`transform transition duration-200 ${showBranding ? "rotate-90" : ""}`}>▶</span>
          {showBranding ? "Hide Agency Branding Options" : "Show Agency White-Label Options"}
        </button>
      </div>

      {showBranding && (
        <div className="relative pt-4 border-t border-slate-50">
          {isFreePlan && (
            <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center rounded-xl p-4 text-center">
              <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-1 shadow-sm">
                🔒 Agency Override Locked
              </span>
              <p className="text-[11px] text-slate-500 font-bold max-w-sm">
                Custom branding and DOCX report generation requires an{" "}
                <Link href="/pricing" className="text-blue-600 underline hover:text-blue-700">
                  Agency Plan
                </Link>.
              </p>
            </div>
          )}

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${isFreePlan ? "opacity-40 select-none pointer-events-none" : ""}`}>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Agency Name</label>
              <input
                type="text"
                disabled={isFreePlan}
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  disabled={isFreePlan}
                  value={`#${brandColor.replace("#", "")}`}
                  onChange={(e) => setBrandColor(e.target.value.replace("#", ""))}
                  className="w-8 h-8 rounded-lg border cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  disabled={isFreePlan}
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value.replace("#", ""))}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none flex-1 focus:border-blue-500 bg-white"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Compiler Name</label>
              <input
                type="text"
                disabled={isFreePlan}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}