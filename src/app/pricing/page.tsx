import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function PricingPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      
       {/* NAVBAR - FIXED AT THE TOP */}
      <nav className="w-full max-w-5xl mx-auto p-6 flex justify-between items-center bg-transparent">
        <div className="text-2xl font-black tracking-tight italic">
          AEO<span className="text-blue-600">Pulse</span> Pro
        </div>
        <div className="flex items-center gap-6">
          <Link href="/how-it-works" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition">
            How It Works
          </Link>
          <Link href="/pricing" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition">
            Pricing
          </Link>
          <Link href="/sign-in" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition">
            Sign In
          </Link>
          <Link href="/sign-up" className="bg-slate-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition shadow-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* PRICING CONTENT SECTION */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center w-full">
        
        {/* HEADLINE & SUBHEADLINE */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Simple, Transparent <span className="text-blue-600">Pricing</span>
          </h1>
          <p className="text-slate-500 text-base sm:text-lg max-w-xl mx-auto font-medium leading-relaxed">
            Choose the perfect plan for your needs and unlock advanced semantic diagnostics for AI search engines.
          </p>
        </div>

        {/* PRICING CARDS GRID - 3 COLUMNS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch w-full">
          
          {/* 1. FREE PLAN */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 sm:p-8 shadow-xl shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden">
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1">Free Tier</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Basic Test Check</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-black tracking-tight">$0</span>
                <span className="text-slate-400 font-bold text-sm ml-2">one-time</span>
              </div>
              <p className="text-blue-600 text-xs font-black tracking-wide mb-6 uppercase">
                ⚡ 1 audit total
              </p>

              <ul className="space-y-3 text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
                <li className="flex items-center gap-2">✔ Core AEO Score Audit</li>
                <li className="flex items-center gap-2">✔ Robots.txt Directive Check</li>
                <li className="flex items-center gap-2">✔ Basic Crawler Clearance Map</li>
                <li className="text-slate-300 line-through">❌ White-Label Export (.DOCX)</li>
                <li className="text-slate-300 line-through">❌ Custom Brand Colors</li>
              </ul>
            </div>
            
            <div className="mt-8">
              <Link href={userId ? "/dashboard" : "/sign-up"} className="block w-full bg-slate-100 text-slate-700 text-center py-3 rounded-xl font-bold hover:bg-slate-200 transition text-sm cursor-pointer">
                {userId ? "Your Starter Credit" : "Get Started"}
              </Link>
            </div>
          </div>

          {/* 2. STARTER PLAN */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 sm:p-8 shadow-xl shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden">
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1">Starter</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">For Solopreneurs & Bloggers</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-black tracking-tight">$19</span>
                <span className="text-slate-400 font-bold text-sm ml-2">/ month</span>
              </div>
              <p className="text-blue-600 text-xs font-black tracking-wide mb-6 uppercase">
                ⚡ 50 audits / month
              </p>

              <ul className="space-y-3 text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
                <li className="flex items-center gap-2">✔ <strong>Everything in Free</strong></li>
                <li className="flex items-center gap-2">✔ Run audits on any domain</li>
                <li className="flex items-center gap-2">✔ Advanced Semantic Diagnostics</li>
                <li className="text-slate-300 line-through">❌ White-Label Agency Branding</li>
                <li className="text-slate-300 line-through">❌ Custom Brand Colors</li>
              </ul>
            </div>
            
            <div className="mt-8">
              <button className="w-full bg-slate-900 text-white text-center py-3 rounded-xl font-black tracking-wide hover:bg-blue-600 transition text-sm cursor-pointer shadow-md">
                CHOOSE STARTER
              </button>
            </div>
          </div>

          {/* 3. PRO / AGENCY PLAN (POPULAR) */}
          <div className="bg-white border-2 border-blue-600 rounded-[24px] p-6 sm:p-8 shadow-2xl shadow-blue-900/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
              POPULAR
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1 text-slate-900">Pro / Agency</h3>
              <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">Full White-Label Toolkit</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-black tracking-tight text-slate-900">$49</span>
                <span className="text-slate-400 font-bold text-sm ml-2">/ month</span>
              </div>
              <p className="text-blue-600 text-xs font-black tracking-wide mb-6 uppercase">
                ⚡ 200 audits / month
              </p>

              <ul className="space-y-3 text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
                <li className="flex items-center gap-2 text-slate-900">✔ <strong>Everything in Starter</strong></li>
                <li className="flex items-center gap-2">✔ Full White-Label Agency Branding</li>
                <li className="flex items-center gap-2">✔ Custom Brand Color Selection</li>
                <li className="flex items-center gap-2">✔ Unlimited White-Label Exports (.DOCX)</li>
                <li className="flex items-center gap-2">✔ Priority High-Speed Crawling</li>
              </ul>
            </div>
            
            <div className="mt-8">
              <button className="w-full bg-blue-600 text-white text-center py-3 rounded-xl font-black tracking-wide hover:bg-slate-900 transition text-sm cursor-pointer shadow-lg shadow-blue-600/20">
                UPGRADE TO PRO
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/50 py-6 text-center text-xs font-bold text-slate-400 bg-white w-full">
        &copy; {new Date().getFullYear()} AEO Pulse Pro. All rights reserved.
      </footer>

    </div>
  );
}