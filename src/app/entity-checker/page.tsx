"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image"; // Uvozimo Next.js Image za optimalan rendering logotipa
import Footer from "../components/Footer";
import Tooltip from "../components/Tooltip";
import { getUserStats } from "../actions";

interface UserStats {
  plan: string;
  limit: number;
  used: number;
}

interface KnowledgeGraphData {
  hasEntity: boolean;
  entityId?: string;
  name?: string;
  types?: string[];
  description?: string;
  knowledgeGraphUrl?: string | null;
  resultScore?: number;
  error?: string;
}

export default function EntityChecker() {
  const [brandQuery, setBrandQuery] = useState("");
  const [kgData, setKgData] = useState<KnowledgeGraphData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      const stats = await getUserStats();
      if (stats) setUserStats(stats);
    }
    loadStats();
  }, []);

  const handleEntityCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandQuery.trim()) return;

    setKgData(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/entity-check?brand=${encodeURIComponent(brandQuery.trim())}`);
        const data = await res.json();
        setKgData(data);
      } catch (err) {
        console.error("Failed to check Google Knowledge Graph:", err);
        setKgData({ hasEntity: false, error: "Validation query timeout. Please try again." });
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />
      
      {/* NAVBAR - Usklađen dizajn, bijela pozadina, sjenka i logo širine/visine 50 u gornjem lijevom uglu */}
      <nav className="sticky top-0 z-50 w-full bg-white border-b border-slate-200/80 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href="/dashboard" className="group cursor-pointer select-none">
            <div className="flex items-center gap-2.5">
              <Image 
                src="/logo.png" 
                alt="AEO Audit Pro Logo" 
                width={50} 
                height={50} 
                className="object-contain"
                priority
              />
              <div className="text-2xl font-black tracking-tight italic">
                AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200"> Audit</span> Pro
              </div>
            </div>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/dashboard" className="text-xs sm:text-sm font-bold text-slate-500 hover:text-blue-600 transition">
              &larr; Back to Dashboard
            </Link>
            <UserButton /> 
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT WRAPPER */}
      <div className="max-w-4xl mx-auto px-4 sm:px-8 md:px-12 flex-1 w-full mt-6 relative z-10">
        
        {/* HEADER */}
        <header className="text-center mb-10 sm:mb-14 md:mb-16 px-2">
          <div className="inline-block px-4 py-2 mb-5 rounded-full bg-blue-50 border border-blue-100 max-w-full">
            <span className="text-[9px] sm:text-[10px] font-black tracking-[0.2em] sm:tracking-[0.3em] uppercase text-blue-600 block truncate">
              Google Knowledge Graph Global Database
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight italic">
            Entity<span className="text-blue-600"> Checker</span>
          </h1>
          <p className="text-slate-500 mt-4 sm:mt-5 text-sm sm:text-lg max-w-2xl mx-auto font-medium">
            Validates if Google maps your brand name as a standalone official Entity node. Essential for automated AI citations.
          </p>
        </header>

        {/* SEARCH FORM */}
        <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 shadow-xl shadow-blue-900/5 mb-10">
          <form onSubmit={handleEntityCheck} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text" 
                required
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                placeholder="Enter exact brand name (e.g., Apple, Stripe...)"
                className="flex-1 px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border border-slate-200/60 rounded-[16px] sm:rounded-[20px] outline-none font-semibold text-sm sm:text-base text-slate-700 focus:border-blue-500 focus:bg-white transition"
              />
              <button disabled={isPending} className="bg-slate-900 text-white px-6 sm:px-10 py-3.5 sm:py-4 rounded-[16px] sm:rounded-[20px] text-sm sm:text-base font-black hover:bg-blue-600 transition disabled:bg-slate-300 shrink-0">
                {isPending ? "SEARCHING GRAPH..." : "VALIDATE BRAND NODE"}
              </button>
            </div>
          </form>
        </div>

        {/* LOADING SCREEN */}
        {isPending && (
          <div className="mb-10 block animate-in fade-in duration-200">
            <div className="bg-white border border-slate-100 rounded-[24px] p-6 sm:p-10 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-blue-500/5 animate-pulse" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-blue-500 mb-1.5">Graph Verification Engine</div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight">Querying Google API Global Database...</h2>
                </div>
                <div className="relative w-10 h-10 shrink-0"><div className="absolute inset-0 rounded-full border-4 border-slate-100" /><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" /></div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR RESPONSE */}
        {kgData?.error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 rounded-[20px] p-5 sm:p-6 font-bold text-center text-sm sm:text-base animate-in fade-in">
            {kgData.error}
          </div>
        )}

        {/* RESULTS INTERFACE */}
        {kgData && !kgData.error && (
          <div className="w-full border border-slate-200/80 rounded-3xl p-5 sm:p-8 bg-white shadow-2xl shadow-slate-200/50 animate-in fade-in slide-in-from-bottom-5 duration-500 mb-12">
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-5 flex items-center justify-between border-b pb-4 border-slate-100">
              <span className="flex items-center gap-1">🌐 Google Knowledge Graph Mapping Data</span>
              <span className="text-[9px] bg-slate-900 text-white font-black px-2 py-0.5 rounded-md">LIVE TRUST VERIFICATION</span>
            </div>

            {!kgData.hasEntity ? (
              <div className="p-5 bg-rose-50/70 border border-rose-200/60 rounded-2xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-base font-black text-rose-800 flex items-center gap-1.5">
                    <span>❌</span> Entity Unrecognized (Authority Deficit)
                  </h4>
                  <p className="text-xs font-medium text-slate-500 max-w-2xl leading-relaxed">
                    Google does not currently have a mapped Entity ID for <code className="bg-white px-1 py-0.5 rounded border text-slate-700 font-bold font-mono">{brandQuery}</code>. AI search models and automated LLM crawlers perceive this query as a pure string rather than an established relational graph entity.
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-black rounded-xl tracking-wider uppercase shrink-0">CRITICAL GAP</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 bg-blue-50/40 border border-blue-100 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black tracking-widest uppercase rounded">ENTITY REGISTERED</span>
                      <span className="text-xs text-slate-500 font-mono font-bold bg-white border border-slate-100 px-1.5 py-0.5 rounded">ID: {kgData.entityId}</span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900">{kgData.name}</h4>
                    {kgData.description && (
                      <p className="text-xs font-medium text-slate-600 leading-relaxed italic bg-white/60 p-3 rounded-xl border border-slate-100">&ldquo;{kgData.description}&rdquo;</p>
                    )}
                  </div>
                  <div className="bg-white border p-4 rounded-xl shadow-sm shrink-0 w-full md:w-auto text-center md:text-right">
                    <span className="text-[9px] uppercase tracking-wider font-black text-slate-400 block mb-0.5">Google Trust Score</span>
                    <span className="text-3xl font-black text-blue-600">{kgData.resultScore}</span>
                  </div>
                </div>

                {/* EXTRA SPECIFICATIONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Entity Subsets & Types</div>
                    <div className="font-bold text-slate-700">{kgData.types && kgData.types.length > 0 ? kgData.types.join(", ") : "N/A"}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs flex flex-col justify-center">
                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Source Context Link</div>
                    {kgData.knowledgeGraphUrl ? (
                      <a href={kgData.knowledgeGraphUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-black hover:underline flex items-center gap-0.5">
                        Read Official Source Panel ↗
                      </a>
                    ) : (
                      <span className="text-slate-400 font-medium italic">No digital reference panel provided.</span>
                    )}
                  </div>
                </div>
                
                <p className="text-[11px] font-medium text-slate-400 leading-normal border-t pt-4 border-slate-100">
                  💡 <strong>AEO Insight:</strong> Maintaining a high Google Trust Score enables generative search engines (like Perplexity and SearchGPT) to pull accurate information about your brand directly from the knowledge base, drastically reducing the chances of hallucinations.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}