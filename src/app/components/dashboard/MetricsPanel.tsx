import ScoreBreakdown from "../ScoreBreakdown";
import Tooltip from "../Tooltip";
import { AuditData, AEO_EXPLANATIONS, BotStatus } from "../../lib/types";
import { calculateScoreBreakdown } from "../../lib/scorer";

interface MetricsPanelProps {
  data: AuditData;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border flex flex-col justify-between">
      <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">{label}</div>
      <div className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed break-words">{value}</div>
    </div>
  );
}

export default function MetricsPanel({ data }: MetricsPanelProps) {
  // Single source of truth: the breakdown computed server-side by lib/scorer.ts and stored with the audit.
  // Old audits (saved before this change) are re-scored with the same function, so the UI can never
  // disagree with the headline score again (it used to carry a divergent copy of the scoring rules).
  const computed = data.scoreBreakdown ? null : calculateScoreBreakdown(data);
  const breakdownData = data.scoreBreakdown ?? computed!.breakdown;
  const totalScore = data.score ?? computed?.totalScore ?? 0;
  const capReason = data.scoreCapReason ?? computed?.capReason;
  const rawScore = data.rawScore ?? computed?.rawScore;

  const botSeverity = data?.aiAccessibility?.cloudflareSeverity ?? "None";
  const botDetected = data?.aiAccessibility?.cloudflareDetected ?? false;
  const detectedSchemas = data?.detectedSchemas ?? [];
  const pageType = data?.pageType ?? "Homepage";
  const hasTablesOrLists = data?.hasTablesOrLists ?? false;
  const brandStatus = data?.entityTrustMap?.brandDisambiguationStatus ?? "None";
  const hasHeadingLeap = data?.semanticLayoutMap?.hasHeadingLeap ?? false;
  const totalImages = data?.semanticLayoutMap?.totalImages ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {capReason && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-900">
          <span className="font-black">Score capped{typeof rawScore === "number" ? ` (${rawScore} → ${totalScore})` : ""}: </span>
          {capReason}
        </div>
      )}
      <ScoreBreakdown breakdown={breakdownData} totalScore={totalScore} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="border border-slate-200/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-slate-50/50 flex flex-col gap-4">
          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 flex items-center">
            AI Search Crawler Status <Tooltip text={AEO_EXPLANATIONS.crawlerStatus} />
          </div>

          {!botDetected ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-emerald-700">No bot protection blocking detected</span>
            </div>
          ) : (
            (() => {
              const severityConfig = {
                Soft: { bg: "bg-amber-50", border: "border-amber-100", dot: "bg-amber-400", text: "text-amber-800", label: "Datacenter IPs blocked, residential proxies pass", badge: "Bot protection · Soft block" },
                Hard: { bg: "bg-red-50", border: "border-red-100", dot: "bg-red-500", text: "text-red-800", label: "All bots blocked regardless of IP type", badge: "Bot protection · Hard block" },
                None: { bg: "bg-slate-50", border: "border-slate-100", dot: "bg-slate-400", text: "text-slate-600", label: "Cloudflare status unknown", badge: "Bot protection · Status unknown" },
              }[botSeverity];

              return (
                <div className={`flex items-start gap-2 px-3 py-2 rounded-xl ${severityConfig.bg} border ${severityConfig.border}`}>
                  <span className={`w-2 h-2 rounded-full ${severityConfig.dot} shrink-0 mt-0.5`} />
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-xs font-bold ${severityConfig.text}`}>{severityConfig.badge}</span>
                    <span className={`text-[11px] ${severityConfig.text} opacity-80`}>{severityConfig.label}</span>
                  </div>
                </div>
              );
            })()
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              { n: "Googlebot", statusKey: "googlebot" },
              { n: "OpenAI Search", statusKey: "oaiSearchBot" },
              { n: "Claude Search", statusKey: "claudeSearchBot" },
              { n: "Claude User", statusKey: "claudeUser" },
              { n: "Perplexity", statusKey: "perplexityBot" },
              { n: "Bing Bot", statusKey: "bingbot" },
              { n: "Meta AI", statusKey: "metaExternalAgent" },
              { n: "Grok Bot", statusKey: "grokBot" },
            ].map((b, idx) => {
              const robotsBlocked = data?.aiBotsStatus?.[b.statusKey as keyof BotStatus] === "Blocked";
              const hardBlock = data?.aiAccessibility?.cloudflareSeverity === "Hard";
              const isBlocked = robotsBlocked || hardBlock;
              const reason = hardBlock ? "Bot wall" : robotsBlocked ? "robots.txt" : null;

              return (
                <div key={idx} className={`bg-white border p-2 rounded-xl flex items-center justify-between gap-2 ${isBlocked ? "border-red-100" : "border-slate-100"}`}>
                  <span className="font-bold text-slate-600 truncate">{b.n}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {reason && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${reason === "Bot wall" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"}`}>{reason}</span>}
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isBlocked ? "bg-red-400" : "bg-emerald-500"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-slate-200/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2 flex items-center">
              AEO Tokenizer Brand Disambiguation <Tooltip text={AEO_EXPLANATIONS.brandDisambiguation} />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2.5 h-2.5 rounded-full ${brandStatus === "Optimal" ? "bg-emerald-500" : brandStatus === "Inconsistent" ? "bg-amber-400" : "bg-rose-500"}`} />
              <span className={`text-xs font-black tracking-wider uppercase ${brandStatus === "Optimal" ? "text-emerald-700" : brandStatus === "Inconsistent" ? "text-amber-700" : "text-rose-700"}`}>
                {brandStatus === "Optimal" && "Optimal Consistency"}
                {brandStatus === "Inconsistent" && "Inconsistent Tokenization"}
                {brandStatus === "Critical Missing" && "Missing Identity Vectors"}
              </span>
            </div>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Identified Identity Strings:</div>
            <div className="flex flex-wrap gap-1.5">
              {data?.entityTrustMap && data.entityTrustMap.detectedBrandVariants.length > 0 ? (
                data.entityTrustMap.detectedBrandVariants.map((v, i) => (
                  <span key={i} className="bg-white border border-slate-200/80 px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600">{v}</span>
                ))
              ) : (
                <span className="text-xs font-medium text-slate-400 italic">No explicit brand name anchors parsed cleanly.</span>
              )}
            </div>
          </div>

          <p className="text-[10px] font-medium text-slate-400 mt-4 leading-tight">
            {brandStatus === "Optimal" && "LLMs can accurately map your company name across global knowledge graphs without identity clashes."}
            {brandStatus === "Inconsistent" && "Warning: Multiple structural variations confuse AI text tokenizers. Standardize names in your Schema and Copyright text."}
            {brandStatus === "Critical Missing" && "Critical: AI crawlers cannot extract a singular brand entity name anchor. Citing chance is highly restricted."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="border border-slate-200/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Knowledge Graph & Entity Blueprint</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                <span className="text-slate-600 truncate pr-2 flex items-center">
                  Authority Reference Outlinks (Wikipedia/Data) <Tooltip text={AEO_EXPLANATIONS.authorityOutlinks} />
                </span>
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${data?.entityTrustMap?.hasWikidataOrWikipedia ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                  {data?.entityTrustMap?.hasWikidataOrWikipedia ? "VERIFIED" : "MISSING"}
                </span>
              </div>

              {pageType === "Commercial" && (
                <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                  <span className="text-slate-600 flex items-center">Google Merchant & AI Product Graph Connectivity <Tooltip text="Checks if your Product Schema contains explicit core subsets." /></span>
                  <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${data?.entityTrustMap?.hasDeepProductSchema ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                    {data?.entityTrustMap?.hasDeepProductSchema ? "MERCHANT GRAPH ACTIVE" : "TRUST PROPERTIES MISSING"}
                  </span>
                </div>
              )}

              {pageType === "Homepage" && data?.detectedSchemas?.includes("LocalBusiness") && (
                <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                  <span className="text-slate-600 flex items-center">Local Business AI Coordinates Mapping <Tooltip text="Validates if your LocalBusiness graph contains deep data fields." /></span>
                  <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${data?.entityTrustMap?.hasDeepLocalBusinessSchema ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                    {data?.entityTrustMap?.hasDeepLocalBusinessSchema ? "LOCAL GRAPH OPTIMAL" : "CRITICAL MISSING DATA"}
                  </span>
                </div>
              )}

              {[
                { label: "LinkedIn Identity Profile Connection", checked: data?.entityTrustMap?.hasLinkedIn },
                { label: "X / Twitter Account Integration", checked: data?.entityTrustMap?.hasXAccount },
                { label: "Facebook Page Account Integration", checked: data?.entityTrustMap?.hasFacebookAccount },
                { label: "NAP Local Coordinates Validation", checked: data?.entityTrustMap?.hasPhysicalSignals },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                  <span className="text-slate-600 truncate pr-2">{item.label}</span>
                  <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${item.checked ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    {item.checked ? "VERIFIED" : "MISSING"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border border-slate-200/60 rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">AI Semantic & Multimodal Blueprint</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                <span className="text-slate-600 flex items-center">HTML5 Semantic &lt;main&gt; Isolation <Tooltip text={AEO_EXPLANATIONS.mainTag} /></span>
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${data?.semanticLayoutMap?.hasMainTag ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                  {data?.semanticLayoutMap?.hasMainTag ? "VALID" : "GENERIC DIVS"}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                <span className="text-slate-600 flex items-center">HTML5 Article Core Container <Tooltip text={AEO_EXPLANATIONS.articleTag} /></span>
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${data?.semanticLayoutMap?.hasArticleTag ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                  {data?.semanticLayoutMap?.hasArticleTag ? "DETECTED" : "ABSENT"}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                <span className="text-slate-600 flex items-center">H1 Title Tag Isolation <Tooltip text="Ensures the page contains exactly one <h1> tag." /></span>
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${data?.semanticLayoutMap?.hasSingleH1 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                  {data?.semanticLayoutMap?.hasSingleH1 ? "OPTIMAL (1)" : "ANOMALY"}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                <span className="text-slate-600 flex items-center">Heading Hierarchy Structural Cascade <Tooltip text={AEO_EXPLANATIONS.headingCascade} /></span>
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${!data?.semanticLayoutMap?.hasHeadingLeap ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
                  {!data?.semanticLayoutMap?.hasHeadingLeap ? "HEALTHY" : "LEAP ANOMALY"}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                <span className="text-slate-600 flex items-center">Multimodal Image Alt Coverage <Tooltip text={AEO_EXPLANATIONS.imageAlt} /></span>
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${data?.semanticLayoutMap?.missingAltCount === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                  {data?.semanticLayoutMap ? `${data.semanticLayoutMap.totalImages - data.semanticLayoutMap.missingAltCount}/${data.semanticLayoutMap.totalImages} ALT TAGS` : "0/0 ALT TAGS"}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                <span className="text-slate-600 flex items-center">Visual RAG Integration (Video Embeds) <Tooltip text="Verifies video content pipelines." /></span>
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${data?.hasVideoElements ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                  {data?.hasVideoElements ? "OPTIMIZED" : "NO VIDEO FOUND"}
                </span>
              </div>
              <div className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs font-semibold">
                <span className="text-slate-600 flex items-center">Autonomous AI Agent Readiness (ARIA Tree) <Tooltip text="Evaluates ARIA attribute usage." /></span>
                <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${data?.semanticLayoutMap?.hasAriaLabels ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-600"}`}>
                  {data?.semanticLayoutMap?.hasAriaLabels ? "AGENT READY" : "OPTIMIZATION REQUIRED"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] sm:text-[10px] uppercase text-slate-400 font-black tracking-[0.2em]">Word Count</span>
          <div className="font-bold text-slate-800 text-xs sm:text-sm mt-2">{data?.wordCount ?? 0} words</div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] sm:text-[10px] uppercase text-slate-400 font-black tracking-[0.2em]">Conversational Q&A Loops</span>
          <div className="font-bold text-slate-800 text-xs sm:text-sm mt-2">{data?.qaBlocksCount ?? 0} Blocks</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between shadow-sm">
          <span className="text-[9px] sm:text-[10px] uppercase text-slate-400 font-black tracking-[0.2em]">Robots.txt Architecture</span>
          <div className="font-bold text-slate-800 text-xs sm:text-sm mt-2">{data?.robotsStatus ?? "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between shadow-sm">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">Semantic Layout Density</div>
          <div className="text-xs sm:text-sm font-bold text-slate-800">
            Status: <span className={data?.hasTablesOrLists ? "text-emerald-700" : "text-amber-700"}>{data?.hasTablesOrLists ? "Rich Layout (Tables / Lists Active)" : "Low Density Text Blocks"}</span>
          </div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col justify-between shadow-sm">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-2">JS Rendering Index</div>
         <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
            Engine State: <span className={`font-bold ${data?.javascriptDependency === "Low" ? "text-emerald-700" : "text-amber-700"}`}>{data?.javascriptDependency === "Low" ? "AI Crawl Ready (HTML First)" : "JS Heavy / Render Risk"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <MetricCard label="Meta Title" value={data?.title ?? "—"} />
        <MetricCard label="H1 Header" value={data?.h1 ?? "—"} />
        <MetricCard label="Meta Description" value={data?.metaDescription ?? "—"} />
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 border">
          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3">Detected Schema Entities</div>
          <div className="flex flex-wrap gap-1.5">
            {(data?.detectedSchemas?.length ?? 0) > 0 ? data!.detectedSchemas.map((s, i) => (
              <span key={i} className="bg-white border text-slate-700 text-[11px] px-2.5 py-1 rounded-lg font-bold shadow-sm">{s}</span>
            )) : <span className="text-slate-400 text-xs italic">No items parsed.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}