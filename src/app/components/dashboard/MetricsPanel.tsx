import ScoreBreakdown from "../ScoreBreakdown";
import Tooltip from "../Tooltip";
import { AuditData, AEO_EXPLANATIONS, BotStatus } from "../../lib/types";

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
  const titleLen = data?.title?.length ?? 0;
  const descLen = data?.metaDescription?.length ?? 0;
  const hasH1 = data?.h1 && data?.h1 !== "No H1 Found" && data?.h1.trim() !== "";
  
  let metaAndCoreScored = 0;
  if (titleLen >= 30 && titleLen <= 65) metaAndCoreScored += 10;
  else if ((titleLen >= 20 && titleLen < 30) || (titleLen > 65 && titleLen <= 75)) metaAndCoreScored += 5;
  if (descLen >= 120 && descLen <= 160) metaAndCoreScored += 5;
  else if ((descLen >= 90 && descLen < 120) || (descLen > 160 && descLen <= 180)) metaAndCoreScored += 2;
  if (hasH1) metaAndCoreScored += 10;

  const commodityScore = data?.commodityContentScore ?? 5;
  const hasTablesOrLists = data?.hasTablesOrLists ?? false;
  const qaCount = data?.qaBlocksCount ?? 0;
  const pageType = data?.pageType ?? "Homepage";
  const hasAria = data?.semanticLayoutMap?.hasAriaLabels ?? false;

  let aiBlueprintScored = 0;
  if (commodityScore >= 8) aiBlueprintScored += 10;
  else if (commodityScore >= 5) aiBlueprintScored += 5;
  else aiBlueprintScored -= 5;
  if (hasTablesOrLists) aiBlueprintScored += 5;
  if (qaCount >= 2) aiBlueprintScored += 5;
  else if (qaCount === 1) aiBlueprintScored += 2;
  else if (pageType === "Homepage" || pageType === "Commercial") aiBlueprintScored += 2;
  if (hasAria) aiBlueprintScored += 5;
  else if (pageType === "Commercial") aiBlueprintScored -= 3;

  const botSeverity = data?.aiAccessibility?.cloudflareSeverity ?? "None";
  const botDetected = data?.aiAccessibility?.cloudflareDetected ?? false;
  const robotsBlockingAI = data?.robotsStatus === "Blocking AI";
  const completelyBlocked = robotsBlockingAI || (botDetected && botSeverity === "Hard");
  const partiallyBlocked = !completelyBlocked && (botDetected && botSeverity === "Soft");
  const jsDep = data?.javascriptDependency ?? "Low";

  let botAccessScored = 0;
  if (completelyBlocked) botAccessScored -= 60;
  else if (partiallyBlocked) botAccessScored -= 15;
  else if (data?.robotsStatus === "Valid" || data?.robotsStatus === "Missing") botAccessScored += 10;
  if (jsDep === "Low") botAccessScored += 5;
  else if (jsDep === "Critical") botAccessScored -= 10;
  botAccessScored = Math.max(0, botAccessScored);

  const detectedSchemas = data?.detectedSchemas ?? [];
  let structuredDataScored = 0;
  if (detectedSchemas.length > 0) structuredDataScored += 5;
  const schemaValidationMap: Record<string, string[]> = {
    Homepage: ["Organization", "LocalBusiness", "SoftwareApplication", "Brand", "WebSite"],
    Commercial: ["Product", "SoftwareApplication", "Service", "Offer", "OfferCatalog"],
    Article: ["Article", "TechArticle", "BlogPosting", "NewsArticle"],
    FAQ: ["FAQPage", "Question", "Answer"],
    About: ["Organization", "Person", "ProfilePage", "AboutPage", "ContactPage"],
  };
  const expectedSchemas = schemaValidationMap[pageType] || [];
  const hasContextualSchema = detectedSchemas.some((schema) => {
    if (expectedSchemas.includes(schema)) return true;
    if (pageType === "Article" && (schema.endsWith("Article") || schema.endsWith("Posting"))) return true;
    if (pageType === "FAQ" && schema.endsWith("Page")) return true;
    return false;
  });
  if (hasContextualSchema) structuredDataScored += 10;

  const brandStatus = data?.entityTrustMap?.brandDisambiguationStatus ?? "None";
  let entityTrustScored = 0;
  if (data?.entityTrustMap?.hasWikidataOrWikipedia) entityTrustScored += 2;
  if (pageType === "Homepage" || pageType === "About") {
    if (data?.entityTrustMap?.hasLinkedIn) entityTrustScored += 2; else entityTrustScored -= 4;
    if (data?.entityTrustMap?.hasXAccount) entityTrustScored += 1; else entityTrustScored -= 2;
  }
  if (brandStatus === "Optimal") entityTrustScored += 5;
  else if (brandStatus === "Inconsistent") entityTrustScored -= 4;
  else if (brandStatus === "Critical Missing") {
    if (pageType === "Article" || pageType === "FAQ") entityTrustScored -= 3; else entityTrustScored -= 10;
  }
  entityTrustScored = Math.max(0, entityTrustScored);

  const hasMain = data?.semanticLayoutMap?.hasMainTag ?? false;
  const hasArticle = data?.semanticLayoutMap?.hasArticleTag ?? false;
  const hasHeadingLeap = data?.semanticLayoutMap?.hasHeadingLeap ?? false;
  const totalImages = data?.semanticLayoutMap?.totalImages ?? 0;
  const missingAlt = data?.semanticLayoutMap?.missingAltCount ?? 0;

  let semanticCodeScored = 0;
  if (hasMain) semanticCodeScored += 2;
  if (hasArticle) semanticCodeScored += 1;
  if (!hasHeadingLeap) semanticCodeScored += 2;
  if (totalImages > 0) {
    if (missingAlt / totalImages <= 0.2) semanticCodeScored += 3;
  } else {
    semanticCodeScored += 3;
  }
  if (data?.hasVideoElements) semanticCodeScored += 2;

  const totalScore = data?.score ?? 0;

  const breakdownData = {
    metaAndCore: { scored: metaAndCoreScored, max: 25 },
    aiBlueprint: { scored: aiBlueprintScored, max: 25 },
    botAccess: { scored: botAccessScored, max: 15 },
    structuredData: { scored: structuredDataScored, max: 15 },
    entityTrust: { scored: entityTrustScored, max: 10 },
    semanticCode: { scored: semanticCodeScored, max: 10 },
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
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
              { n: "ChatGPT", statusKey: "gptBot" },
              { n: "OpenAI Search", statusKey: "oaiSearchBot" },
              { n: "Perplexity", statusKey: "perplexityBot" },
              { n: "ClaudeBot", statusKey: "claudeBot" },
              { n: "Claude Search", statusKey: "claudeSearchBot" },
              { n: "Claude User", statusKey: "claudeUser" },
              { n: "Gemini Ext.", statusKey: "googleExtended" },
              { n: "DeepSeek Bot", statusKey: "deepSeekBot" },
              { n: "Apple Bot Ext.", statusKey: "appleBotExtended" },
              { n: "Bing Bot", statusKey: "bingbot" },
              { n: "Cohere AI", statusKey: "cohereAi" },
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
            Engine State: <span className={`font-bold ${data?.javascriptDependency === "Low" ? "text-emerald-700" : "text-amber-700"}`}>{data?.javascriptDependency === "Low" ? "SSR Optimized" : "CSR Dependency"}</span>
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