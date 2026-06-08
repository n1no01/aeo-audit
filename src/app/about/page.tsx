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
               <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-md shrink-0 select-none overflow-hidden">
                <Image 
                  src="/Nino.jpeg" 
                  alt="Nino Herenda Avatar" 
                  width={80} 
                  height={80} 
                  className="rounded-full object-cover scale-125" 
                  />
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