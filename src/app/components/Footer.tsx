"use client";

import Link from "next/link";

export default function Footer() {
  return (
    /* Changed bg-white to bg-slate-50 for a clean, distinct layout anchor */
    <footer className="border-t border-slate-200/60 py-10 text-center text-xs font-medium text-slate-500 bg-slate-50 w-full px-4 leading-relaxed flex flex-col items-center gap-4 relative z-10">
      <div className="font-semibold text-slate-600/90">&copy; 2026 AEO Audit Pro. All rights reserved.</div>

      <div className="text-slate-500">
        📬 For enterprise inquiries or support:{" "}
        <a 
          href="mailto:hello@aeoaudit-pro.com?subject=AEO Audit Pro Inquiry" 
          className="text-blue-600 hover:text-blue-700 transition-colors font-bold underline decoration-blue-500/20"
        >
          hello@aeoaudit-pro.com
        </a>
      </div>

      {/* LEGAL & SOCIAL LINKS */}
      <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500 font-medium">
        <Link href="/privacy" className="hover:text-slate-900 underline decoration-slate-300 hover:decoration-blue-500 transition-colors duration-200">
          Privacy Policy
        </Link>
        <span className="text-slate-200">|</span>
        <Link href="/terms" className="hover:text-slate-900 underline decoration-slate-300 hover:decoration-blue-500 transition-colors duration-200">
          Terms of Service
        </Link>
        <span className="text-slate-200">|</span>
        <a 
          href="https://www.linkedin.com/company/aeo-audit-pro/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-blue-600 font-bold flex items-center gap-1 transition-colors duration-200"
        >
          <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
          Follow on LinkedIn
        </a>
      </div>
    </footer>
  );
}