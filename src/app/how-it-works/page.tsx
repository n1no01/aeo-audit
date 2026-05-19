import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";

export default async function HowItWorksPage() {
  const { userId } = await auth();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      
      {/* NAVBAR - FULLY RESPONSIVE */}
      <nav className="w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent">
        <Link href={userId ? "/dashboard" : "/"} className="group cursor-pointer select-none">
          <div className="text-2xl font-black tracking-tight italic">
            AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200">Pulse</span> Pro
          </div>
        </Link>
        
        {/* Nav Links - Responsive wrapping */}
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

      {/* MAIN CONTENT CONTAINER */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 flex flex-col justify-center items-center">
        
        {/* HEADLINE & SUBHEADLINE */}
        <div className="text-center mb-12 sm:mb-16 px-2">
          <div className="inline-block px-4 py-2 mb-5 rounded-full bg-blue-50 border border-blue-100">
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-blue-600">Engine Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
            What Our Engine <span className="text-blue-600">Audits</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            When you enter a URL, AEO Pulse Pro triggers a deep technical, semantic, and LLM readability sweep. Here is the exact data map our application extracts and refines.
          </p>
        </div>

        {/* SECTION 1: CORE TECHNICAL METRICS */}
        <div className="w-full mb-12 sm:mb-16 px-2 sm:px-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-slate-900 rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">01 / Technical & Crawlability Metrics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* AI Search Crawler Status */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-3">
              <h3 className="text-lg font-black tracking-tight text-slate-900">AI Search Crawler Status</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We read your raw <code className="font-semibold text-slate-700">robots.txt</code> direct blocking strings. The engine simulates target headers to verify if bots like ChatGPT (GPTBot), OpenAI Search, Perplexity, ClaudeBot, Gemini Extended, and Cohere AI can access your content.
              </p>
            </div>

            {/* Brand Disambiguation */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-3">
              <h3 className="text-lg font-black tracking-tight text-slate-900">AEO Tokenizer Brand Disambiguation</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Our parser extracts raw brand variants across your code contexts. We check if your identity strings are structurally consistent, ensuring LLM text tokenizers can map your exact company name globally without identity clashes.
              </p>
            </div>

            {/* Knowledge Graph Blueprint */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-3">
              <h3 className="text-lg font-black tracking-tight text-slate-900">Knowledge Graph & Authority Links</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We scan your code for verified entity connections. The engine looks for authority reference outlinks (Wikipedia/Wikidata) and validates trusted social anchor integrations across LinkedIn, X (Twitter), Facebook, and local NAP coordinates.
              </p>
            </div>

            {/* Semantic Layout Map */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-3">
              <h3 className="text-lg font-black tracking-tight text-slate-900">HTML5 Semantic Hierarchy & Leaps</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                We map your core semantic architecture. The tool verifies the isolation of the HTML5 <code className="font-semibold text-slate-700">&lt;main&gt;</code> tag, checks for proper <code className="font-semibold text-slate-700">&lt;article&gt;</code> containers, and catches bad heading leaps (e.g., skipping from an H1 straight to an H3), which cause cascade failures for AI models.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: DENSITY & MULTIMODAL OVERLAYS */}
        <div className="w-full mb-12 sm:mb-16 px-2 sm:px-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-6 bg-slate-900 rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">02 / Content Density & Multimodal Elements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {/* Word Count */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-2">
              <h3 className="text-base font-black tracking-tight text-slate-900">Word Count Analysis</h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                Calculates total text volume. Studies show 53.4% of AI answers prefer concise data packages over overly long, fluff-heavy guides.
              </p>
            </div>

            {/* Q&A Loops */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-2">
              <h3 className="text-base font-black tracking-tight text-slate-900">Conversational Q&A Loops</h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                We count explicit Question-and-Answer formatting blocks. High conversational query loops provide clear matches for user text queries.
              </p>
            </div>

            {/* Layout Density */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 space-y-2">
              <h3 className="text-base font-black tracking-tight text-slate-900">Semantic Layout Density</h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                Checks for table layouts or bulleted graphs. Chatbots heavily rely on lists and tabular grids, which make up 43.8% of ChatGPT citations.
              </p>
            </div>
          </div>

          {/* Multimodal Card below the grid */}
          <div className="bg-white border border-slate-200 rounded-[24px] p-5 sm:p-6 shadow-xl shadow-blue-900/5 mt-6 w-full space-y-3">
            <h3 className="text-lg font-black tracking-tight text-slate-900">Multimodal Image Alt Coverage</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              We extract every image element on the page and calculate the exact ratio of missing descriptions (<code className="font-semibold text-slate-700">alt</code> tags). Multimodal AI models (like GPT-4o) need descriptive alt text to cleanly grab and show your images inside rich chat replies.
            </p>
          </div>
        </div>

        {/* SECTION 3: ADVANCED CONTENT PILLARS (THE GRAPHIC) */}
        <div className="w-full text-center mb-12 sm:mb-16 px-2 sm:px-0">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-2 h-6 bg-blue-600 rounded-full" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">03 / LLM Reading Competency (AEO Content Pillars)</h3>
          </div>
          
          <p className="text-slate-500 text-sm font-medium max-w-3xl mx-auto mb-8 leading-relaxed px-2">
            Finally, our advanced AI integration reads your text context exactly like an LLM model would, grading your content across the **4 Core Pillars of AEO Writing** to eliminate AI knowledge flattening risk.
          </p>

          <div className="max-w-4xl mx-auto border border-slate-200/80 rounded-2xl overflow-hidden shadow-xl bg-white p-1 sm:p-2">
            <Image 
              src="/core-pilars.jpg" 
              alt="AEO Pulse Pro Core Pillars Dashboard UI View" 
              width={900} 
              height={400}
              className="w-full h-auto rounded-xl border object-cover"
              priority
            />
          </div>
        </div>

        {/* METADATA SUMMARY CARDS */}
        <div className="w-full mb-12 sm:mb-16 space-y-4 px-2 sm:px-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-6 bg-slate-900 rounded-full" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">04 / Core Tag Extraction Matrix</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div className="p-5 bg-white border rounded-2xl shadow-sm"><div className="text-[10px] uppercase font-black text-slate-400 mb-1">Meta Title</div><p className="text-xs font-bold text-slate-700">Extracted and evaluated for correct token lengths.</p></div>
            <div className="p-5 bg-white border rounded-2xl shadow-sm"><div className="text-[10px] uppercase font-black text-slate-400 mb-1">Meta Description</div><p className="text-xs font-bold text-slate-700">Audited for contextual richness and keyword tokens.</p></div>
            <div className="p-5 bg-white border rounded-2xl shadow-sm"><div className="text-[10px] uppercase font-black text-slate-400 mb-1">Primary H1 Anchor</div><p className="text-xs font-bold text-slate-700">Checked for single-instance compliance and topic clarity.</p></div>
          </div>
        </div>

        {/* STRATEGIC OUTPUT SUMMARY */}
        <section className="border-t border-slate-200/60 pt-12 sm:pt-16 w-full mb-6 px-2 sm:px-0">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Actionable Diagnostics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full">
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-blue-900/5 space-y-2">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Executive LLM Diagnostics</h3>
              <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">Our engine builds a professional 3-paragraph executive audit evaluating how modern neural networks tokenize, compress, and perceive your business niche and raw brand entity values.</p>
            </div>
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-blue-900/5 space-y-2">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Prioritized Optimization Playbook</h3>
              <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">Generates exactly 5 prioritized, tactical recommendations. These adjustments are hyper-targeted to your page category (Local Business, E-commerce, SaaS, or Blog) to quickly improve your AI citation footprint.</p>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER - Responsively padded */}
      <footer className="border-t border-slate-200/50 py-6 text-center text-xs font-bold text-slate-400 bg-white w-full px-4 leading-relaxed mt-12">
        <div>&copy; 2026 AEO Pulse Pro. All rights reserved.</div>
        <div className="mt-1 text-slate-400/80">
          📬 For enterprise inquiries or support:{" "}
          <a 
            href="mailto:hello@aeopulse.pro?subject=AEO Pulse Pro Inquiry" 
            className="text-blue-600/80 hover:text-blue-600 transition-colors underline decoration-blue-500/20 hover:decoration-blue-500"
          >
            hello@aeopulse.pro
          </a>
        </div>
      </footer>

    </div>
  );
}