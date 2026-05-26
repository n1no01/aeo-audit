'use client';

import { useState } from "react";
import Link from "next/link";

export default function WhiteLabelSection() {
  // Stanje koje prati trenutno odabranu Tailwind klasu za pozadinu i sjenu ikone
  const [selectedColor, setSelectedColor] = useState<string>("bg-indigo-600 shadow-indigo-600/20");

  // Pomoćna funkcija koja provjerava je li boja trenutno aktivna
  const isActive = (colorBg: string) => selectedColor.includes(colorBg);

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10 border-t border-slate-200">
      {/* Pozadinski blagi gradijent iza sekcije za vizualni naglasak */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* LIJEVA STRANA: Tekst i Prodajni aduti */}
        <div className="flex flex-col text-left">
          {/* Mali Badge */}
          <div className="inline-block px-3 py-1 mb-4 rounded-full bg-indigo-50 border border-indigo-100 w-fit">
            <span className="text-[10px] font-black tracking-[0.15em] uppercase text-indigo-600">
              AGENCY EXCLUSIVE
            </span>
          </div>

          {/* Naslov */}
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 mb-4 leading-[1.2]">
            Deliver Insights Under <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
              Your Own Brand.
            </span>
          </h2>

          {/* Podnaslov */}
          <p className="text-slate-500 text-sm sm:text-base font-medium leading-relaxed mb-6">
            Impress your clients with pristine, professional AEO audits. Our White-Label Export option lets you strip away AEO Audit Pro branding, inject your agency logo, and apply custom brand colors in a single click.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</div>
              <p className="text-sm font-semibold text-slate-700">Fully Branded Reports with Your Agency Identity</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</div>
              <p className="text-sm font-semibold text-slate-700">Editable DOCX Export – Ready for Your Custom Insights</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</div>
              <p className="text-sm font-semibold text-slate-700">Charge clients a premium for AI Search Readiness</p>
            </div>
          </div>

          {/* CTA gumb */}
          <div>
            <Link href="/pricing" className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition shadow-md text-sm">
              Explore Agency Plans
            </Link>
          </div>
        </div>

        {/* DESNA STRANA: Interaktivni/Vizualni Mockup izvještaja */}
        <div className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/50 backdrop-blur-sm group hover:border-indigo-200 transition-all duration-300">
          
          {/* Lažni prozorčić s postavkama brendiranja (UI Mockup) */}
          <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-200 block" />
              <span className="w-3 h-3 rounded-full bg-slate-200 block" />
              <span className="w-3 h-3 rounded-full bg-slate-200 block" />
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Report Customizer</span>
          </div>

          <div className="space-y-4">
            {/* Logo Upload Box */}
            <div className="p-4 border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-xl text-center group-hover:bg-indigo-50/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-indigo-100 mx-auto flex items-center justify-center text-indigo-600 font-bold text-sm mb-1">+</div>
              <p className="text-xs font-bold text-indigo-700">Upload Your Agency Logo</p>
              <p className="text-[10px] text-slate-400 mt-0.5">PNG up to 2MB</p>
            </div>

            {/* Color Palette Picker */}
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Primary Brand Color</p>
              <div className="flex gap-2">
                <span 
                  onClick={() => setSelectedColor("bg-indigo-600 shadow-indigo-600/20")}
                  className={`w-6 h-6 rounded-full bg-indigo-600 cursor-pointer transition-all duration-200 ${isActive("bg-indigo-600") ? "ring-2 ring-indigo-600 ring-offset-2" : ""}`} 
                />
                <span 
                  onClick={() => setSelectedColor("bg-emerald-600 shadow-emerald-600/20")}
                  className={`w-6 h-6 rounded-full bg-emerald-600 cursor-pointer transition-all duration-200 ${isActive("bg-emerald-600") ? "ring-2 ring-emerald-600 ring-offset-2" : ""}`} 
                />
                <span 
                  onClick={() => setSelectedColor("bg-amber-500 shadow-amber-500/20")}
                  className={`w-6 h-6 rounded-full bg-amber-500 cursor-pointer transition-all duration-200 ${isActive("bg-amber-500") ? "ring-2 ring-amber-500 ring-offset-2" : ""}`} 
                />
                <span 
                  onClick={() => setSelectedColor("bg-rose-500 shadow-rose-500/20")}
                  className={`w-6 h-6 rounded-full bg-rose-500 cursor-pointer transition-all duration-200 ${isActive("bg-rose-500") ? "ring-2 ring-rose-500 ring-offset-2" : ""}`} 
                />
                <span 
                  onClick={() => setSelectedColor("bg-slate-800 shadow-slate-800/20")}
                  className={`w-6 h-6 rounded-full bg-slate-800 cursor-pointer transition-all duration-200 ${isActive("bg-slate-800") ? "ring-2 ring-slate-800 ring-offset-2" : ""}`} 
                />
              </div>
            </div>

            {/* Preview Document Box */}
            <div className="border border-blue-100 rounded-xl p-3 bg-blue-50/50 flex items-center gap-3">
              {/* Dinamička ikona koja mijenja boju i sjenu ovisno o stanju */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md transition-all duration-300 ${selectedColor}`}>
                W
              </div>
              <div className="flex-1">
                <div className="w-24 h-2 bg-slate-300 rounded mb-1.5" />
                <div className="w-32 h-1.5 bg-slate-200 rounded" />
              </div>
              <span className="text-[10px] font-black uppercase text-blue-600 px-2 py-1 bg-blue-50 rounded border border-blue-200">
                DOCX GENERATED
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}