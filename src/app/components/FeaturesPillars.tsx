export default function FeaturesPillars() {
  return (
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
  );
}