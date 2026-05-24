import Link from "next/link";

export default function AiVsManual() {
  return (
    <section className="w-full py-20 sm:py-28 px-4 sm:px-6 relative z-10">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-rose-50 border border-rose-100/80">
            <span className="text-[10px] font-black tracking-widest uppercase text-rose-600 block">
              The Manual Prompt Fallacy
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4 italic">
            Why not just ask <span className="text-blue-600">ChatGPT </span> what&apos;s missing?
          </h2>
          <p className="text-slate-500 text-sm sm:text-lg font-medium leading-relaxed">
            Copy-pasting your website text into a consumer chat box and asking for feedback does not optimize your site for AI Search. Here is why the manual method completely fails:
          </p>
        </div>

        {/* 3 COLUMN GRID - Bez sive pozadine i senki na karticama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16">
          
          {/* CARD 1 */}
          <div className="border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-blue-500/40 hover:bg-white transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center text-lg font-bold mb-5">
                1
              </div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 mb-3">
                LLMs Are Blind to Your Server Infrastructure
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                ChatGPT inside a normal chat session <strong className="font-bold text-slate-800">cannot read your root server files</strong>. It cannot verify if your <code className="bg-slate-100 border border-slate-200/40 px-1 py-0.5 rounded text-xs font-mono">robots.txt</code> is blocking <code className="bg-slate-100 border border-slate-200/40 px-1 py-0.5 rounded text-xs font-mono">GPTBot</code>, or if your schema code contains silent structural conflicts. If a bot is blocked at the gate, your content visibility drops to absolute zero.
              </p>
            </div>
          </div>

          {/* CARD 2 */}
          <div className="border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-blue-500/40 hover:bg-white transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center text-lg font-bold mb-5">
                2
              </div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 mb-3">
                The &quot;Context Window Timeout&quot; Blindspot
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                When live AI systems (Perplexity, Google AIO) search the web through RAG pipelines, they operate on a <strong className="font-bold text-slate-800">strict millisecond timeout constraint</strong>. If your architecture relies on heavy client-side JavaScript execution, the crawler pulls an empty template and aborts before hydration occurs. A regular prompt loop can never detect this critical risk factor.
              </p>
            </div>
          </div>

          {/* CARD 3 */}
          <div className="border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:border-blue-500/40 hover:bg-white transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center text-lg font-bold mb-5">
                3
              </div>
              <h3 className="text-lg font-black tracking-tight text-slate-900 mb-3">
                Hallucination and the &quot;Politeness Bias&quot;
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                Consumer LLMs are hardwired to be friendly, conversation-driven assistants. If you ask them *&quot;How does my site look?&quot;*, they will flatter you by assessing sentence aesthetic instead of calculating real neural indexing metrics. They do not rank tokens, evaluate entity relational density, or cross-reference global confidence score indicators.
              </p>
            </div>
          </div>

        </div>

        {/* BOTTOM BOX (The Hook + CTA) - Čist tamni boks bez unutrašnjih senki */}
        <div className="bg-slate-900 border border-slate-800 rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-blue-600/10 opacity-50" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
              The AI Chatbox is a consumer tool. <br className="hidden sm:inline" />
              AEO Audit Pro is an engineering platform.
            </h4>
            <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed mb-8">
              We accurately simulate deep neural index sweeps directly through live crawler emulation engines. We lift the machine curtain and hand you the precise operational criteria models demand to trust, cite, and link your domain.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/sign-up" className="w-full sm:w-auto bg-blue-600 text-white font-black text-sm px-8 py-3.5 rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-600/20">
                Run Your First Audit for Free
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}