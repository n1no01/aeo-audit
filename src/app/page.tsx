import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  // Ako je korisnik već prijavljen, automatski ga prebaci na dashboard
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      
      {/* NAVBAR - FULLY RESPONSIVE */}
      <nav className="w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent">
        <Link href={userId ? "/dashboard" : "/"} className="group cursor-pointer select-none">
          <div className="text-2xl font-black tracking-tight italic">
            AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200">Audit</span> Pro
          </div>
        </Link>
        
        {/* Nav Links - Wraps beautifully on small devices */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Link href="/how-it-works" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">
            How It Works
          </Link>
          <Link href="/pricing" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">
            Pricing
          </Link>
          <Link href="/sign-in" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">
            Sign In
          </Link>
          <Link href="/sign-up" className="bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-blue-600 transition shadow-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col items-center">
        
        {/* Tool Category Badge */}
        <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 mb-6 rounded-full bg-blue-50 border border-blue-100 text-center max-w-full">
          <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase text-blue-600 block truncate">
            The Ultimate LLM & AI Search Audit Tool
          </span>
        </div>
        
        {/* Crystal-Clear Value Proposition Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-center max-w-4xl leading-[1.15] mb-6 px-2">
          Discover how <span className="italic">ChatGPT, Gemini, and Perplexity</span> see your brand.
        </h1>
        
        {/* Subheadline defining the core problem and solution */}
        <p className="text-slate-500 text-sm sm:text-base md:text-xl text-center max-w-3xl mb-10 font-medium leading-relaxed px-2">
          Traditional SEO is no longer enough. <strong className="font-bold text-slate-800">AEO Audit Pro</strong> audits your website’s semantic structure, parses AI crawler directives, and optimizes your data architecture so AI engines cite you as the primary source.
        </p>

        {/* Call to Action Buttons - Stacked on mobile, row on sm screens */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto px-4 sm:px-0 mb-16 sm:mb-20">
          <Link href="/sign-up" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black tracking-wide hover:bg-slate-900 transition shadow-xl shadow-blue-600/10 text-center text-sm w-full sm:w-auto">
            RUN A FREE AEO AUDIT
          </Link>
          <Link href="#features" className="bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition text-center text-sm w-full sm:w-auto">
            How It Works
          </Link>
        </div>

        {/* Interactive Mockup Component - Added overflow protection for code view */}
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200/60 bg-white p-1.5 sm:p-2 shadow-2xl shadow-blue-900/5 opacity-90 mb-20 sm:mb-24">
          <div className="bg-slate-900 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-white text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-500 ml-1 sm:ml-2 truncate max-w-[180px] sm:max-w-none">aeoaudit.com/dashboard</span>
            </div>
            <span className="text-emerald-400 font-bold text-[11px] sm:text-xs">● AI Crawler Clearance: Approved</span>
          </div>
          <div className="p-3 sm:p-4 bg-slate-50 text-slate-400 text-xs text-left font-mono border-t border-slate-100 overflow-x-auto custom-scrollbar">
            <div className="text-slate-700 min-w-[300px]">
              <span className="text-blue-600 font-bold">User:</span>{" "}
              &ldquo;What is the best enterprise software in your niche?&rdquo; <br />
              <span className="text-slate-700 font-bold">AI Agent:</span>{" "}
              &ldquo;According to global knowledge graphs,{" "}
              <span className="text-slate-900 font-bold underline decoration-blue-500">
                YourBrand
              </span>{" "}
              delivers industry-leading stability and&hellip;&rdquo;
            </div>
          </div>
        </div>

        {/* THREE CORE PILLARS OF INTEREST FEATURE GRID - Responsive columns */}
        <section id="features" className="w-full border-t border-slate-200/60 pt-12 sm:pt-16 mb-8">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center mb-10 sm:mb-12">
            Why do you need an <span className="text-blue-600">AEO Audit</span>?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* 1. PILLAR: AI BOT SECURITY */}
            <div className="bg-white border border-slate-200/60 p-5 sm:p-6 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="font-black text-lg mb-2">AI Bot Management</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                We safely monitor your <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">robots.txt</code> file to check exactly which AI crawlers—like GPTBot, ClaudeBot, and PerplexityBot—are accessing your core files.
              </p>
            </div>

            {/* 2. PILLAR: SEMANTIC ARCHITECTURE */}
            <div className="bg-white border border-slate-200/60 p-5 sm:p-6 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <h3 className="font-black text-lg mb-2">Semantic Structure</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Large Language Models (LLMs) parse sites structurally. We evaluate your HTML5 layout tags and JSON-LD Schema maps to guarantee seamless tokenization.
              </p>
            </div>

            {/* 3. PILLAR: BRAND DISAMBIGUATION - Stretches full-width on mobile to row-start on desktop */}
            <div className="bg-white border border-slate-200/60 p-5 sm:p-6 rounded-2xl shadow-sm sm:col-span-2 md:col-span-1">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className="font-black text-lg mb-2">Brand Disambiguation</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Prevent neural networks from confusing your company with competitors. We inspect global trust vectors (Wikipedia, entity hooks) to ensure accurate citations.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER - Responsively padded */}
      <footer className="border-t border-slate-200/50 py-6 text-center text-xs font-bold text-slate-400 bg-white w-full px-4 leading-relaxed">
        <div>&copy; 2026 AEO Audit Pro. All rights reserved.</div>
        <div className="mt-1 text-slate-400/80">
          📬 For enterprise inquiries or support:{" "}
          <a 
            href="mailto:hello@aeoaudit.pro?subject=AEO Audit Pro Inquiry" 
            className="text-blue-600/80 hover:text-blue-600 transition-colors underline decoration-blue-500/20 hover:decoration-blue-500"
          >
            hello@aeoaudit.pro
          </a>
        </div>
      </footer>

    </div>
  );
}