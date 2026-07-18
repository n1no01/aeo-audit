"use client";

import { useState } from "react";
import { AuditData, Recommendation } from "../../lib/types";

interface RecommendationsPanelProps {
  data: AuditData;
}

type SeverityFilter = "ALL" | "CRITICAL" | "MEDIUM" | "LOW";

export default function RecommendationsPanel({ data }: RecommendationsPanelProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // 🎛️ Aktivni filter kontrolišemo klikom na gornje boxove
  const [activeFilter, setActiveFilter] = useState<SeverityFilter>("ALL");

  const handleCopyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy code snippet to clipboard:", err);
    }
  };

  const criticalCount = data.recommendations.filter(r => r.severity === "CRITICAL").length + (data.javascriptDependency === "Critical" ? 1 : 0);
  const mediumCount = data.recommendations.filter(r => r.severity === "MEDIUM").length;
  const lowCount = data.recommendations.filter(r => r.severity === "LOW").length;

  // Funkcija koja aktivira filter ili ga poništava ako ponovo kliknemo na isti box
  const toggleFilter = (filterType: SeverityFilter) => {
    if (activeFilter === filterType) {
      setActiveFilter("ALL"); // Poništi filter i prikaži sve
    } else {
      setActiveFilter(filterType);
    }
  };

  const filteredRecommendations = data.recommendations.filter((item) => {
    if (activeFilter === "ALL") return true;
    return item.severity === activeFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-blue-600 rounded-full" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Prioritized Optimization Playbook</h3>
            {activeFilter !== "ALL" && (
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5 animate-pulse">
                Showing {activeFilter.toLowerCase()} priority items • Click card again to clear filter
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 🎛️ INTERAKTIVNI BOXOVI KAO FILTERI */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 select-none">
        
        {/* CRITICAL BOX */}
        <div 
          onClick={() => toggleFilter("CRITICAL")}
          className={`cursor-pointer border rounded-2xl p-4 text-center transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
            activeFilter === "CRITICAL"
              ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-600/20"
              : "bg-red-50/60 border-red-100 hover:border-red-300 hover:bg-red-50"
          }`}
        >
          <span className={`block text-2xl font-black ${activeFilter === "CRITICAL" ? "text-white" : "text-red-600"}`}>
            {criticalCount}
          </span>
          <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${activeFilter === "CRITICAL" ? "text-red-100" : "text-red-700"}`}>
            Critical Fixes
          </span>
        </div>

        {/* MEDIUM BOX */}
        <div 
          onClick={() => toggleFilter("MEDIUM")}
          className={`cursor-pointer border rounded-2xl p-4 text-center transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
            activeFilter === "MEDIUM"
              ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20"
              : "bg-amber-50/60 border-amber-100 hover:border-amber-300 hover:bg-amber-50"
          }`}
        >
          <span className={`block text-2xl font-black ${activeFilter === "MEDIUM" ? "text-white" : "text-amber-600"}`}>
            {mediumCount}
          </span>
          <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${activeFilter === "MEDIUM" ? "text-amber-100" : "text-amber-700"}`}>
            Medium Priority
          </span>
        </div>

        {/* LOW BOX */}
        <div 
          onClick={() => toggleFilter("LOW")}
          className={`cursor-pointer border rounded-2xl p-4 text-center transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
            activeFilter === "LOW"
              ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-blue-50/60 border-blue-100 hover:border-blue-300 hover:bg-blue-50"
          }`}
        >
          <span className={`block text-2xl font-black ${activeFilter === "LOW" ? "text-white" : "text-blue-600"}`}>
            {lowCount}
          </span>
          <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${activeFilter === "LOW" ? "text-blue-100" : "text-blue-700"}`}>
            Low Priority
          </span>
        </div>

      </div>

      {/* LISTA PREPORUKA */}
      <div className="space-y-4 pt-2">
        {data.javascriptDependency === "Critical" && (activeFilter === "ALL" || activeFilter === "CRITICAL") && (
          <div className="bg-white border-l-4 border-l-red-500 border-red-100 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-500 bg-red-50 px-2 py-0.5 rounded-md">Technical Architecture</span>
                <h4 className="font-black text-slate-900 text-base mt-1">High JavaScript Framework Dependency</h4>
              </div>
              <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-1 rounded-xl uppercase tracking-wider">CRITICAL</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">Our crawl engine detected that your DOM structure loads empty initial templates and relies on heavy Client-Side JavaScript hydration.</p>
          </div>
        )}

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-10 bg-white border border-dashed rounded-2xl border-slate-200 animate-in fade-in duration-200">
            <p className="text-xs font-bold text-slate-400 italic">No recommendations match the active severity filter.</p>
          </div>
        )}

        {filteredRecommendations.map((item: Recommendation, idx: number) => {
          const isCritical = item.severity === "CRITICAL";
          const isMedium = item.severity === "MEDIUM";

          return (
            <div key={idx} className={`bg-white border rounded-2xl p-5 shadow-sm space-y-3 border-l-4 ${isCritical ? "border-l-red-500 border-red-100" : isMedium ? "border-l-amber-500 border-amber-100" : "border-l-blue-500 border-blue-100"} animate-in fade-in duration-200`}>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${isCritical ? "text-red-500 bg-red-50" : isMedium ? "text-amber-600 bg-amber-50" : "text-blue-500 bg-blue-50"}`}>{item.category || "General Optimization"}</span>
                  <h4 className="font-black text-slate-900 text-base mt-1">{item.title}</h4>
                </div>
                <span className={`font-black text-[10px] px-2.5 py-1 rounded-xl uppercase tracking-wider shrink-0 ${isCritical ? "bg-red-600 text-white" : isMedium ? "bg-amber-500 text-white" : "bg-blue-600 text-white"}`}>{item.severity}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
              <div className="bg-slate-50/50 p-3 rounded-xl text-xs text-slate-600 border border-slate-100"><strong className="font-bold text-slate-800">AEO Impact:</strong> {item.impact}</div>
              
              {item.fixSteps && item.fixSteps.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-2">
                  <strong className="block font-bold text-slate-900 uppercase tracking-wide">🛠️ How to Fix:</strong>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600">
                    {item.fixSteps.map((step, sIdx) => <li key={sIdx} className="leading-relaxed">{step}</li>)}
                  </ol>
                </div>
              )}
              
              {item.codeSnippet && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block">Implementation Snippet:</span>
                  
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(item.codeSnippet!, idx)}
                      className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-wider transition-all duration-200 px-3 py-1.5 rounded-lg border z-10 shadow-sm ${
                        copiedIndex === idx
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-600"
                      }`}
                    >
                      {copiedIndex === idx ? "Copied! ✓" : "Copy Code"}
                    </button>
                    
                    <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-w-full pr-24 border border-slate-850 shadow-inner">
                      <code>{item.codeSnippet}</code>
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}