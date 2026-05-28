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
          
          <div className="text-center mb-12 sm:mb-16 px-2">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
              Simple, Transparent <span className="text-blue-600">Pricing</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-lg max-w-xl mx-auto font-medium leading-relaxed">
              Empower your agency to run advanced semantic diagnostics and sell high-ticket AEO Audits in 30 seconds.
            </p>
          </div>

          {/* PRICING CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 max-w-7xl mx-auto items-stretch w-full px-2 sm:px-0 relative z-10">
            
            {/* 1. FREE PLAN */}
            <div 
              role="region" 
              aria-label="Free Tier Plan - Basic Test Check for 0 dollars"
              className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-xl shadow-blue-900/5 flex flex-col justify-between relative overflow-hidden"
            >
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
                  <li className="flex items-center gap-2">✔ Advanced Semantic Diagnostics</li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">❌ Full White-Label Toolkit</li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">❌ Unlimited .DOCX Document Exports</li>
                  <li className="flex items-center gap-2 text-slate-400 line-through">❌ Custom Brand Color Selection</li>
                </ul>
              </div>
              
              <div className="mt-8">
                <Link 
                  href={userId ? "/dashboard" : "/sign-up"} 
                  aria-label={userId ? "Navigate to your user dashboard" : "Sign up for a free test check account"}
                  className="block w-full bg-slate-100 text-slate-800 hover:text-white text-center py-3 rounded-xl font-black tracking-wide hover:bg-blue-600 transition text-sm cursor-pointer shadow-sm"
                >
                  {userId ? "Go to Dashboard" : "Test for Free"}
                </Link>
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
                "@graph": [
                  {
                    "@type": "Product",
                    "@id": "https://aeoaudit-pro.com/pricing#starter",
                    "name": "AEO Audit Pro - Starter Plan",
                    "description": "Answer Engine Optimization auditing for solopreneurs and bloggers. Includes 50 audits per month and full white-label toolkit.",
                    "brand": {
                      "@type": "Brand",
                      "name": "AEO Audit Pro"
                    },
                    "offers": {
                      "@type": "Offer",
                      "price": "59.00",
                      "priceCurrency": "USD",
                      "availability": "https://schema.org/InStock",
                      "url": "https://aeoaudit-pro.com/pricing"
                    }
                  },
                  {
                    "@type": "Product",
                    "@id": "https://aeoaudit-pro.com/pricing#agency",
                    "name": "AEO Audit Pro - Agency Pro Plan",
                    "description": "High volume Answer Engine Optimization auditing tier for agencies. Includes 200 audits per month, full white-label toolkit, and unlimited document exports.",
                    "brand": {
                      "@type": "Brand",
                      "name": "AEO Audit Pro"
                    },
                    "offers": {
                      "@type": "Offer",
                      "price": "159.00",
                      "priceCurrency": "USD",
                      "availability": "https://schema.org/InStock",
                      "url": "https://aeoaudit-pro.com/pricing"
                    }
                  }
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