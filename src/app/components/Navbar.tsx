"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";

interface UserStats {
  plan: string;
  used: number;
  limit: number;
  radar_used?: number;
  radar_limit?: number;
}

interface NavbarProps {
  userId?: string | null;
  userStats?: UserStats | null;
}

export default function Navbar({ userId, userStats }: NavbarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Provjera rute
  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/aeo-radar") ||
    pathname.startsWith("/entity-checker");

  const isRadarPage = pathname.startsWith("/aeo-radar");

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── DASHBOARD / APP NAVBAR ──────────────────────────────────────────────
  if (isDashboard) {
    // Određivanje varijabli za brojač u zavisnosti od stranice
    const usedCredits = isRadarPage ? (userStats?.radar_used ?? 0) : (userStats?.used ?? 0);
    const limitCredits = isRadarPage 
      ? (userStats?.radar_limit ?? 0) 
      : (userStats?.limit || (userStats?.plan === "FREE" ? 1 : userStats?.plan === "STARTER" ? 50 : 200));
    
    const badgeLabel = isRadarPage ? "📡 RADAR" : userStats?.plan;

    return (
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/dashboard" className="group cursor-pointer select-none">
            <div className="flex items-center gap-2.5">
              <Image 
                src="/logo.png" 
                alt="AEO Audit Pro Logo" 
                width={32} 
                height={32} 
                className="object-contain"
                priority 
              />
              <div className="text-2xl font-black tracking-tight italic">
                AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200"> Audit</span> Pro
              </div>
            </div>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
            <Link
              href="/aeo-radar"
              className={`text-xs sm:text-sm font-semibold transition duration-200 flex items-center gap-1.5 m-0 ${
                pathname === "/aeo-radar" ? "text-blue-600 font-bold" : "text-slate-600 hover:text-blue-600"
              }`}
            >
              AI Radar
            </Link>

            <Link
              href="/entity-checker"
              className={`text-xs sm:text-sm font-semibold transition duration-200 flex items-center gap-1.5 m-0 relative ${
                pathname === "/entity-checker" ? "text-blue-600 font-bold" : "text-slate-600 hover:text-blue-600"
              }`}
            >
              Entity Checker
             
            </Link>

            <Link
              href="/academy"
              className={`text-xs sm:text-sm font-semibold transition duration-200 flex items-center gap-1 m-0 ${
                pathname.startsWith("/academy") ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
              }`}
            >
              Academy 🎓
            </Link>

            {/* 🏠 POZICIONIRANO DUGME ZA POVRATAK: Nalazi se tačno između Academy i vertikalnog separatora */}
            {pathname !== "/dashboard" && (
              <Link
                href="/dashboard"
                className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50/60 border border-blue-100 px-3 py-1.5 rounded-xl transition duration-200"
              >
                <span>&larr;</span> Dashboard
              </Link>
            )}

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* Pametni jedinstveni brojač za čitavu aplikaciju */}
            {userStats && (
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 select-none">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  isRadarPage 
                    ? "bg-slate-900 text-white" 
                    : (userStats.plan === "FREE" ? "bg-slate-200 text-slate-700" : "bg-blue-600 text-white")
                }`}>
                  {badgeLabel}
                </span>
                <div className="flex flex-col items-start gap-0.5">
                  <span className="text-[10px] text-slate-700 font-black">
                    {usedCredits}/{limitCredits} Used
                  </span>
                  <div className="w-16 bg-slate-200 h-1 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usedCredits >= (limitCredits || 1) ? "bg-rose-500" : "bg-blue-600"
                      }`}
                      style={{
                        width: `${Math.min((usedCredits / (limitCredits || 1)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <UserButton />
          </div>
        </div>
      </nav>
    );
  }

  // ─── PUBLIC NAVBAR ───────────────────────────────────────────────────────
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link href={userId ? "/dashboard" : "/"} className="group cursor-pointer select-none">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="AEO Audit Pro Logo" width={32} height={32} className="object-contain" priority />
            <div className="text-2xl font-black tracking-tight italic">
              AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200"> Audit</span> Pro
            </div>
          </div>
        </Link>

        <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
          <div className="relative flex items-center m-0 p-0" ref={dropdownRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition duration-200 cursor-pointer focus:outline-none select-none">
              Free Tools
              <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-600" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 p-2 shadow-2xl z-50 flex flex-col gap-1">
                <Link href="/tools/ai-schema-generator" onClick={() => setIsOpen(false)} className="flex flex-col gap-0.5 p-3 rounded-lg hover:bg-slate-800/60 transition group">
                  <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-blue-400">AI Schema Generator</span>
                  <span className="text-[11px] text-slate-500 font-medium">Optimize your site structure for LLMs.</span>
                </Link>
                <Link href="/tools/ai-robots-generator" onClick={() => setIsOpen(false)} className="flex flex-col gap-0.5 p-3 rounded-lg hover:bg-slate-800/60 transition group border-t border-slate-800/40">
                  <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-blue-400">AI Robots.txt Generator</span>
                  <span className="text-[11px] text-slate-500 font-medium">Control LLM crawlers and AI search bots.</span>
                </Link>
                <Link href="/tools/aeo-semantic-analyzer" onClick={() => setIsOpen(false)} className="flex flex-col gap-0.5 p-3 rounded-lg hover:bg-slate-800/60 transition group border-t border-slate-800/40">
                  <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-blue-400">AEO Semantic Analyzer</span>
                  <span className="text-[11px] text-slate-500 font-medium">Analyze content density for AI systems.</span>
                </Link>
              </div>
            )}
          </div>

          <Link href="/how-it-works" className={`text-xs sm:text-sm font-bold transition ${pathname === "/how-it-works" ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>How It Works</Link>
          <Link href="/about" className={`text-xs sm:text-sm font-bold transition ${pathname === "/about" ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>About Us</Link>
          <Link href="/pricing" className={`text-xs sm:text-sm font-bold transition ${pathname === "/pricing" ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`}>Pricing</Link>
          <Link href="/academy" className={`text-xs sm:text-sm font-bold transition ${pathname.startsWith("/academy") ? "text-blue-600" : "text-slate-600 hover:text-blue-600"}`}>Academy 🎓</Link>

          {userId ? (
            <Link href="/dashboard" className="bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-blue-600 transition shadow-sm">Dashboard</Link>
          ) : (
            <>
              <Link href="/sign-in" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">Sign In</Link>
              <Link href="/sign-up" className="bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-600 transition shadow-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}