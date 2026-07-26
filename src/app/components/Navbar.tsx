"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { getOrCreateApiKey, regenerateApiKey } from "../actions"; // Prilagodi import putanju po potrebi

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

  // Stanja za API Key Modal
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Logika za dohvaćanje API ključa kada korisnik otvori modal
  const handleOpenKeyModal = async () => {
    setIsKeyModalOpen(true);
    setLoadingKey(true);
    const res = await getOrCreateApiKey();
    if (res.apiKey) setApiKey(res.apiKey);
    setLoadingKey(false);
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateKey = async () => {
    if (!confirm("Are you sure? Any active extension using the old key will stop working.")) return;
    setLoadingKey(true);
    const res = await regenerateApiKey();
    if (res.apiKey) setApiKey(res.apiKey);
    setLoadingKey(false);
  };

  // Priprema varijabli za brojač
  const usedCredits = isRadarPage ? (userStats?.radar_used ?? 0) : (userStats?.used ?? 0);
  const limitCredits = isRadarPage 
    ? (userStats?.radar_limit ?? 0) 
    : (userStats?.limit || (userStats?.plan === "FREE" ? 1 : userStats?.plan === "STARTER" ? 50 : 200));
  
  const badgeLabel = isRadarPage ? "RADAR" : userStats?.plan || "FREE";

  return (
    <>
      <nav className={isDashboard ? "sticky top-0 z-50 w-full bg-white border-b border-slate-200/80 shadow-sm" : "sticky top-0 z-50 w-full bg-white/70 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all duration-200"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href={isDashboard ? "/dashboard" : (userId ? "/dashboard" : "/")} className="group cursor-pointer select-none">
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

          {isDashboard ? (
            /* ─── DASHBOARD MENU ─── */
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
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

              {/* 🚀 LINK ZA LEADOVE IZ WIDGETA */}
              <Link
                href="/dashboard/leads"
                className={`text-xs sm:text-sm font-semibold transition duration-200 flex items-center gap-1.5 m-0 ${
                  pathname.startsWith("/dashboard/leads") ? "text-blue-600 font-bold" : "text-slate-600 hover:text-blue-600"
                }`}
              >
                Lead Magnet
              </Link>

              <Link
                href="/academy"
                className={`text-xs sm:text-sm font-semibold transition duration-200 flex items-center gap-1 m-0 ${
                  pathname.startsWith("/academy") ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
                }`}
              >
                Academy 🎓
              </Link>

              {pathname !== "/dashboard" && (
                <Link
                  href="/dashboard"
                  className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50/60 border border-blue-100 px-3 py-1.5 rounded-xl transition duration-200"
                >
                  <span>&larr;</span> Dashboard
                </Link>
              )}

              <div className="h-4 w-px bg-slate-200 hidden sm:block" />

              {/* CLERK USER BUTTON SA INTEGRISANIM API KEY I LEADS OPCIJAMA */}
              <UserButton>
                <UserButton.MenuItems>
                  {userStats && (
                    <UserButton.Link
                      label={`Plan: ${badgeLabel.toUpperCase()} • ${usedCredits}/${limitCredits} Used`}
                      labelIcon={
                        <span className="text-xs font-bold">
                          {usedCredits >= (limitCredits || 1) ? "🚨" : "⚡"}
                        </span>
                      }
                      href="/pricing"
                    />
                  )}
                  <UserButton.Link
                    label="Widget & Captured Leads"
                    labelIcon={<span className="text-xs font-bold">🎯</span>}
                    href="/dashboard/leads"
                  />
                  <UserButton.Action
                    label="Chrome Extension API Key"
                    labelIcon={<span className="text-xs font-bold">🔑</span>}
                    onClick={handleOpenKeyModal}
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          ) : (
            /* ─── PUBLIC MENU ─── */
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
                <div className="flex items-center gap-3">
                  <Link href="/dashboard" className="bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-blue-600 transition shadow-sm">Dashboard</Link>
                  <UserButton>
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="Widget & Captured Leads"
                        labelIcon={<span className="text-xs font-bold">🎯</span>}
                        href="/dashboard/leads"
                      />
                      <UserButton.Action
                        label="Chrome Extension API Key"
                        labelIcon={<span className="text-xs font-bold">🔑</span>}
                        onClick={handleOpenKeyModal}
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
              ) : (
                <>
                  <Link href="/sign-in" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">Sign In</Link>
                  <Link href="/sign-up" className="bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl hover:bg-blue-600 transition shadow-sm">Get Started</Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* 🚀 API KEY MODAL POPUP */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔑</span>
                <h3 className="text-base font-extrabold text-slate-900">Chrome Extension API Key</h3>
              </div>
              <button 
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500 leading-relaxed">
              Use this key inside your <strong>AEO Inspector Chrome Extension</strong> to authenticate and run full AI RAG audits directly from your browser.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={loadingKey ? "Generating Key..." : apiKey || "Error loading key"}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs font-medium text-slate-800 outline-none select-all"
              />
              <button
                onClick={handleCopyKey}
                disabled={loadingKey || !apiKey}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleRegenerateKey}
                disabled={loadingKey}
                className="text-[11px] font-semibold text-slate-400 hover:text-red-500 transition underline"
              >
                Roll / Revoke Key
              </button>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}