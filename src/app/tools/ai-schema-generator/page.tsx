"use client";

import { useState } from "react";
import Link from "next/link"; // Uvezen Link za brzu navigaciju

export default function AISchemaGenerator() {
  const [bizName, setBizName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [expertise, setExpertise] = useState("");
  const [copied, setCopied] = useState(false);

  const expertiseArray = expertise
    ? expertise.split(",").map((item) => item.trim()).filter((item) => item !== "")
    : ["AI Search Optimization", "Digital Marketing"];

  const generatedSchema = `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${bizName || "Your Company Name"}",
  "url": "${url || "https://your-website.com"}",
  "description": "${description || "Brief description of what you do..."}",
  "knowsAbout": ${JSON.stringify(expertiseArray, null, 4)}
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased flex flex-col items-center justify-center p-4">
      
      {/* GLAVNI KONTEJNER OKO KOGA SE NALAZI I BACK BUTTON */}
      <div className="max-w-4xl w-full flex flex-col gap-4">
        
        {/* ⬅️ BACK TO HOME BUTTON */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors duration-200 group"
          >
            <svg 
              className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Glavni kontejner alata (Layout i spacing ostali netaknuti) */}
        <div className="w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Lijeva strana: Forma za unos podataka */}
          <div className="flex flex-col justify-between">
            <div>
              <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                100% Free & Instant
              </span>
              <h1 className="text-2xl font-black mt-3 tracking-tight text-slate-900">
                AI-Ready Schema Generator
              </h1>
              <p className="text-slate-500 text-xs mt-1 mb-6">
                Generate structured data that LLMs (ChatGPT, Perplexity) use to discover and verify your brand.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Business / Website Name</label>
                  <input
                    type="text"
                    placeholder="e.g., AEO Audit Pro"
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Homepage URL</label>
                  <input
                    type="text"
                    placeholder="e.g., https://aeoaudit-pro.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Areas of Expertise (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g., Web Development, Dental Care, Financial Planning"
                    value={expertise}
                    onChange={(e) => setExpertise(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Business Description / Main Focus</label>
                  <textarea
                    placeholder="e.g., Software designed to analyze and optimize website visibility across AI search engines."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none"
                  />
                </div>
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

          {/* Desna strana: Prikaz koda uživo */}
          <div className="flex flex-col h-full justify-between bg-slate-900 p-5 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-mono text-slate-500">JSON-LD (Schema.org)</span>
                <button
                  onClick={handleCopy}
                  className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer font-medium"
                >
                  {copied ? "Copied! ✓" : "Copy Code"}
                </button>
              </div>
              <pre className="text-xs font-mono text-blue-400 overflow-x-auto max-h-[250px] whitespace-pre-wrap">
                {generatedSchema}
              </pre>
            </div>
            
            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/60">
              💡 <strong>How to use:</strong> Copy this code and paste it inside the <code className="text-slate-300">&lt;head&gt;</code> tag of your homepage. This helps AI crawlers map your entity accurately.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}