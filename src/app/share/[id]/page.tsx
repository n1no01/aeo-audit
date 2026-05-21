import { getSharedAudit } from "../../actions";
import { TabId } from "../../lib/types";
import Tooltip from "../../components/Tooltip";
import { AEO_EXPLANATIONS } from "../../lib/types";
import Link from "next/link"; // ✅ Uvezeno Next.js Link za klijentsku navigaciju
export const dynamic = "force-dynamic";
interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default async function SharedAuditPage({ params }: SharePageProps) {
  // 1. Čitamo ID iz URL-a (u tvom slučaju broj "2")
  const resolvedParams = await params;
  const auditId = resolvedParams.id;

  // 2. Povlačimo podatke direktno iz baze preko RPC funkcije
  const res = await getSharedAudit(auditId);

  // 3. Ako audit ne postoji ili je obrisan, prikazujemo error
  if (res.error || !res.data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-[24px] p-8 max-w-md w-full text-center shadow-xl">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-black text-slate-800 mb-2">Report Not Found</h1>
          <p className="text-slate-500 text-sm font-medium">{res.error}</p>
        </div>
      </div>
    );
  }

  const auditData = res.data;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white">
      
      {/* JAVNI NAVBAR (Bez Clerk korisničkih dugmića i stats-a) */}
      <nav className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex justify-between items-center bg-transparent">
        <div className="text-2xl font-black tracking-tight italic select-none">
          AEO<span className="text-blue-600">Audit</span> Pro
        </div>
        <div className="px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] font-black uppercase tracking-wider text-blue-600">
          Public Intelligence Report
        </div>
      </nav>

      {/* PRIKAZ PODATAKA IZ BAZE */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 md:px-12 flex-1 w-full mt-6 mb-16">
        <div className="bg-white rounded-[24px] md:rounded-[48px] overflow-hidden border border-slate-100 shadow-2xl">
          
          {/* TOP BAR */}
          <div className="bg-slate-900 text-white p-5 sm:p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 md:gap-8 w-full md:w-auto">
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-[16px] sm:rounded-[20px] bg-white text-slate-900 flex flex-col items-center justify-center shrink-0 shadow-lg mx-auto sm:mx-0">
                <span className="text-3xl sm:text-5xl font-black">{auditData.score}</span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-0.5 sm:mt-1">Score</span>
              </div>
              <div className="text-center sm:text-left w-full sm:w-auto overflow-hidden">
                {auditData.pageCategory && (
                  <div className="inline-flex items-center px-2.5 py-1 mb-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                    <span className="text-[9px] sm:text-[10px] font-black tracking-wider uppercase text-blue-400">
                      Niche: {auditData.pageCategory}
                    </span>
                  </div>
                )}
                <h2 className="text-xl sm:text-3xl font-black tracking-tight">AEO Performance Audit</h2>
                <p className="text-slate-400 mt-1.5 text-xs sm:text-sm truncate max-w-full">Target: {res.url}</p>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 w-full md:w-auto text-center">
              <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-blue-400 font-black mb-0.5 sm:mb-1">OPTIMIZATION STATE</div>
              <div className="text-lg sm:text-2xl font-black italic uppercase text-white">{auditData.score >= 75 ? "Strong" : auditData.score >= 50 ? "Moderate" : "Weak"}</div>
            </div>
          </div>

          {/* SADRŽAJ REPORTA */}
          <div className="p-4 sm:p-8 md:p-12 space-y-10">
            
            {/* CRAWLERS MATRIX & BRANDING */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-200/60 rounded-2xl p-5 bg-slate-50/50">
                <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">AI Search Crawler Status</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { n: "ChatGPT", v: auditData.aiBotsStatus?.gptBot },
                    { n: "OpenAI Search", v: auditData.aiBotsStatus?.oaiSearchBot },
                    { n: "Perplexity", v: auditData.aiBotsStatus?.perplexityBot },
                    { n: "ClaudeBot", v: auditData.aiBotsStatus?.claudeBot },
                    { n: "Gemini Ext.", v: auditData.aiBotsStatus?.googleExtended },
                    { n: "Cohere AI", v: auditData.aiBotsStatus?.cohereAi },
                  ].map((b, idx) => (
                    <div key={idx} className="bg-white border border-slate-100 p-2 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-slate-600 truncate">{b.n}</span>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${b.v === "Allowed" ? "bg-emerald-500" : "bg-amber-400"}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200/60 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">Brand Disambiguation</div>
                  <div className="text-sm font-black text-slate-800 uppercase mb-2">
                    Status: {auditData.entityTrustMap?.brandDisambiguationStatus || "Optimal"}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {auditData.entityTrustMap?.detectedBrandVariants.map((v: string, i: number) => (
                      <span key={i} className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600">{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI ANALYSIS CODES */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Executive LLM Diagnostics</div>
              <div className="bg-slate-50 rounded-[16px] p-5 border text-sm leading-relaxed text-slate-700 whitespace-pre-line font-medium shadow-inner">
                {auditData.aiAnalysis}
              </div>
            </div>

            {/* STRATEGIC ACTIONS PLAYBOOK */}
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">Prioritized Optimization Playbook</div>
              <div className="space-y-3">
                {auditData.recommendations.map((item: string, idx: number) => (
                  <div key={idx} className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 font-bold text-slate-800 text-sm flex items-start gap-4">
                    <span className="bg-blue-600 text-white rounded-xl w-7 h-7 flex items-center justify-center text-xs font-black shrink-0">{idx + 1}</span>
                    <div className="leading-relaxed">{item}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* VIRAL MARKETING FOOTER LOOP */}
      <footer className="border-t border-slate-200/50 py-8 text-center text-xs bg-white w-full px-4 flex flex-col items-center gap-2">
        <div className="font-bold text-slate-400">&copy; 2026 AEO Audit Pro. All rights reserved.</div>
        
        {/* ✅ POPRAVLJENO: Klasični <a> zamenjen sa Next.js <Link> komponentom */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-full px-4 py-2 text-slate-600 font-bold text-[11px]">
          🚀 Want to audit your own website?{" "}
          <Link href="/" className="text-blue-600 hover:underline font-black ml-1">
            Analyze AI Visibility Free &rarr;
          </Link>
        </div>
      </footer>

    </div>
  );
}