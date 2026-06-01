import Link from 'next/link';
import { getSharedRadarScan } from '../../actions'; // Putanja do tvojih server akcija
import Footer from '../../components/Footer';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function RadarSharePage({ params }: PageProps) {
  const resolvedParams = await params;
  const token = resolvedParams.token;
  const result = await getSharedRadarScan(token);

  if (result.error || !result.data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center relative z-10">
          <span className="text-4xl">⚠️</span>
          <h1 className="text-2xl font-black mt-4 text-slate-800">Report Unreachable</h1>
          <p className="text-slate-500 mt-2 font-medium text-sm">{result.error || "This AI Radar report was not found or has been deleted."}</p>
          <Link href="/" className="mt-6 inline-block bg-blue-600 text-white font-black text-xs px-6 py-3 rounded-xl hover:bg-slate-900 transition shadow-md">
            GO TO HOME
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const { auditResult, allSourcesCrawled } = result.data;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_0.75px,transparent_0.75px),linear-gradient(to_bottom,#e2e8f0_0.75px,transparent_0.75px)] bg-[size:4rem_4rem] pointer-events-none opacity-40 z-0" />

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1 relative z-10">
        
        {/* BRAND HEADER FOR PUBLIC TRAFFIC */}
        <header className="text-center mb-10 sm:mb-14">
          <Link href="/" className="inline-block text-xl font-black tracking-tight italic mb-4 hover:opacity-80 transition">
            AEO<span className="text-blue-600">Audit</span> Pro
          </Link>
          <div className="h-px bg-slate-200/60 max-w-xs mx-auto mb-6" />
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            Shared AI Visibility <span className="text-blue-600 italic">Snapshot</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-semibold mt-2">
            Public verification card analyzed on {new Date(result.createdAt || '').toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </header>

        {/* REZULTAT KARTA */}
        <div className="bg-white rounded-[24px] md:rounded-[40px] overflow-hidden border border-slate-100 shadow-2xl">
          
          <div className="bg-slate-900 text-white p-6 sm:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[16px] bg-white text-slate-900 flex flex-col items-center justify-center shrink-0 shadow-lg mx-auto sm:mx-0">
                <span className="text-2xl sm:text-3xl font-black">{auditResult.isMentioned ? "🟢" : "🔴"}</span>
              </div>
              <div className="text-center sm:text-left w-full sm:w-auto">
                <div className="inline-flex items-center px-2 py-0.5 mb-1 bg-blue-500/10 border border-blue-500/20 rounded">
                  <span className="text-[9px] font-black tracking-wider uppercase text-blue-400">Verified RAG Data Chunk</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {auditResult.isMentioned ? "AI Optimized Node" : "AI Invisible Vector"}
                </h2>
                <p className="text-slate-400 mt-1 text-xs truncate font-medium">
                  Domain: <span className="text-white font-bold">{result.url}</span> | Query: &ldquo;{result.keyword}&rdquo;
                </p>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2 text-center w-full md:w-auto">
              <div className="text-[8px] uppercase tracking-widest text-blue-400 font-black">CITATION STATUS</div>
              <div className="text-sm sm:text-base font-black italic uppercase text-white">
                {auditResult.isMentioned ? "Active Focus" : "Suppressed"}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8 space-y-6">
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border">
              <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">AI Engine Context Review</div>
              <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-line">{auditResult.mentionContext}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">🤖 AI Summary Response Loop</div>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold italic border-l-2 border-slate-300 pl-3 bg-white p-3.5 rounded-xl shadow-sm">
                    &quot;{auditResult.aiAnswerSummary}&quot;
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border flex flex-col justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">🏆 Captured Citation Leaders</div>
                  <ul className="space-y-1.5">
                    {auditResult.topCompetitors.map((comp, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-white border border-slate-200/60 p-2 rounded-xl shadow-sm">
                        <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-900 text-white rounded">#{idx + 1}</span>
                        {comp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {allSourcesCrawled.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border">
                <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">Live RAG Matrix Sources ({allSourcesCrawled.length})</div>
                <div className="max-h-24 overflow-y-auto text-xs font-semibold text-slate-500 space-y-1.5 pr-1">
                  {allSourcesCrawled.map((source, idx) => (
                    <a key={idx} href={source} target="_blank" rel="noopener noreferrer" className="block truncate bg-white border p-2 rounded-xl hover:text-blue-500 transition shadow-sm">
                      🔗 {source}
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {/* CTA MARKETING CAPTURE PROMPT FOR NEW TRAFFIC */}
            <div className="pt-6 border-t border-slate-100 text-center space-y-3">
              <h4 className="text-sm font-black tracking-tight text-slate-800">Is your business invisible to Conversational AI search models?</h4>
              <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">Analyze how ChatGPT, Perplexity, Claude, and Google crawl, tokenize, and rank your domain infrastructure in real-time.</p>
              <Link href="/" className="inline-block bg-blue-600 hover:bg-slate-950 text-white text-xs font-black tracking-wide px-6 py-3.5 rounded-xl transition shadow-lg shadow-blue-600/10">
                RUN A FREE FULL AEO AUDIT NOW &rarr;
              </Link>
            </div>
          </div>

        </div>

      </div>
      <Footer />
    </div>
  );
}