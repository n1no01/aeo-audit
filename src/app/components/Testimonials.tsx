export default function Testimonials() {
  const testimonialsData = [
    { 
      name: "Darko Bartolović", 
      role: "Key Account Manager", 
      text: "AEO Audit Pro helps me bring a fresh perspective to SEO conversations with clients. It makes it easier to explain why AI search visibility matters and where businesses can improve.", 
      img: "testimonials/darkobartolovic.jpeg",
      linkedin: "https://www.linkedin.com/in/darko-barth/"
    },
    { 
      name: "Adi Zeljković", 
      role: "Marketing Assistance Specialist", 
      text: "AEO Audit Pro is a very promising platform for agencies looking to understand and improve how websites are interpreted by AI search systems. What stands out is not only the relevance of the idea, but also the speed at which the product is evolving based on real agency feedback.", 
      img: "testimonials/adizeljkovic.jpeg",
      linkedin: "https://www.linkedin.com/in/adizeljkovic/"
    },
    { 
      name: "Nedim Jamak", 
      role: "Head of Outreach", 
      text: "AEO Audit Pro gives our outreach process a stronger angle by helping us identify businesses that are missing opportunities in AI search. It makes conversations with prospects more relevant and data-driven.", 
      img: "testimonials/nedimjamak.png",
      linkedin: "https://www.linkedin.com/in/nedim-jamak/"
    },
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
            <a 
              key={idx} 
              href={t.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-[320px] bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between shrink-0 hover:border-slate-300 hover:shadow-md transition-all duration-200"
            >
              <div>
                <p className="text-slate-600 text-sm leading-relaxed font-medium italic mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3">
                <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                <div className="truncate">
                  <h4 className="font-black text-sm text-slate-900 truncate hover:text-blue-600 transition-colors">{t.name}</h4>
                  <p className="text-xs text-slate-400 font-bold truncate">{t.role}</p>
                </div>
              </div>
            </a>
          ))}

          {/* Duplirana serija za besprekoran beskonačni loop */}
          {testimonialsData.map((t, idx) => (
            <a 
              key={`dup-${idx}`} 
              href={t.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-[320px] bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm flex flex-col justify-between shrink-0 hover:border-slate-300 hover:shadow-md transition-all duration-200"
            >
              <div>
                <p className="text-slate-600 text-sm leading-relaxed font-medium italic mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3">
                <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                <div className="truncate">
                  <h4 className="font-black text-sm text-slate-900 truncate hover:text-blue-600 transition-colors">{t.name}</h4>
                  <p className="text-xs text-slate-400 font-bold truncate">{t.role}</p>
                </div>
              </div>
            </a>
          ))}

        </div>
      </div>
    </section>
  );
}