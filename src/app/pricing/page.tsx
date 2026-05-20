import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

export default async function PricingPage() {
  const { userId } = await auth();

  // 💡 Ovdje unesi svoje prave Lemon Squeezy testne linkove kada kreiraš proizvode
  const LEMON_SQUEEZY_STARTER_URL = "https://aeoauditpro.lemonsqueezy.com/checkout/buy/starter-id?embed=1";
  const LEMON_SQUEEZY_PRO_URL = "https://aeoauditpro.lemonsqueezy.com/checkout/buy/pro-id?embed=1";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      
      {/* NAVBAR */}
      <nav className="w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent">
        <Link href={userId ? "/dashboard" : "/"} className="group cursor-pointer select-none">
          <div className="text-2xl font-black tracking-tight italic">
            AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200">Audit</span> Pro
          </div>
        </Link>
        
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <Link href="/how-it-works" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">
            How It Works
          </Link>
          <Link href="/pricing" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">
            Pricing
          </Link>
          {!userId ? (
            <>
              <Link href="/sign-in" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">
                Sign In
              </Link>
              <Link href="/sign-up" className="bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-blue-600 transition shadow-sm">
                Get Started
              </Link>
            </>
          ) : (
            <Link href="/dashboard" className="bg-blue-600 text-white text-xs sm:text-sm font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-slate-900 transition shadow-sm">
              Go to Dashboard
            </Link>
          )}
        </div>
      </nav>

      {/* PRICING CONTENT SECTION */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center items-center">
        
        <div className="text-center mb-12 sm:mb-16 px-2">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
            Simple, Transparent <span className="text-blue-600">Pricing</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-lg max-w-xl mx-auto font-medium leading-relaxed">
            Empower your agency to run advanced semantic diagnostics and sell high-ticket AEO Audits in 30 seconds.
          </p>
        </div>

        {/* PRICING CARDS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 max-w-7xl mx-auto items-stretch w-full px-2 sm:px-0">
          
          {/* 1. FREE PLAN */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-xl shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden">
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
                <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Full White-Label Toolkit</strong></li>
                <li className="flex items-center gap-2">✔ Advanced Semantic Diagnostics</li>
                <li className="flex items-center gap-2">✔ Unlimited .DOCX Document Exports</li>
                <li className="flex items-center gap-2">✔ Custom Brand Color Selection</li>
              </ul>
            </div>
            
            <div className="mt-8">
              <Link href={userId ? "/dashboard" : "/sign-up"} className="block w-full bg-slate-900 text-white text-center py-3 rounded-xl font-black tracking-wide hover:bg-blue-600 transition text-sm cursor-pointer shadow-md">
                {userId ? "Your Starter Credit" : "Get Started"}
              </Link>
            </div>
          </div>

          {/* 2. STARTER PLAN */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-xl shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden">
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1">Starter</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">For Solopreneurs & Bloggers</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-black tracking-tight">$59</span>
                <span className="text-slate-400 font-bold text-sm ml-2">/ month</span>
              </div>
              <p className="text-blue-600 text-xs font-black tracking-wide mb-6 uppercase">
                ⚡ 50 audits / month
              </p>

              <ul className="space-y-3 text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
                <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Full White-Label Toolkit</strong></li>
                <li className="flex items-center gap-2">✔ Advanced Semantic Diagnostics</li>
                <li className="flex items-center gap-2">✔ Unlimited .DOCX Document Exports</li>
                <li className="flex items-center gap-2">✔ Custom Brand Color Selection</li>
              </ul>
            </div>
            
            <div className="mt-8">
              <Link 
                href={userId ? LEMON_SQUEEZY_STARTER_URL : "/sign-up?redirect_url=/pricing"} 
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-black tracking-wide hover:bg-slate-900 transition text-sm cursor-pointer shadow-md"
              >
                CHOOSE STARTER
              </Link>
            </div>
          </div>

          {/* 3. PRO / AGENCY PLAN (POPULAR) */}
          <div className="bg-white border-2 border-blue-600 rounded-[24px] p-6 shadow-2xl shadow-blue-900/10 flex flex-col justify-between relative overflow-hidden mt-0">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
              POPULAR
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight mb-1 text-slate-900">Agency Pro</h3>
              <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">High Volume Agency</p>
              
              <div className="flex items-baseline mb-2">
                <span className="text-4xl font-black tracking-tight text-slate-900">$159</span>
                <span className="text-slate-400 font-bold text-sm ml-2">/ month</span>
              </div>
              <p className="text-blue-600 text-xs font-black tracking-wide mb-6 uppercase">
                ⚡ 200 audits / month
              </p>

              <ul className="space-y-3 text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
                <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Full White-Label Toolkit</strong></li>
                <li className="flex items-center gap-2">✔ Advanced Semantic Diagnostics</li>
                <li className="flex items-center gap-2">✔ Unlimited .DOCX Document Exports</li>
                <li className="flex items-center gap-2">✔ Custom Brand Color Selection</li>
              </ul>
            </div>
            
            <div className="mt-8">
              <Link 
                href={userId ? LEMON_SQUEEZY_PRO_URL : "/sign-up?redirect_url=/pricing"} 
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-black tracking-wide hover:bg-slate-900 transition text-sm cursor-pointer shadow-lg"
              >
                UPGRADE TO PRO
              </Link>
            </div>
          </div>

          {/* 4. ENTERPRISE PLAN */}
         {/* 4. ENTERPRISE PLAN */}
<div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-xl shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden">
  <div>
    <h3 className="text-xl font-black tracking-tight mb-1 text-slate-900">Enterprise</h3>
    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">For High-Volume Teams</p>
    
    <div className="flex items-baseline mb-2">
      <span className="text-4xl font-black tracking-tight text-slate-900">Custom</span>
    </div>
    <p className="text-blue-600 text-xs font-black tracking-wide mb-6 uppercase">
      ⚡ 1000+ audits / month
    </p>

    <ul className="space-y-3 text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
      <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Full White-Label Toolkit</strong></li>
      <li className="flex items-center gap-2">✔ Advanced Semantic Diagnostics</li>
      <li className="flex items-center gap-2">✔ Unlimited .DOCX Document Exports</li>
      <li className="flex items-center gap-2">✔ Custom Brand Color Selection</li>


    </ul>
  </div>
            
            <div className="mt-8">
              <a 
                href="mailto:hello@aeoaudit-pro.com?subject=Enterprise Custom Package Inquiry" 
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-black tracking-wide hover:bg-slate-900 transition text-sm cursor-pointer shadow-lg"
              >
                CONTACT SALES
              </a>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/50 py-6 text-center text-xs font-bold text-slate-400 bg-white w-full px-4 leading-relaxed mt-12">
        <div>&copy; 2026 AEO Audit Pro. All rights reserved.</div>
        <div className="mt-1 text-slate-400/80">
          📬 For enterprise inquiries or support:{" "}
          <a 
            href="mailto:hello@aeoaudit-pro.com?subject=AEO Audit Pro Inquiry" 
            className="text-blue-600/80 hover:text-blue-600 transition-colors underline decoration-blue-500/20"
          >
            hello@aeoaudit-pro.com
          </a>
        </div>
      </footer>

    </div>
  );
}