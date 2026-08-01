import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { CheckoutButton } from "./CheckoutButton";
import Navbar from "../components/Navbar"; 
import Footer from "../components/Footer"; 

export default async function PricingPage() {
  const { userId } = await auth();
  const user = await currentUser();
  const userEmail = user?.emailAddresses[0]?.emailAddress || "";

  // ID-jevi planova iz .env fajla
  const SINGLE_AUDIT_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_SINGLE_AUDIT_PRODUCT_ID!;
  const STARTER_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_STARTER_PLAN_ID!;
  const AGENCY_PRODUCT_ID = process.env.NEXT_PUBLIC_DODO_AGENCY_PLAN_ID!;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      
      {/* GLOBAL BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col justify-between min-h-screen w-full">
        
        {/* NAVBAR */}
        <Navbar userId={userId} />

        {/* PRICING CONTENT SECTION */}
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center items-center relative z-10">
          
          <div className="text-center mb-8 sm:mb-12 px-2 flex flex-col items-center">
            {/* 🎁 FREE CREDIT BANNER */}
            <div className="mb-6 inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 text-blue-900 px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-sm">
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
              <span>New here? Get <strong className="font-extrabold text-blue-600">1 FREE Audit</strong> automatically upon sign up — no credit card needed!</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
              Simple, Transparent <span className="text-blue-600">Pricing</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-lg max-w-xl mx-auto font-medium leading-relaxed">
              Empower your agency to run advanced semantic diagnostics, map brand entities, and sell high-ticket AEO Audits in 30 seconds.
            </p>
          </div>

          {/* PRICING CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 max-w-7xl mx-auto items-stretch w-full px-2 sm:px-0 relative z-10">
            
            {/* 1. SINGLE AUDIT (PAY-AS-YOU-GO) */}
            <div 
              role="region" 
              aria-label="Single Audit Credit - One time check for 5 dollars"
              className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-xl shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <h3 className="text-xl font-black tracking-tight mb-1">Single Audit</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">Pay As You Go</p>
                
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-black tracking-tight">$5</span>
                  <span className="text-slate-400 font-bold text-sm ml-2">/ 1 credit</span>
                </div>
                <div className="text-blue-600 text-xs font-black tracking-wide mb-6 uppercase space-y-1">
                  <p>⚡ +1 audit credit</p>
                  <p>⚡ Instant account top-up</p>
                </div>

                <ul className="space-y-3 text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Full Single Audit Report</strong></li>
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Entity Checker</strong></li>
                  <li className="flex items-center gap-2 text-slate-900">✔ Advanced Semantic Diagnostics</li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">❌ Monthly Subscription</li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">❌ AI Radar Tracking</li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">❌ Full White-Label Toolkit</li>
                </ul>
              </div>
              
              <div className="mt-8">
                {userId ? (
                  <CheckoutButton 
                    productId={SINGLE_AUDIT_PRODUCT_ID}
                    userId={userId}
                    userEmail={userEmail}
                    text="BUY 1 AUDIT ($5)"
                    aria-label="Purchase single audit credit for 5 dollars"
                    className="block w-full bg-slate-900 text-white text-center py-3 rounded-xl font-black tracking-wide hover:bg-blue-600 transition text-sm cursor-pointer shadow-md"
                  />
                ) : (
                  <Link 
                    href="/sign-up" 
                    aria-label="Sign up to get 1 free audit credit"
                    className="block w-full bg-blue-600 text-white hover:bg-slate-900 text-center py-3 rounded-xl font-black tracking-wide transition text-sm cursor-pointer shadow-md"
                  >
                    CLAIM FREE AUDIT
                  </Link>
                )}
              </div>
            </div>

            {/* 2. STARTER PLAN */}
            <div 
              role="region" 
              aria-label="Starter Plan - For Solopreneurs and Bloggers at 59 dollars per month"
              className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-xl shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <h3 className="text-xl font-black tracking-tight mb-1">Starter</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">For Solopreneurs & Bloggers</p>
                
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-black tracking-tight">$59</span>
                  <span className="text-slate-400 font-bold text-sm ml-2">/ month</span>
                </div>
                <div className="text-blue-600 text-xs font-black tracking-wide mb-6 uppercase space-y-1">
                  <p>⚡ 50 audits / month</p>
                  <p>⚡ 100 radar scans / month</p>
                </div>

                <ul className="space-y-3 text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Entity Checker</strong></li>
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">AI Radar Tracking</strong></li>
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Lead Magnet</strong></li>
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Full White-Label Toolkit</strong></li>
                  <li className="flex items-center gap-2">✔ Advanced Semantic Diagnostics</li>
                  <li className="flex items-center gap-2">✔ Unlimited .DOCX Document Exports</li>
                </ul>
              </div>
              
              <div className="mt-8">
                <CheckoutButton 
                  productId={STARTER_PRODUCT_ID}
                  userId={userId}
                  userEmail={userEmail}
                  text="CHOOSE STARTER"
                  aria-label="Purchase Starter subscription plan for 59 dollars per month"
                  className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-black tracking-wide hover:bg-slate-900 transition text-sm cursor-pointer shadow-md"
                />
              </div>
            </div>

            {/* 3. PRO / AGENCY PLAN (POPULAR) */}
            <div 
              role="region" 
              aria-label="Agency Pro Plan - High Volume Agency tier at 159 dollars per month. Most Popular choice."
              className="bg-white border-2 border-blue-600 rounded-[24px] p-6 shadow-2xl shadow-blue-900/10 flex flex-col justify-between relative overflow-hidden mt-0"
            >
              <div 
                role="status"
                aria-label="Most popular subscription choice"
                className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl"
              >
                POPULAR
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight mb-1 text-slate-900">Agency</h3>
                <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">High Volume Agency</p>
                
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-black tracking-tight text-slate-900">$159</span>
                  <span className="text-slate-400 font-bold text-sm ml-2">/ month</span>
                </div>
                <div className="text-blue-600 text-xs font-black tracking-wide mb-6 uppercase space-y-1">
                  <p>⚡ 200 audits / month</p>
                  <p>⚡ 500 radar scans / month</p>
                </div>

                <ul className="space-y-3 text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Entity Checker</strong></li>
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">AI Radar Tracking</strong></li>
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Lead Magnet</strong></li>
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Full White-Label Toolkit</strong></li>
                  <li className="flex items-center gap-2">✔ Advanced Semantic Diagnostics</li>
                  <li className="flex items-center gap-2">✔ Unlimited .DOCX Document Exports</li>
                </ul>
              </div>
              
              <div className="mt-8">
                <CheckoutButton 
                  productId={AGENCY_PRODUCT_ID}
                  userId={userId}
                  userEmail={userEmail}
                  text="UPGRADE TO PRO"
                  aria-label="Purchase Agency Pro subscription plan for 159 dollars per month"
                  className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-black tracking-wide hover:bg-slate-900 transition text-sm cursor-pointer shadow-lg"
                />
              </div>
            </div>

            {/* 4. ENTERPRISE PLAN */}
            <div 
              role="region" 
              aria-label="Enterprise Plan - Custom high-volume packages for teams"
              className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-xl shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <h3 className="text-xl font-black tracking-tight mb-1 text-slate-900">Enterprise</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">For High-Volume Teams</p>
                
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-black tracking-tight text-slate-900">Custom</span>
                </div>
                <div className="text-blue-600 text-xs font-black tracking-wide mb-6 uppercase space-y-1">
                  <p>⚡ 500+ audits / month</p>
                  <p>⚡ 1000+ radar scans / month</p>
                </div>

                <ul className="space-y-3 text-sm font-medium text-slate-600 border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Entity Checker</strong></li>
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">AI Radar Tracking</strong></li>
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Lead Magnet</strong></li>
                  <li className="flex items-center gap-2 text-slate-900">✔ <strong className="font-bold">Full White-Label Toolkit</strong></li>
                  <li className="flex items-center gap-2">✔ Advanced Semantic Diagnostics</li>
                  <li className="flex items-center gap-2">✔ Unlimited .DOCX Document Exports</li>
                </ul>
              </div>
              
              <div className="mt-8">
                <a 
                  href="mailto:hello@aeoaudit-pro.com?subject=Enterprise Custom Package Inquiry" 
                  aria-label="Contact our sales team via email for a custom high-volume Enterprise package"
                  className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-black tracking-wide hover:bg-slate-900 transition text-sm cursor-pointer shadow-lg"
                >
                  CONTACT SALES
                </a>
              </div>
            </div>

          </div>

          {/* 🚀 AI PRODUCT GRAPH SUBSETS (JSON-LD Grounding) */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "@id": "https://aeoaudit-pro.com/pricing#application",
                "name": "AEO Audit Pro",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "url": "https://aeoaudit-pro.com",
                "description":
                  "AEO Audit Pro helps businesses and agencies improve visibility in AI search engines through semantic diagnostics, entity analysis, AI crawler audits, and knowledge graph optimization.",
                "provider": {
                  "@type": "Organization",
                  "name": "AEO Audit Pro",
                  "url": "https://aeoaudit-pro.com"
                },
                "offers": [
                  {
                    "@type": "Offer",
                    "name": "Single Audit Credit",
                    "price": "5.00",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock",
                    "url": "https://aeoaudit-pro.com/pricing"
                  },
                  {
                    "@type": "Offer",
                    "name": "Starter Plan",
                    "price": "59.00",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock",
                    "url": "https://aeoaudit-pro.com/pricing"
                  },
                  {
                    "@type": "Offer",
                    "name": "Agency Plan",
                    "price": "159.00",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock",
                    "url": "https://aeoaudit-pro.com/pricing"
                  }
                ],
                "featureList": [
                  "Entity Checker",
                  "AI Radar Tracking",
                  "Lead Magnet",
                  "Advanced Semantic Diagnostics",
                  "White-Label Toolkit",
                  "DOCX Report Exports"
                ]
              })
            }}
          />
        </main>

        {/* FOOTER */}
        <Footer />

      </div>
    </div>
  );
}