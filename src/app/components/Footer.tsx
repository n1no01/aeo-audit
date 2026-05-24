import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/50 py-8 text-center text-xs font-bold text-slate-400 bg-white w-full px-4 leading-relaxed flex flex-col items-center gap-4 relative z-10">
      <div>&copy; 2026 AEO Audit Pro. All rights reserved.</div>
      
      {/* NICK LAUNCHES BADGE */}
      <div className="my-2 hover:opacity-90 transition-opacity">
        <a 
          href="https://nicklaunches.com/products/aeo-audit-pro/?utm_source=aeoaudit-pro.com&utm_medium=badge&utm_campaign=featured" 
          target="_blank" 
          rel="noopener"
        >
          <img 
            src="https://nicklaunches.com/badges/featured.svg" 
            alt="AEO Audit Pro on Nick Launches" 
            width="244" 
            height="56" 
            className="mx-auto"
          />
        </a>
      </div>

      <div className="mt-1 text-slate-400/80">
        📬 For enterprise inquiries or support:{" "}
        <a 
          href="mailto:hello@aeoaudit-pro.com?subject=AEO Audit Pro Inquiry" 
          className="text-blue-600/80 hover:text-blue-600 transition-colors underline decoration-blue-500/20"
        >
          hello@aeoaudit-pro.com
        </a>
      </div>

      {/* LEGAL LINKS */}
      <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-400 font-medium">
        <Link href="/privacy" className="hover:text-slate-900 underline decoration-slate-200 hover:decoration-blue-500 transition-colors duration-200">
          Privacy Policy
        </Link>
        <span className="text-slate-200">|</span>
        <Link href="/terms" className="hover:text-slate-900 underline decoration-slate-200 hover:decoration-blue-500 transition-colors duration-200">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}