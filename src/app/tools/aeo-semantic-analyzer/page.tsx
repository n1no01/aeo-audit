"use client";

import { useState } from "react";
import Link from "next/link";

export default function AEOSemanticAnalyzer() {
  const [text, setText] = useState("");

  // 🧠 DIREKTNO IZRAČUNAVANJE (Bez useEffect-a i bez duplog renderovanja)
  let wordCount = 0;
  let sentenceCount = 0;
  let topKeywords: { word: string; count: number }[] = [];
  let aeoScore = { rating: "Empty text...", color: "text-slate-400" };

  if (text.trim()) {
    // 1. Brojanje riječi i rečenica
    const words = text.toLowerCase().match(/\p{L}+/gu) || [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    wordCount = words.length;
    sentenceCount = sentences.length;

    // 2. Analiza najčešćih riječi (izbacivanje stop-riječi)
    const stopWords = new Set(["the", "a", "and", "or", "but", "an", "in", "on", "at", "to", "for", "with", "is", "of", "that", "this", "i", "you", "it"]);
    const freqMap: { [key: string]: number } = {};
    
    words.forEach(w => {
      if (!stopWords.has(w) && w.length > 2) {
        freqMap[w] = (freqMap[w] || 0) + 1;
      }
    });

    topKeywords = Object.keys(freqMap)
      .map(word => ({ word, count: freqMap[word] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. Izračunavanje AEO Readiness Score-a
    const avgSentenceLength = words.length / (sentences.length || 1);
    
    if (words.length < 300) {
      aeoScore = { rating: "Too Short for LLMs (Aim for 300+ words)", color: "text-orange-500" };
    } else if (avgSentenceLength > 25) {
      aeoScore = { rating: "Sentences too complex (LLMs prefer concise structures)", color: "text-red-500" };
    } else if (topKeywords.length > 0 && topKeywords[0].count / words.length > 0.05) {
      aeoScore = { rating: "Keyword Stuffing Detected (High Risk for AI Filters)", color: "text-red-500" };
    } else {
      aeoScore = { rating: "Optimal Dynamic & Semantic Structure ✓", color: "text-green-500" };
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased flex flex-col items-center justify-center p-4">
      
      {/* Glavni kontejner sa Back dugmetom */}
      <div className="max-w-4xl w-full flex flex-col gap-4">
        
        {/* Back to Home */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors duration-200 group"
          >
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Glavni kontejner alata */}
        <div className="w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Lijeva strana: Polje za unos teksta */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                100% Free & Instant
              </span>
              <h1 className="text-2xl font-black mt-3 tracking-tight text-slate-900">
                AEO Semantic Density Analyzer
              </h1>
              <p className="text-slate-500 text-xs mt-1 mb-4">
                Paste your content to check if its semantic structure is optimized for LLM readability.
              </p>

              <div className="mt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Your Content / Article Draft</label>
                <textarea
                  placeholder="Paste your paragraph or full blog post draft here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full h-72 p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none font-medium"
                />
              </div>
            </div>

            {/* CTA za tvoj SaaS */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-center md:text-left">
              <p className="text-[11px] text-slate-400 mb-1">Want advanced analysis and a complete technical audit?</p>
              <a href="/register" className="inline-block text-xs font-bold text-blue-600 hover:underline">
                Try Full AEO Audit Pro →
              </a>
            </div>
          </div>

          {/* Desna strana: Prikaz rezultata i analitike uživo */}
          <div className="flex flex-col h-full justify-between bg-slate-900 p-5 rounded-xl border border-slate-800">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-slate-500 block uppercase tracking-wider mb-2">Live Metrics</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Word Count</p>
                    <p className="text-xl font-mono font-bold text-blue-400 mt-1">{wordCount}</p>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Sentences</p>
                    <p className="text-xl font-mono font-bold text-blue-400 mt-1">{sentenceCount}</p>
                  </div>
                </div>
              </div>

              {/* Top Density Keywords */}
              <div>
                <span className="text-xs font-mono text-slate-500 block uppercase tracking-wider mb-2">Top Semantic Entities</span>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2 min-h-[140px]">
                  {topKeywords.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">No entities detected yet.</p>
                  ) : (
                    topKeywords.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-900 pb-1.5 last:border-0 last:pb-0">
                        <span className="font-mono text-cyan-400 font-medium">#{idx + 1} {item.word}</span>
                        <span className="text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">{item.count} hits</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* AEO Optimization Score */}
              <div>
                <span className="text-xs font-mono text-slate-500 block uppercase tracking-wider mb-2">AEO Readiness Evaluation</span>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-center">
                  <p className={`text-xs font-bold ${aeoScore.color} font-sans tracking-wide`}>
                    {aeoScore.rating}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-[11px] text-slate-400 mt-6 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/60">
              💡 <strong>SEO Insight:</strong> Generative AI engines prefer copy structured with precise context rather than repetitive phrasing. Keep sentences short and use distinct entities.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}