import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import Navbar from "./components/Navbar";
import HeroLogos from "./components/HeroLogos";
import InteractiveMockup from "./components/InteractiveMockup";
import FeaturesPillars from "./components/FeaturesPillars";
import AiVsManual from "./components/AiVsManual";
import Footer from "./components/Footer";
import WhiteLabelSection from "./components/WhiteLabelSection";
import Testimonials from "./components/Testimonials";

export default async function LandingPage() {
  // Ako je korisnik već prijavljen, automatski ga prebaci na dashboard
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  // 🚀 DODANO: Čist JS objekat sa strukturiranim podacima za aeoaudit-pro.com
 const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.aeoaudit-pro.com/#organization",
        "name": "AEO Audit Pro",
        "url": "https://www.aeoaudit-pro.com",
        "logo": "https://www.aeoaudit-pro.com/logo.png",
        "founder": "Nino Herenda",
      },
      {
        "@type": "WebSite",
        "@id": "https://www.aeoaudit-pro.com/#website",
        "url": "https://www.aeoaudit-pro.com",
        "logo": "https://www.aeoaudit-pro.com/logo.png",
        "name": "AEO Audit Pro",
        "publisher": {
          "@id": "https://www.aeoaudit-pro.com/#organization"
        },
        "knowsAbout": [
          "https://en.wikipedia.org/wiki/Artificial_intelligence",
          "https://en.wikipedia.org/wiki/Search_engine_optimization",
          "https://en.wikipedia.org/wiki/Web_scraping",
          "https://en.wikipedia.org/wiki/Cloudflare"
        ]
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://www.aeoaudit-pro.com/#application",
        "name": "AEO Audit Pro Engine",
        "logo": "https://www.aeoaudit-pro.com/logo.png",
        "operatingSystem": "All",
        "applicationCategory": "BusinessApplication",
        "browserRequirements": "Requires HTML5. Requires JavaScript.",
        "url": "https://www.aeoaudit-pro.com",
        "sameAs": [
          "https://www.wikidata.org/wiki/Q140136146"
        ],
        "offers": [
          {
            "@type": "Offer",
            "name": "Free Plan",
            "price": "0.00",
            "priceCurrency": "USD",
            "category": "FreeTrial",
            "description": "Includes 1 full AI Search readiness audit."
          },
          {
            "@type": "Offer",
            "name": "Starter Plan",
            "price" : "59.00",
            "priceCurrency": "USD",
            "description": "Designed for solo entrepreneurs and bloggers."
          },
          {
            "@type": "Offer",
            "name": "Agency Plan",
            "price" : "159.00",
            "priceCurrency": "USD",
            "description": "Designed for agencies and businesses looking for comprehensive AI Search auditing."
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      
      {/* 🚀 DODANO: Skripta se ubacuje u HTML izvor koda (izvrsno za AI skrapere) */}
      <Script
        id="aeo-homepage-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full bg-slate-900 text-white text-xs sm:text-sm py-2.5 px-4 text-center border-b border-slate-800 relative z-50 flex items-center justify-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-300">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <strong className="text-white font-semibold">Looking for early partners 🤝</strong> 
          We just launched. Build your first few AI Search audits completely free.
        </span>
        <span className="text-blue-400 font-medium">
          Help us test the engine, keep the white-label DOCX reports.
        </span>
        <a 
          href="mailto:hello@aeoaudit-pro.com"
          className="text-blue-400 font-semibold hover:text-blue-300 underline underline-offset-4 transition-colors duration-200"
        >
          Send us an email to get access &rarr;
        </a>
      </div>
        
      {/* ✅ GLOBALNA POZADINSKA MREŽA: Pokriva celu stranicu od vrha do dna */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40" />
      
      {/* Pastelni gradijenti ostaju samo na vrhu za vizuelni akcenat iza teksta */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-r from-blue-500/10 to-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[200px] left-[-100px] w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-[150px] right-[-100px] w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* NAVBAR Component */}
      <Navbar userId={userId} />

      {/* HERO SECTION */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20 flex-1 flex flex-col items-center relative z-10">
        
        {/* FLOATING AI LOGOS Component */}
        <HeroLogos />

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
        <InteractiveMockup />

        {/* THREE CORE PILLARS GRID Component */}
        <FeaturesPillars />

        {/* THE MANUAL PROMPT FALLACY SECTION */}
        <AiVsManual />
        {/*WHITE-LABEL SECTION */}
        <WhiteLabelSection />
      </main>
      
      {/* FOOTER Component */}
      <Footer />
    </div>
  );
}