"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface NavbarProps {
  userId: string | null;
}

export default function Navbar({ userId }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Otvaranje menija i čišćenje tajmera za zatvaranje
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  // Zatvaranje sa malim zakašnjenjem (debouce) kako se meni ne bi naglo ugasio ako miš pobjegne za piksel
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // 150ms tolerancije za ruku korisnika
  };

  // Očišćenje tajmera pri demontiranju komponente
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Sigurnosno zatvaranje klikom van menija (za mobilne uređaje)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent z-50 relative">
      
      {/* Logo */}
      <Link href={userId ? "/dashboard" : "/"} className="group cursor-pointer select-none">
        <div className="text-2xl font-black tracking-tight italic">
          AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200">Audit</span> Pro
        </div>
      </Link>
      
      {/* Nav Links */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
        
        {/* DROPDOWN ZA ALATE (Sada podržava i Hover i Klik za Mobile) */}
        <div 
          className="relative flex items-center m-0 p-0" 
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition duration-200 cursor-pointer focus:outline-none select-none"
          >
            Free Tools
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-blue-600" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Lista alata */}
          {isOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col gap-1">
              
              {/* 1. AI Schema Generator */}
              <Link
                href="/tools/ai-schema-generator"
                onClick={() => setIsOpen(false)}
                className="flex flex-col gap-0.5 p-3 rounded-lg hover:bg-slate-800/60 transition duration-150 group"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                  AI Schema Generator
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Optimize your site structure for LLMs.
                </span>
              </Link>

              {/* 2. AI Robots.txt Generator */}
              <Link
                href="/tools/ai-robots-generator"
                onClick={() => setIsOpen(false)}
                className="flex flex-col gap-0.5 p-3 rounded-lg hover:bg-slate-800/60 transition duration-150 group border-t border-slate-800/40"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                  AI Robots.txt Generator
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Control LLM crawlers and AI search bots.
                </span>
              </Link>

              {/* 3. AEO Semantic Analyzer */}
              <Link
                href="/tools/aeo-semantic-analyzer"
                onClick={() => setIsOpen(false)}
                className="flex flex-col gap-0.5 p-3 rounded-lg hover:bg-slate-800/60 transition duration-150 group border-t border-slate-800/40"
              >
                <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                  AEO Semantic Analyzer
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Analyze content density for AI systems.
                </span>
              </Link>
              
            </div>
          )}
        </div>

        <Link href="/how-it-works" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition m-0">
          How It Works
        </Link>
        <Link href="/about" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition m-0">
          About Us
        </Link>
        <Link href="/pricing" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition m-0">
          Pricing
        </Link>
        <Link href="/sign-in" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition m-0">
          Sign In
        </Link>
        <Link href="/sign-up" className="bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-blue-600 transition shadow-sm m-0">
          Get Started
        </Link>
      </div>
    </nav>
  );
}