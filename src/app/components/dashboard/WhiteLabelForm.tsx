"use client";

import Link from "next/link";
import { RefObject } from "react";

interface WhiteLabelFormProps {
  isFreePlan: boolean;
  agencyName: string;
  brandColor: string;
  authorName: string;
  logoBase64: string | null;
  logoInputRef: RefObject<HTMLInputElement | null>;
  onAgencyNameChange: (val: string) => void;
  onBrandColorChange: (val: string) => void;
  onAuthorNameChange: (val: string) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
}

export default function WhiteLabelForm({
  isFreePlan,
  agencyName,
  brandColor,
  authorName,
  logoBase64,
  logoInputRef,
  onAgencyNameChange,
  onBrandColorChange,
  onAuthorNameChange,
  onLogoUpload,
  onRemoveLogo,
}: WhiteLabelFormProps) {
  return (
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

      <div className={`grid grid-cols-1 sm:grid-cols-4 gap-4 ${isFreePlan ? "opacity-40 select-none pointer-events-none" : ""}`}>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Agency Name</label>
          <input type="text" disabled={isFreePlan} value={agencyName} onChange={(e) => onAgencyNameChange(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Accent Color</label>
          <div className="flex gap-2">
            <input type="color" disabled={isFreePlan} value={`#${brandColor.replace("#", "")}`} onChange={(e) => onBrandColorChange(e.target.value)} className="w-8 h-8 rounded-lg border cursor-pointer shrink-0" />
            <input type="text" disabled={isFreePlan} value={brandColor} onChange={(e) => onBrandColorChange(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none flex-1 focus:border-blue-500 bg-white" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Compiler Name</label>
          <input type="text" disabled={isFreePlan} value={authorName} onChange={(e) => onAuthorNameChange(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 bg-white" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Agency Logo (png)</label>
          {logoBase64 ? (
            <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50/50 p-1 rounded-xl h-[34px]">
              <span className="text-[10px] font-black text-emerald-700 px-2 truncate flex-1">✓ Logo Saved</span>
              <button type="button" onClick={onRemoveLogo} className="text-[10px] font-black text-rose-500 hover:text-rose-700 px-2 bg-white rounded-lg h-full border border-slate-200">Remove</button>
            </div>
          ) : (
            <label className="border border-slate-200 hover:border-blue-500 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:text-blue-600 text-center cursor-pointer transition h-[34px] flex items-center justify-center">
              Upload Image Logo
              <input ref={logoInputRef} id="logo-upload-input" type="file" accept="image/png, image/jpeg" onChange={onLogoUpload} className="hidden" disabled={isFreePlan} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}