export default function HeroLogos() {
  return (
    <>
      {/* LEVA STRANA - GORE (ChatGPT) */}
      <div className="hidden md:flex absolute top-10 left-4 w-12 h-12 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-md animate-bounce [animation-duration:6s] opacity-60 hover:opacity-100 transition-opacity duration-300 p-2.5 z-20">
        <img src="/chatgpt.png" alt="ChatGPT" className="w-full h-full object-contain" />
      </div>

      {/* LEVA STRANA - SREDINA (Gemini) */}
      <div className="hidden md:flex absolute top-40 left-16 w-14 h-14 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-md animate-bounce [animation-duration:7s] [animation-delay:0.5s] opacity-50 hover:opacity-100 transition-opacity duration-300 p-2.5 z-20">
        <img src="/gemini.png" alt="Gemini" className="w-full h-full object-contain animate-pulse" />
      </div>

      {/* LEVA STRANA - NIŽE (Perplexity) */}
      <div className="hidden md:flex absolute top-72 left-6 w-12 h-12 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-md animate-bounce [animation-duration:6.5s] [animation-delay:2s] opacity-60 hover:opacity-100 transition-opacity duration-300 p-2.5 z-20">
        <img src="/perplexity.png" alt="Perplexity" className="w-full h-full object-contain" />
      </div>

      {/* DESNA STRANA - GORE (Claude) */}
      <div className="hidden md:flex absolute top-8 right-6 w-14 h-14 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-md animate-bounce [animation-duration:5s] [animation-delay:1s] opacity-60 hover:opacity-100 transition-opacity duration-300 p-3 z-20">
        <img src="/claude.png" alt="Claude" className="w-full h-full object-contain" />
      </div>

      {/* DESNA STRANA - NIŽE (DeepSeek) */}
      <div className="hidden md:flex absolute top-44 right-16 w-12 h-12 bg-white border border-slate-200 rounded-2xl items-center justify-center shadow-md animate-bounce [animation-duration:5.5s] [animation-delay:1.5s] opacity-50 hover:opacity-100 transition-opacity duration-300 p-2.5 z-20">
        <img src="/deepseek.png" alt="DeepSeek" className="w-full h-full object-contain" />
      </div>
    </>
  );
}