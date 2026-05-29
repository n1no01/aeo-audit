import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import Navbar from "../components/Navbar"; 
import Footer from "../components/Footer"; 

export default async function HowItWorksPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      
      {/* ✅ GLOBAL BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-full blur-[100px] pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col justify-between min-h-screen w-full">
        
        {/* NAVBAR */}
        <Navbar userId={userId} />

        {/* MAIN CONTENT CONTAINER */}
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center items-center relative z-10">
          
          {/* HEADLINE & SUBHEADLINE */}
          <div className="text-center mb-12 sm:mb-16 px-2">
            <div className="inline-block px-4 py-2 mb-5 rounded-full bg-blue-50 border border-blue-100">
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-600">Engine Architecture & Diagnostics</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
              What Our Engine <span className="text-blue-600">Audits</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-lg max-w-3xl mx-auto font-medium leading-relaxed">
              When you enter a URL, AEO Audit Pro triggers an advanced multi-tier cryptographic and semantic sweep. Here is the exact architectural data map our engine extracts, evaluates, and playbooks.
            </p>
          </div>

          {/* SECTION 1: CORE TECHNICAL METRICS */}
          <div className="w-full mb-12 sm:mb-16 px-2 sm:px-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-6 bg-slate-900 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">01 / Technical & Crawlability Directives</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* AI Search Crawler Status */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-3">
                <h3 className="text-lg font-black tracking-tight text-slate-900">AI Search Crawler Verification</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  The engine parses your root <code className="font-semibold text-slate-700">robots.txt</code> strings and simulates localized target user-agents. It tests precise clearance vectors for ChatGPT (GPTBot), OpenAI Search, PerplexityBot, ClaudeBot, Google-Extended, DeepSeek, AppleBot-Extended, Bingbot, and Cohere AI.
                </p>
              </div>

              {/* Brand Disambiguation */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-3">
                <h3 className="text-lg font-black tracking-tight text-slate-900">AEO Tokenizer Brand Disambiguation</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Extracts identity strings across your code contexts. The engine detects core brand name variants to verify if your identity vector is structured consistently, preventing neural network text tokenizers from creating identity clashes in the global knowledge graph.
                </p>
              </div>

              {/* JS Rendering Index */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-3">
                <h3 className="text-lg font-black tracking-tight text-slate-900">JS Rendering Dependency Index</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Evaluates whether your page layer relies on Client-Side Rendering (CSR) hydration or Server-Side Rendering (SSR). High JS dependency flags a critical timeout risk, as asynchronous web scraping pipelines often skip heavy client frameworks due to processing budgets.
                </p>
              </div>

              {/* Entity Trust Map */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-3">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Knowledge Graph & Authority Links</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Scans raw code loops for official entity links. It verifies outward authority reference integrations (Wikipedia and Wikidata nodes) alongside structured anchor profile connections across LinkedIn, X (Twitter), Facebook, and NAP physical coordinates.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: SEMANTIC LAYOUT & MULTIMODAL OVERLAYS */}
          <div className="w-full mb-12 sm:mb-16 px-2 sm:px-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-6 bg-slate-900 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">02 / Structural Anatomy & Multimodal Elements</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {/* HTML5 Tag Isolation */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-2">
                <h3 className="text-base font-black tracking-tight text-slate-900">Semantic Layout Isolation</h3>
                <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                  Verifies the encapsulation of the HTML5 <code className="font-semibold text-slate-700">&lt;main&gt;</code> tag and <code className="font-semibold text-slate-700">&lt;article&gt;</code> block architecture. This isolates core page content from global site wrappers like sidebars or menus.
                </p>
              </div>

              {/* Heading Cascade */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-2">
                <h3 className="text-base font-black tracking-tight text-slate-900">Heading Cascade Leaps</h3>
                <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                  Audits heading tag sequential lines. Catches layout anomalies (e.g., jumping from an `H1` straight to an `H3`). Healthy cascade structures prevent context calculation failure during RAG window steps.
                </p>
              </div>

              {/* Autonomous AI Agents */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-2">
                <h3 className="text-base font-black tracking-tight text-slate-900">Autonomous Agent Readiness</h3>
                <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                  Scans semantic layouts for proper ARIA tree attributes and button tracking configurations. This measures how easily browser-based autonomous AI agents can interact with, read, and process your transactional elements.
                </p>
              </div>
            </div>

            {/* Multimodal & Schema Grid Overlay below */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 w-full">
              {/* Multimodal Image & Video */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-3">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Multimodal Alt Coverage & Visual RAG</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Extracts absolute image elements and calculates missing description fractions while verifying embedded responsive video modules. Multimodal neural architectures (like GPT-4o) depend on these variables to synthesize layout images into rich chat answers.
                </p>
              </div>

              {/* Deep Schema Subsets */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-3">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Deep Schema Graph Subsets</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Extracts active JSON-LD layers like Product, Article, or LocalBusiness. The engine validates mandatory deep subsets (e.g., `offers`, `brand`, or geographical coordinates) utilized by LLM grounding algorithms to rank commerce links.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: LLM READING COMPETENCY (THE 5 PILLARS) */}
          <div className="w-full text-center mb-12 sm:mb-16 px-2 sm:px-0">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-2 h-6 bg-blue-600 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">03 / LLM Reading Competency (The 5 Pillars of AEO)</h3>
            </div>
            
            <p className="text-slate-500 text-sm font-medium max-w-3xl mx-auto mb-8 leading-relaxed px-2">
              Our analyzer processes text arrays exactly like an advanced transformer model, assigning an executive performance grade across the 5 core pillars of next-generation digital writing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 text-left max-w-6xl mx-auto mb-10">
              <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-1.5">
                <div className="text-blue-600 font-black text-xs uppercase tracking-wider">1. BLUFF Alignment</div>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">Measures if key claims are stated upfront in header blocks or hidden deep within introduction prose.</p>
              </div>
              <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-1.5">
                <div className="text-blue-600 font-black text-xs uppercase tracking-wider">2. RAG Chunking</div>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">Checks if text blocks are completely self-contained and logical when isolated into standalone vectors.</p>
              </div>
              <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-1.5">
                <div className="text-blue-600 font-black text-xs uppercase tracking-wider">3. Entity Density</div>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">Tracks the deployment of concrete data points, numbers, and brand terms versus generic fluff words.</p>
              </div>
              <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-1.5">
                <div className="text-blue-600 font-black text-xs uppercase tracking-wider">4. Syntactic Speed</div>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">Favors clear Subject-Verb-Object sentence structures that optimize token processing speeds.</p>
              </div>
              <div className="bg-white border rounded-2xl p-4 shadow-sm space-y-1.5 bg-slate-900 border-slate-900 text-white">
                <div className="text-amber-400 font-black text-xs uppercase tracking-wider">5. Non-Commodity</div>
                <p className="text-[11px] text-slate-500 leading-normal font-medium">Verifies if text contains first-hand expertise or proprietary data that cannot be generated by simple automated scrapers.</p>
              </div>
            </div>

            <div className="max-w-4xl mx-auto border border-slate-200/80 rounded-2xl overflow-hidden shadow-xl bg-white p-1 sm:p-2">
              <Image 
                src="/core-pilars.jpg" 
                alt="AEO Audit Pro Core Pillars Dashboard UI View" 
                width={900} 
                height={400}
                className="w-full h-auto rounded-xl border object-cover"
                priority
              />
            </div>
          </div>

          {/* SECTION 4: AI SERP SIMULATOR & ACTIONABLE OUTPUTS */}
          <div className="w-full mb-12 sm:mb-16 space-y-4 px-2 sm:px-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-slate-900 rounded-full" />
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">04 / Conversational AI SERP Simulator</h2>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 sm:p-8 shadow-xl shadow-blue-900/5 space-y-4">
              <h3 className="text-xl font-black tracking-tight text-slate-900">Real-Time Behavioral Block Tokenization</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Our advanced AI SERP Simulator emulates an active conversational search interface. It slices your target landing page row-by-row into independent blocks (Block #1, Block #2), assessing entity density, syntax simplicity, and non-commodity parameters in real time. It visually maps high-citation potential graph nodes against sectors vulnerable to filter suppression or automated link-stripping.
              </p>
            </div>
          </div>

          {/* STRATEGIC OUTPUT SUMMARY */}
          <section className="border-t border-slate-200/60 pt-12 sm:pt-16 w-full mb-6 px-2 sm:px-0">
            <div className="text-center mb-10 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Actionable Diagnostics & Deliverables</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-blue-900/5 space-y-2">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide text-blue-600">1. Executive LLM Diagnostics</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">Generates a multi-paragraph executive summary detailing how transformer models compress, index, and surface your industry authority vectors.</p>
              </div>
              <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-blue-900/5 space-y-2">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide text-blue-600">2. Prioritized Playbook</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">Delivers exactly 5 high-impact, actionable recommendations tailored specifically to your node niche category to quickly boost citation footprint ratios.</p>
              </div>
              <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-blue-900/5 space-y-2">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide text-blue-600">3. White-Label Executive DOCX</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">Premium tiers can completely override brand names, hex colors, compiler author profiles, and logos to export clean corporate reports directly to clients.</p>
              </div>
            </div>
          </section>

        </main>

        {/* FOOTER */}
        <Footer />

      </div>
    </div>
  );
}