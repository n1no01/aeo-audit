import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  // Ako je korisnik već prijavljen, automatski ga prebaci na dashboard
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      
      {/* AI BACKGROUND: Svetla tehnička mreža (Grid) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60" />
      
      {/* Suptilni svetleći pastelni gradijenti iza teksta */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-r from-blue-500/10 to-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[200px] left-[-100px] w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-[150px] right-[-100px] w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* NAVBAR */}
      <nav className="w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent z-10">
        <Link href={userId ? "/dashboard" : "/"} className="group cursor-pointer select-none">
          <div className="text-2xl font-black tracking-tight italic">
            AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200">Audit</span> Pro
          </div>
        </Link>
        
        {/* Nav Links */}
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
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col items-center relative z-10">
        
        {/* FLOATING AI LOGOS - Sva 5 zvanična logotipa raspoređena na vrhu */}
        
        {/* LEVA STRANA - GORE (ChatGPT) */}
        <div className="hidden md:flex absolute top-10 left-4 w-12 h-12 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-md animate-bounce [animation-duration:6s] opacity-60 hover:opacity-100 transition-opacity duration-300 p-2.5 z-20">
          <img src="/chatgpt.png" alt="ChatGPT" className="w-full h-full object-contain" />
        </div>

        {/* LEVA STRANA - SREDINA (Gemini) */}
        <div className="hidden md:flex absolute top-40 left-16 w-14 h-14 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-md animate-bounce [animation-duration:7s] [animation-delay:0.5s] opacity-50 hover:opacity-100 transition-opacity duration-300 p-2.5 z-20">
          <img src="/gemini.png" alt="Gemini" className="w-full h-full object-contain animate-pulse" />
        </div>

        {/* LEVA STRANA - NIŽE (Perplexity) */}
        <div className="hidden md:flex absolute top-72 left-6 w-12 h-12 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-md animate-bounce [animation-duration:6.5s] [animation-delay:2s] opacity-60 hover:opacity-100 transition-opacity duration-300 p-2.5 z-20">
          <img src="/perplexity.png" alt="Perplexity" className="w-full h-full object-contain" />
        </div>

        {/* DESNA STRANA - GORE (Claude) */}
        <div className="hidden md:flex absolute top-8 right-6 w-14 h-14 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-md animate-bounce [animation-duration:5s] [animation-delay:1s] opacity-60 hover:opacity-100 transition-opacity duration-300 p-3 z-20">
          <img src="/claude.png" alt="Claude" className="w-full h-full object-contain" />
        </div>

        {/* DESNA STRANA - NIŽE (DeepSeek) */}
        <div className="hidden md:flex absolute top-44 right-16 w-12 h-12 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-md animate-bounce [animation-duration:5.5s] [animation-delay:1.5s] opacity-50 hover:opacity-100 transition-opacity duration-300 p-2.5 z-20">
          <img src="/deepseek.png" alt="DeepSeek" className="w-full h-full object-contain" />
        </div>

        {/* Tool Category Badge */}
        <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 mb-6 rounded-full bg-blue-50 border border-blue-100 text-center max-w-full backdrop-blur-sm">
          <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase text-blue-600 block truncate">
            The Ultimate LLM & AI Search Audit Tool
          </span>
        </div>
        
        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-center max-w-4xl leading-[1.15] mb-6 px-2 text-slate-900">
          Discover how <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 italic">ChatGPT, Gemini, and Perplexity</span> see your brand.
        </h1>
        
        {/* Subheadline */}
        <p className="text-slate-500 text-sm sm:text-base md:text-xl text-center max-w-3xl mb-10 font-medium leading-relaxed px-2">
          Traditional SEO is no longer enough. <strong className="font-bold text-slate-800">AEO Audit Pro</strong> audits your website’s semantic structure, parses AI crawler directives, and optimizes your data architecture so AI engines cite you as the primary source.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center w-full sm:w-auto px-4 sm:px-0 mb-16 sm:mb-20">
          <Link href="/sign-up" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black tracking-wide hover:bg-slate-900 transition shadow-xl shadow-blue-600/10 text-center text-sm w-full sm:w-auto">
            RUN A FREE AEO AUDIT
          </Link>
          <Link href="#features" className="bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition text-center text-sm w-full sm:w-auto">
            How It Works
          </Link>
        </div>

        {/* Interactive Mockup Component */}
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200/60 bg-white p-1.5 sm:p-2 shadow-2xl shadow-blue-900/5 mb-20 sm:mb-24">
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
              <div className="mt-2">
                <span className="text-slate-700 font-bold">AI Agent:</span>{" "}
                &ldquo;According to global knowledge graphs,{" "}
                <span className="text-slate-900 font-bold underline decoration-blue-500 decoration-2">
                  YourBrand
                </span>{" "}
                delivers industry-leading stability and&hellip;&rdquo;
              </div>
            </div>
          </div>
        </div>

        {/* THREE CORE PILLARS GRID */}
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
                We safely monitor your <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">robots.txt</code> file to check exactly which AI crawlers—like GPTBot, ClaudeBot, and DeepSeek-Assistant—are accessing your core files.
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

            {/* 3. PILLAR: BRAND DISAMBIGUATION */}
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

        {/* TESTIMONIALS SECTION - Privremeno sakriven/zakomentarisan */}
        {/* 
        <section className="w-full border-t border-slate-200/60 pt-16 pb-4 overflow-hidden relative">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center mb-4">
            Trusted by Forward-Thinking Teams
          </h2>
          <p className="text-slate-500 text-sm text-center max-w-xl mx-auto mb-12 font-medium">
            See how SEO agencies, founders, and marketing directors are securing their visibility in AI search.
          </p>

          <div className="relative w-full overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-[#f8fafc] before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:from-[#f8fafc] after:to-transparent">
            
            <div className="flex gap-6 w-max animate-marquee hover:[animation-play-state:paused] cursor-pointer py-4">
              
              {[
                { name: "Sarah Jenkins", role: "Head of SEO at Lexis Media", text: "AEO Audit Pro showed us that ChatGPT was completely ignoring our enterprise client. Fixed the schema in 2 days and now we are the top citation.", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60" },
                { name: "Marc Verlang", role: "Founder of SaaSify", text: "Traditional SEO tools are blind to AI chat logs. This tool is a lifesaver for tracking our actual AI Share of Voice.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60" },
                { name: "Amina Koč", role: "Growth Marketer", text: "We discovered that DeepSeek was miscategorizing our brand product lines. The semantic checklist helped us clean up our layout beautifully.", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" },
                { name: "David Chen", role: "Director of Search, Omni Agency", text: "Client pitches became 10x easier. Showing them how invisible they are on Perplexity makes them close the deal instantly.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60" },
                { name: "Elena Rostova", role: "Content Strategist", text: "I love the technical accuracy of the RAG pipeline analysis. It stripped away all marketing fluff and gave me cold hard technical fixes.", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60" },
                { name: "Liam O'Connor", role: "E-commerce Founder", text: "If you sell products and AI isn't recommending you, you're losing money. AEO Audit Pro is exactly what the market needed.", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60" },
                { name: "Jessica Taylor", role: "VP of Marketing at CloudScale", text: "The automated telemetry probes save our dev team hours of manual LLM prompt testing. Truly set-and-forget software.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60" },
                { name: "Thomas Mueller", role: "Technical SEO Specialist", text: "The JSON-LD validation and layout tokenization analysis is top-tier. Best product launched this year.", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60" }
              ].map((t, idx) => (
                <div key={idx} className="w-[320px] bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between shrink-0">
                  <p className="text-slate-600 text-sm leading-relaxed font-medium italic mb-6">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                    <div className="truncate">
                      <h4 className="font-black text-sm text-slate-900 truncate">{t.name}</h4>
                      <p className="text-xs text-slate-400 font-bold truncate">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}

              {[
                { name: "Sarah Jenkins", role: "Head of SEO at Lexis Media", text: "AEO Audit Pro showed us that ChatGPT was completely ignoring our enterprise client. Fixed the schema in 2 days and now we are the top citation.", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60" },
                { name: "Marc Verlang", role: "Founder of SaaSify", text: "Traditional SEO tools are blind to AI chat logs. This tool is a lifesaver for tracking our actual AI Share of Voice.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60" },
                { name: "Amina Koč", role: "Growth Marketer", text: "We discovered that DeepSeek was miscategorizing our brand product lines. The semantic checklist helped us clean up our layout beautifully.", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" },
                { name: "David Chen", role: "Director of Search, Omni Agency", text: "Client pitches became 10x easier. Showing them how invisible they are on Perplexity makes them close the deal instantly.", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60" },
                { name: "Elena Rostova", role: "Content Strategist", text: "I love the technical accuracy of the RAG pipeline analysis. It stripped away all marketing fluff and gave me cold hard technical fixes.", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60" },
                { name: "Liam O'Connor", role: "E-commerce Founder", text: "If you sell products and AI isn't recommending you, you're losing money. AEO Audit Pro is exactly what the market needed.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60" },
                { name: "Jessica Taylor", role: "VP of Marketing at CloudScale", text: "The automated telemetry probes save our dev team hours of manual LLM prompt testing. Truly set-and-forget software.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60" },
                { name: "Thomas Mueller", role: "Technical SEO Specialist", text: "The JSON-LD validation and layout tokenization analysis is top-tier. Best product launched this year.", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60" }
              ].map((t, idx) => (
                <div key={`dup-${idx}`} className="w-[320px] bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between shrink-0">
                  <p className="text-slate-600 text-sm leading-relaxed font-medium italic mb-6">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                    <div className="truncate">
                      <h4 className="font-black text-sm text-slate-900 truncate">{t.name}</h4>
                      <p className="text-xs text-slate-400 font-bold truncate">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </section>
        */}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/50 py-8 text-center text-xs font-bold text-slate-400 bg-white w-full px-4 leading-relaxed flex flex-col items-center gap-4 relative z-10">
        <div>&copy; 2026 AEO Audit Pro. All rights reserved.</div>
        
        {/* NICK LAUNCHES BADGE - Dodat i centriran */}
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

    </div>
  );
}