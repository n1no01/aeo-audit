export default function Testimonials() {
  const testimonialsData = [
    { name: "Sarah Jenkins", role: "Head of SEO at Lexis Media", text: "AEO Audit Pro showed us that ChatGPT was completely ignoring our enterprise client. Fixed the schema in 2 days and now we are the top citation.", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60" },
    { name: "Marc Verlang", role: "Founder of SaaSify", text: "Traditional SEO tools are blind to AI chat logs. This tool is a lifesaver for tracking our actual AI Share of Voice.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60" },
    { name: "Amina Koč", role: "Growth Marketer", text: "We discovered that DeepSeek was miscategorizing our brand product lines. The semantic checklist helped us clean up our layout beautifully.", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" },
    { name: "David Chen", role: "Director of Search, Omni Agency", text: "Client pitches became 10x easier. Showing them how invisible they are on Perplexity makes them close the deal instantly.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60" },
    { name: "Elena Rostova", role: "Content Strategist", text: "I love the technical accuracy of the RAG pipeline analysis. It stripped away all marketing fluff and gave me cold hard technical fixes.", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60" },
    { name: "Liam O'Connor", role: "E-commerce Founder", text: "If you sell products and AI isn't recommending you, you're losing money. AEO Audit Pro is exactly what the market needed.", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60" },
    { name: "Jessica Taylor", role: "VP of Marketing at CloudScale", text: "The automated telemetry probes save our dev team hours of manual LLM prompt testing. Truly set-and-forget software.", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60" },
    { name: "Thomas Mueller", role: "Technical SEO Specialist", text: "The JSON-LD validation and layout tokenization analysis is top-tier. Best product launched this year.", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60" }
  ];

  return (
    <section className="w-full border-t border-slate-200/60 pt-16 pb-4 overflow-hidden relative">
      <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-center mb-4">
        Trusted by Forward-Thinking Teams
      </h2>
      <p className="text-slate-500 text-sm text-center max-w-xl mx-auto mb-12 font-medium">
        See how SEO agencies, founders, and marketing directors are securing their visibility in AI search.
      </p>

      <div className="relative w-full overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-[#f8fafc] before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:from-[#f8fafc] after:to-transparent">
        
        {/* Prva linija marquee trake */}
        <div className="flex gap-6 w-max animate-marquee hover:[animation-play-state:paused] cursor-pointer py-4">
          
          {/* Prva serija kartica */}
          {testimonialsData.map((t, idx) => (
            <div key={idx} className="w-[320px] bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between shrink-0">
              <p className="text-slate-600 text-sm leading-relaxed font-medium italic mb-6">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                <div className="truncate">
                  <h4 className="font-black text-sm text-slate-900 truncate">{t.name}</h4>
                  <p className="text-xs text-slate-400 font-bold truncate">{t.role}</p>
                </div>
              </div>
            </div>
          ))}

          {/* Duplirana serija za besprekoran beskonačni loop */}
          {testimonialsData.map((t, idx) => (
            <div key={`dup-${idx}`} className="w-[320px] bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between shrink-0">
              <p className="text-slate-600 text-sm leading-relaxed font-medium italic mb-6">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                <div className="truncate">
                  <h4 className="font-black text-sm text-slate-900 truncate">{t.name}</h4>
                  <p className="text-xs text-slate-400 font-bold truncate">{t.role}</p>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}