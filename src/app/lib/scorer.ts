import { ScrapedData, BotStatus, ScoreBreakdownData } from "./types";

/**
 * SINGLE SOURCE OF TRUTH for the AEO score.
 *
 * - The server computes the score + breakdown with this module and stores both in `result_data`.
 * - The UI must only DISPLAY `scoreBreakdown` (or call `calculateScoreBreakdown` for legacy rows),
 *   never re-implement the rules.
 * - The LLM never decides the number; it only explains it.
 */

export interface ExtendedScrapedData extends Omit<ScrapedData, "bodyText" | "aiAccessibility"> {
  commodityContentScore?: number;
  semanticLayoutMap: ScrapedData["semanticLayoutMap"] & {
    hasAriaLabels?: boolean;
  };
  aiAccessibility?: {
    cloudflareSeverity?: "None" | "Soft" | "Hard";
    cloudflareDetected?: boolean;
    accessibilityStatus?: "Accessible" | "Warning" | "Blocked";
  };
}

export interface ScoreBreakdownResult {
  /** Final score after the access cap (0-100). */
  totalScore: number;
  /** Sum of all categories before the cap. */
  rawScore: number;
  capApplied: boolean;
  capReason?: string;
  breakdown: ScoreBreakdownData;
}

// ─────────────────────────────────────────────
// BOT ACCESS ASSESSMENT (shared with gemini.ts / UI)
// ─────────────────────────────────────────────

/** Crawlers that fetch pages to ANSWER questions / build search indexes. Blocking them hurts visibility. */
export const RETRIEVAL_BOTS: (keyof BotStatus)[] = [
  "googlebot",
  "bingbot",
  "oaiSearchBot",
  "claudeSearchBot",
  "claudeUser",
  "perplexityBot",
  "metaExternalAgent",
  "grokBot",
];

/** AI answer-engine search crawlers specifically. */
export const AI_SEARCH_BOTS: (keyof BotStatus)[] = ["oaiSearchBot", "claudeSearchBot", "perplexityBot"];

/** Training-only crawlers. Blocking them is a legitimate publisher choice, so it is NOT penalised. */
export const TRAINING_BOTS: (keyof BotStatus)[] = ["gptBot", "claudeBot", "googleExtended", "ccBot"];

export type BotAccessLevel = "open" | "partial" | "blocked";

export interface BotAccessAssessment {
  level: BotAccessLevel;
  blockedRetrievalBots: number;
  totalRetrievalBots: number;
  blockedAiSearchBots: number;
  classicSearchBlocked: boolean;
  anyCoreSearchBlocked: boolean;
  cloudflareDetected: boolean;
  cloudflareSeverity: "None" | "Soft" | "Hard";
  /** Maximum total score a site with this access situation can reach (null = no cap). */
  scoreCap: number | null;
  capReason?: string;
}

export function assessBotAccess(
  data: Pick<ExtendedScrapedData, "aiBotsStatus" | "aiAccessibility">
): BotAccessAssessment {
  const statuses = (data.aiBotsStatus ?? {}) as Partial<Record<keyof BotStatus, string>>;
  const isBlocked = (k: keyof BotStatus) => statuses[k] === "Blocked";

  const blockedRetrievalBots = RETRIEVAL_BOTS.filter(isBlocked).length;
  const blockedAiSearchBots = AI_SEARCH_BOTS.filter(isBlocked).length;
  const classicSearchBlocked = isBlocked("googlebot") || isBlocked("bingbot");

  const cloudflareDetected = data.aiAccessibility?.cloudflareDetected ?? false;
  const cloudflareSeverity = data.aiAccessibility?.cloudflareSeverity ?? "None";

  const everythingBlocked = blockedRetrievalBots === RETRIEVAL_BOTS.length;
  const hardWall = cloudflareDetected && cloudflareSeverity === "Hard";

  let level: BotAccessLevel = "open";
  if (everythingBlocked || hardWall) level = "blocked";
  else if (blockedRetrievalBots > 0 || (cloudflareDetected && cloudflareSeverity === "Soft")) level = "partial";

  let scoreCap: number | null = null;
  let capReason: string | undefined;
  const applyCap = (cap: number, reason: string) => {
    if (scoreCap === null || cap < scoreCap) {
      scoreCap = cap;
      capReason = reason;
    }
  };

  if (level === "blocked") {
    applyCap(
      20,
      everythingBlocked
        ? "Score capped at 20: robots.txt blocks every search and AI crawler."
        : "Score capped at 20: a bot-protection wall blocks automated access even through a proxy."
    );
  }
  if (blockedAiSearchBots === AI_SEARCH_BOTS.length) {
    applyCap(40, "Score capped at 40: OpenAI, Claude and Perplexity search crawlers are all blocked in robots.txt.");
  } else if (blockedAiSearchBots === 2) {
    applyCap(55, "Score capped at 55: two of the three major AI search crawlers are blocked in robots.txt.");
  } else if (blockedAiSearchBots === 1) {
    applyCap(80, "Score capped at 80: one major AI search crawler is blocked in robots.txt.");
  }
  if (classicSearchBlocked) {
    applyCap(70, "Score capped at 70: Googlebot or Bingbot is blocked in robots.txt.");
  }

  return {
    level,
    blockedRetrievalBots,
    totalRetrievalBots: RETRIEVAL_BOTS.length,
    blockedAiSearchBots,
    classicSearchBlocked,
    anyCoreSearchBlocked: blockedAiSearchBots > 0 || classicSearchBlocked,
    cloudflareDetected,
    cloudflareSeverity,
    scoreCap,
    capReason,
  };
}

// ─────────────────────────────────────────────
// SCHEMA TABLES
// ─────────────────────────────────────────────

/** Schema.org types that merely describe parts of another entity and say nothing about the page itself. */
const HELPER_SCHEMAS = new Set([
  "ImageObject",
  "ListItem",
  "PostalAddress",
  "ContactPoint",
  "SearchAction",
  "ReadAction",
  "EntryPoint",
  "PropertyValue",
  "Question",
  "Answer",
  "Rating",
  "Review",
  "Offer",
  "AggregateOffer",
  "OpeningHoursSpecification",
  "GeoCoordinates",
  "Place",
  "MonetaryAmount",
  "QuantitativeValue",
  "VideoObject",
  "AudioObject",
]);

const GENERIC_SCHEMAS = new Set(["WebPage", "Thing", "BreadcrumbList", "CreativeWork", "WebSite"]);

const SCHEMA_VALIDATION_MAP: Record<string, string[]> = {
  Homepage: ["Organization", "LocalBusiness", "SoftwareApplication", "Brand", "WebSite", "Corporation", "OnlineStore"],
  Commercial: ["Product", "SoftwareApplication", "Service", "Offer", "OfferCatalog", "ProfessionalService"],
  Product: ["Product", "Offer", "AggregateRating", "Brand", "ProductGroup"],
  Category: ["CollectionPage", "ItemList", "BreadcrumbList", "OfferCatalog"],
  Article: ["Article", "TechArticle", "BlogPosting", "NewsArticle", "ScholarlyArticle", "Report"],
  Blog: ["Blog", "CollectionPage", "BlogPosting", "Article", "TechArticle", "NewsArticle", "ItemList"],
  FAQ: ["FAQPage", "Question", "Answer", "HowTo"],
  About: ["Organization", "Person", "ProfilePage", "AboutPage", "ContactPage", "LocalBusiness"],
  Contact: ["ContactPage", "LocalBusiness", "Organization"],
  Landing: ["WebPage", "Product", "Service", "Offer", "SoftwareApplication", "FAQPage"],
  Pricing: ["Product", "Offer", "AggregateOffer", "SoftwareApplication", "Service", "FAQPage", "OfferCatalog"],
  Documentation: ["TechArticle", "HowTo", "Article", "FAQPage", "SoftwareSourceCode", "APIReference"],
  CaseStudy: ["Article", "TechArticle", "CreativeWork", "Report", "BlogPosting"],
  Author: ["Person", "ProfilePage"],
};

// ─────────────────────────────────────────────
// MAIN SCORING
// ─────────────────────────────────────────────

export function calculateScoreBreakdown(data: ExtendedScrapedData): ScoreBreakdownResult {
  const detectedSchemas: string[] = data.detectedSchemas ?? [];
  const pageType = data.pageType ?? "General";

  // ==========================================
  // 1. META & CORE TAGS (max 25)
  // ==========================================
  const titleLen = data.title?.length ?? 0;
  const descLen = data.metaDescription?.length ?? 0;
  let metaScore = 0;
  if (titleLen >= 30 && titleLen <= 65) metaScore += 10;
  else if ((titleLen >= 20 && titleLen < 30) || (titleLen > 65 && titleLen <= 75)) metaScore += 5;
  if (descLen >= 120 && descLen <= 160) metaScore += 5;
  else if ((descLen >= 90 && descLen < 120) || (descLen > 160 && descLen <= 180)) metaScore += 2;
  if (data.h1 && data.h1 !== "No H1 Found" && data.h1.trim() !== "") metaScore += 10;
  const metaAndCore = { scored: clamp(metaScore, 0, 25), max: 25 };

  // ==========================================
  // 2. AI CONTENT BLUEPRINT (max 25)
  // ==========================================
  // `commodityContentScore` only exists after the AI pass. Before that, a neutral 5 is used,
  // so the seed score and the final score are produced by exactly the same rules.
  let blueprintScore = 0;
  const commodityScore = data.commodityContentScore ?? 5;
  if (commodityScore >= 8) blueprintScore += 10;
  else if (commodityScore >= 5) blueprintScore += 5;
  else blueprintScore -= 5;

  if (data.hasTablesOrLists) blueprintScore += 5;

  const qaCount = data.qaBlocksCount ?? 0;
  if (qaCount >= 2) blueprintScore += 5;
  else if (qaCount === 1) blueprintScore += 2;
  else if (pageType === "Homepage" || pageType === "Commercial") blueprintScore += 2;

  if (data.semanticLayoutMap?.hasAriaLabels) blueprintScore += 5;
  else if (pageType === "Commercial") blueprintScore -= 3;
  const aiBlueprint = { scored: clamp(blueprintScore, 0, 25), max: 25 };

  // ==========================================
  // 3. ROBOTS, BOT ACCESS & RENDERING (max 15)
  // ==========================================
  const access = assessBotAccess(data);
  let botScore = 0;

  if (access.level !== "blocked") {
    let robotsPoints: number;
    if (data.robotsStatus === "Error") {
      robotsPoints = 5; // robots.txt could not be fetched: unknown, not good, not bad
    } else {
      robotsPoints = Math.round(10 * (1 - access.blockedRetrievalBots / access.totalRetrievalBots));
      if (access.anyCoreSearchBlocked) robotsPoints = Math.min(robotsPoints, 3);
    }
    if (access.cloudflareDetected && access.cloudflareSeverity === "Soft") {
      robotsPoints = Math.floor(robotsPoints / 2);
    }
    botScore += robotsPoints;
    if (data.javascriptDependency === "Low") botScore += 5;
  }
  const botAccess = { scored: clamp(botScore, 0, 15), max: 15 };

  // ==========================================
  // 4. STRUCTURED DATA & SCHEMAS (max 15)
  // ==========================================
  let schemaScore = 0;
  const meaningfulSchemas = detectedSchemas.filter((s) => !HELPER_SCHEMAS.has(s));
  if (meaningfulSchemas.length > 0) schemaScore += 5;

  const expectedSchemas = SCHEMA_VALIDATION_MAP[pageType] ?? [];
  const hasContextualHighValueSchema = meaningfulSchemas.some((schema) => {
    if (expectedSchemas.includes(schema)) return true;
    if (pageType === "Article" && (schema.endsWith("Article") || schema.endsWith("Posting"))) return true;
    if (pageType === "FAQ" && schema.endsWith("Page")) return true;
    // Page types without a dedicated expectation (e.g. General): any non-generic entity counts.
    if (expectedSchemas.length === 0 && !GENERIC_SCHEMAS.has(schema)) return true;
    return false;
  });
  if (hasContextualHighValueSchema) schemaScore += 10;
  const structuredData = { scored: clamp(schemaScore, 0, 15), max: 15 };

  // ==========================================
  // 5. ENTITY & BRAND DISAMBIGUATION (max 10)
  // ==========================================
  const trust = data.entityTrustMap;
  let entityScore = 0;

  if (trust?.hasSameAsWikidata) entityScore += 3;
  else if (trust?.hasWikidataOrWikipedia) entityScore += 1;

  let socialScore = 0;
  if (trust?.hasLinkedIn) socialScore += 2;
  if (trust?.hasXAccount) socialScore += 1;

  if (["Homepage", "About", "Contact"].includes(pageType)) {
    entityScore += socialScore === 0 ? -1 : socialScore;
  } else {
    entityScore += 2;
  }

  const hasStrongSchema =
    detectedSchemas.includes("Organization") ||
    detectedSchemas.includes("Brand") ||
    detectedSchemas.includes("LocalBusiness");

  const brandStatus = trust?.brandDisambiguationStatus;
  if (brandStatus === "Optimal") {
    entityScore += 5;
  } else if (brandStatus === "Inconsistent") {
    entityScore -= 2;
  } else if (brandStatus === "Critical Missing") {
    if (hasStrongSchema) entityScore += 2;
    else if (pageType === "Article" || pageType === "FAQ") entityScore -= 2;
    else entityScore -= 4;
  }
  const entityTrust = { scored: clamp(entityScore, 0, 10), max: 10 };

  // ==========================================
  // 6. SEMANTIC CODE & VISUAL RAG (max 10)
  // ==========================================
  const layout = data.semanticLayoutMap;
  let semanticScore = 0;
  if (layout?.hasMainTag) semanticScore += 2;
  if (layout?.hasArticleTag) semanticScore += 1;
  if (!layout?.hasHeadingLeap) semanticScore += 2;
  if (layout?.hasSingleH1) semanticScore += 1;

  if ((layout?.totalImages ?? 0) > 0) {
    const missingRatio = (layout?.missingAltCount ?? 0) / layout.totalImages;
    if (missingRatio <= 0.2) semanticScore += 3;
  } else {
    semanticScore += 3;
  }
  if (data.hasVideoElements) semanticScore += 1;
  const semanticCode = { scored: clamp(semanticScore, 0, 10), max: 10 };

  // ==========================================
  // TOTAL (+ access cap)
  // ==========================================
  const rawScore = clamp(
    metaAndCore.scored +
      aiBlueprint.scored +
      botAccess.scored +
      structuredData.scored +
      entityTrust.scored +
      semanticCode.scored,
    0,
    100
  );

  const capApplied = access.scoreCap !== null && rawScore > access.scoreCap;
  const totalScore = capApplied ? (access.scoreCap as number) : rawScore;

  return {
    totalScore,
    rawScore,
    capApplied,
    capReason: capApplied ? access.capReason : undefined,
    breakdown: { metaAndCore, aiBlueprint, botAccess, structuredData, entityTrust, semanticCode },
  };
}

export function calculateScore(data: ExtendedScrapedData): number {
  return calculateScoreBreakdown(data).totalScore;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}
