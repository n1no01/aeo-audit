import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import Navbar from "../components/Navbar"; 
import Footer from "../components/Footer"; 
import Image from "next/image";

export default async function AboutPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      
      {/* GLOBAL BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col justify-between min-h-screen w-full">
        
        {/* NAVBAR */}
        <Navbar userId={userId} />

        {/* ABOUT US CONTENT SECTION */}
        <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col justify-center relative z-10">
          
          {/* CARD CONTAINER */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-8 sm:p-12 shadow-xl shadow-blue-900/5 w-full relative overflow-hidden">
            
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 leading-tight">
                About <span className="text-blue-600">AEO Audit Pro</span>
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                The Story Behind the Platform
              </p>
            </div>

            <div className="space-y-6 text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
              <p>
                Traditional SEO is changing at a breakneck pace. With the rise of AI-powered search engines—like OpenAI Search, Perplexity, Google Gemini, and Claude—getting found online is no longer just about optimizing for classic keywords. Today, it is about being cited and recommended directly by Large Language Models. This new reality is called <strong>Answer Engine Optimization (AEO)</strong>.
              </p>
              
              <p>
                <strong>AEO Audit Pro</strong> was built out of a direct necessity: to provide modern SEO professionals, agencies, and digital creators with a deep, data-driven diagnostic tool that maps exactly how AI models perceive, parse, and rank their brand content.
              </p>

              {/* FOUNDER SECTION */}
              <div className="border-t border-slate-100 mt-10 pt-10">
                <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Meet the Founder</h2>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-6 rounded-[20px] border border-slate-200/60">
                  {/* AVATAR */}
                  <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0 select-none">
                    <Image src="/Nino.jpeg" alt="Nino Herenda Avatar" width={80} height={80} className="rounded-full object-cover" />
                  </div>
                  
                  <div className="text-center sm:text-left space-y-1.5">
                    <h3 className="font-black text-slate-900 text-lg tracking-tight">Nino Herenda</h3>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Founder & Lead Engineer</p>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium pt-1">
                      Based in Sarajevo, Bosnia and Herzegovina. Building hyper-focused software tools tailored for the next generation of algorithmic search and semantic web intelligence.
                    </p>
                    
                    <div className="pt-3 flex justify-center sm:justify-start">
                      <a 
                        href="https://www.linkedin.com/in/nino-herenda/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-black text-slate-900 hover:text-white border border-slate-200 bg-white px-4 py-2 rounded-xl shadow-sm hover:bg-blue-600 hover:border-blue-600 transition duration-200"
                      >
                        Connect on LinkedIn &rarr;
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* THE CAPITAL BADGE SECTION */}
              <div className="border-t border-slate-100 mt-10 pt-10 flex flex-col items-center text-center space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recognized Excellence</h4>
                <a 
                  href="https://aitoolscapital.com/the-capital?utm_source=capital_badge&utm_medium=embed&utm_campaign=week_2026-06-01&utm_content=aeo-audit-pro" 
                  target="_blank" 
                  rel="noopener nofollow" 
                  title="AEO Audit Pro on The Capital"
                  className="inline-block transition transform hover:scale-[1.02] duration-200"
                >
                  <img 
                    src="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22260%22%20height%3D%2280%22%20viewBox%3D%220%200%20260%2080%22%20role%3D%22img%22%20aria-label%3D%22AEO%20Audit%20Pro%20%E2%80%94%20%231%20ON%20THE%20CAPITAL%22%3E%0A%20%20%3Cdefs%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22bg%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%220%22%20y2%3D%221%22%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%230F172A%22%2F%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%231E293B%22%2F%3E%0A%20%20%20%20%3C%2FlinearGradient%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22ring%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%221%22%20y2%3D%221%22%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23FFD86B%22%2F%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23B8860B%22%2F%3E%0A%20%20%20%20%3C%2FlinearGradient%3E%0A%20%20%3C%2Fdefs%3E%0A%20%20%3Crect%20width%3D%22260%22%20height%3D%2280%22%20rx%3D%2212%22%20fill%3D%22url(%23bg)%22%20stroke%3D%22%23F5C242%22%20stroke-opacity%3D%220.5%22%2F%3E%0A%20%20%3Cg%20transform%3D%22translate(14%2C14)%22%3E%0A%20%20%20%20%3Crect%20width%3D%2252%22%20height%3D%2252%22%20rx%3D%2210%22%20fill%3D%22url(%23ring)%22%2F%3E%0A%20%20%20%20%3Ctext%20x%3D%2226%22%20y%3D%2236%22%20text-anchor%3D%22middle%22%20font-family%3D%22-apple-system%2CSegoe%20UI%2CRoboto%2Csans-serif%22%20font-size%3D%2226%22%20font-weight%3D%22800%22%20fill%3D%22%230F172A%22%3E%231%3C%2Ftext%3E%0A%20%20%3C%2Fg%3E%0A%20%20%3Cg%20transform%3D%22translate(80%2C22)%22%3E%0A%20%20%20%20%3Ctext%20font-family%3D%22-apple-system%2CSegoe%20UI%2CRoboto%2Csans-serif%22%20font-size%3D%229%22%20font-weight%3D%22700%22%20fill%3D%22%23FFD86B%22%20letter-spacing%3D%221.2%22%3E%231%20ON%20THE%20CAPITAL%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20y%3D%2218%22%20font-family%3D%22-apple-system%2CSegoe%20UI%2CRoboto%2Csans-serif%22%20font-size%3D%2213%22%20font-weight%3D%22700%22%20fill%3D%22%23F8FAFC%22%3E%231%20ai-business%3C%2Ftext%3E%0A%20%20%20%20%3Ctext%20y%3D%2234%22%20font-family%3D%22-apple-system%2CSegoe%20UI%2CRoboto%2Csans-serif%22%20font-size%3D%2210%22%20fill%3D%22%2394A3B8%22%3Eaitoolscapital.com%20%2F%20The%20Capital%3C%2Ftext%3E%0A%20%20%3C%2Fg%3E%0A%3C%2Fsvg%3E" 
                    alt="AEO Audit Pro — #1 ON THE CAPITAL" 
                    width={260} 
                    height={80} 
                    loading="lazy" 
                  />
                </a>
              </div>

              <p className="text-xs text-slate-400 text-center pt-8 border-t border-slate-50">
                Have questions or want to discuss enterprise AEO frameworks? Reach out directly at <span className="text-slate-700 font-bold">hello@aeoaudit-pro.com</span>.
              </p>
            </div>

          </div>

          {/* 🚀 SEO STRUCTURED DATA (JSON-LD Grounding) */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "AboutPage",
                    "@id": "https://aeoaudit-pro.com/about",
                    "url": "https://aeoaudit-pro.com/about",
                    "name": "About AEO Audit Pro",
                    "description": "Learn more about AEO Audit Pro, the Answer Engine Optimization diagnostic toolkit built for agencies and modern SEO professionals.",
                    "mainEntity": {
                      "@type": "Person",
                      "name": "Nino Herenda",
                      "jobTitle": "Founder & Lead Engineer",
                      "address": {
                        "@type": "PostalAddress",
                        "addressLocality": "Sarajevo",
                        "addressCountry": "BA"
                      }
                    }
                  }
                ]
              })
            }
          }
          />
        </main>

        {/* FOOTER */}
        <Footer />

      </div>
    </div>
  );
}