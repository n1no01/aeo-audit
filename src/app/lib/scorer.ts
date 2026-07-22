import { ScrapedData, BotStatus } from "./types";

interface ExtendedScrapedData extends Omit<ScrapedData, "bodyText" | "aiAccessibility"> {
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

export function calculateScore(data: ExtendedScrapedData): number {
  let score = 0;

  // ==========================================
  // 1. META & CORE TAGOVI (Max 25 bodova)
  // ==========================================
  if (data.title.length >= 30 && data.title.length <= 65) score += 10;
  if (data.metaDescription.length >= 120 && data.metaDescription.length <= 160) score += 5;
  if (data.h1 && data.h1 !== "No H1 Found") score += 10;

  // ==========================================
  // 2. AI CONTENT BLUEPRINT & AGENT READINESS (Max 25 bodova)
  // ==========================================
  const commodityScore = data.commodityContentScore ?? 5;
  if (commodityScore >= 8) {
    score += 10;
  } else if (commodityScore >= 5) {
    score += 5;
  } else {
    score -= 5;
  }

  if (data.hasTablesOrLists) score += 5;

  if (data.qaBlocksCount >= 2) {
    score += 5;
  } else if (data.qaBlocksCount === 1) {
    score += 2;
  } else {
    if (data.pageType === "Homepage" || data.pageType === "Commercial") {
      score += 2;
    }
  }

  if (data.semanticLayoutMap.hasAriaLabels) {
    score += 5;
  } else if (data.pageType === "Commercial") {
    score -= 3;
  }

  // ==========================================
  // 3. ROBOTS, BOT ACCESS & RENDERING (Max 15 bodova)
  // ==========================================
  const botSeverity = data.aiAccessibility?.cloudflareSeverity ?? "None";
  const botDetected = data.aiAccessibility?.cloudflareDetected ?? false;

  // Analiza pojedinačnih AI i Search botova
  const botStatuses = Object.values(data.aiBotsStatus ?? {}) as string[];
  const totalBotsCount = botStatuses.length;
  const blockedBotsCount = botStatuses.filter((s) => s === "Blocked").length;

  // Primarni Search & AEO botovi (Googlebot, Claude Search, OpenAI Search, Perplexity)
  const isCoreSearchBlocked =
    data.aiBotsStatus?.googlebot === "Blocked" ||
    data.aiBotsStatus?.oaiSearchBot === "Blocked" ||
    data.aiBotsStatus?.claudeSearchBot === "Blocked" ||
    data.aiBotsStatus?.perplexityBot === "Blocked";

  const isAllBotsBlocked = totalBotsCount > 0 && blockedBotsCount === totalBotsCount;
  const completelyBlocked = isAllBotsBlocked || (botDetected && botSeverity === "Hard");
  const partiallyBlocked =
    !completelyBlocked &&
    (blockedBotsCount > 0 || isCoreSearchBlocked || (botDetected && botSeverity === "Soft"));

  if (completelyBlocked) {
    // Sajt je potpuno blokiran za AI crawlere — primjenjuje se jaka penalizacija
    score -= 60;
  } else if (partiallyBlocked) {
    // Delimična blokada: blokiran je neki od AEO search botova ili postoji Cloudflare Soft block
    score -= 15;
  } else if (data.robotsStatus === "Valid" || data.robotsStatus === "Missing") {
    // Svi botovi imaju nesmetan pristup
    score += 10;
  }

  // JS rendering zavisnost
  if (data.javascriptDependency === "Low") {
    score += 5;
  } else if (data.javascriptDependency === "Critical") {
    score -= 10;
  }

  // ==========================================
  // 4. STRUKTURIRANI PODACI & KONTEKSTUALNE ŠEME (Max 15 bodova)
  // ==========================================
  if (data.detectedSchemas.length > 0) score += 5;

  const schemaValidationMap: Record<string, string[]> = {
    Homepage: ["Organization", "LocalBusiness", "SoftwareApplication", "Brand", "WebSite"],
    Commercial: ["Product", "SoftwareApplication", "Service", "Offer", "OfferCatalog"],
    Article: ["Article", "TechArticle", "BlogPosting", "NewsArticle"],
    FAQ: ["FAQPage", "Question", "Answer"],
    About: ["Organization", "Person", "ProfilePage", "AboutPage", "ContactPage"],
  };

  const expectedSchemas = schemaValidationMap[data.pageType] || [];
  const hasContextualHighValueSchema = data.detectedSchemas.some((schema) => {
    if (expectedSchemas.includes(schema)) return true;
    if (data.pageType === "Article" && (schema.endsWith("Article") || schema.endsWith("Posting"))) return true;
    if (data.pageType === "FAQ" && schema.endsWith("Page")) return true;
    if (data.pageType === "Article") {
      const genericSchemas = ["WebPage", "Thing", "WebSite", "BreadcrumbList"];
      if (!genericSchemas.includes(schema)) return true;
    }
    return false;
  });

  if (hasContextualHighValueSchema) score += 10;

  // ==========================================
  // 5. ENTITETI I BREND DISAMBIGUATION (Max 10 bodova)
  // ==========================================
  if (data.entityTrustMap.hasWikidataOrWikipedia) score += 2;

  if (data.pageType === "Homepage" || data.pageType === "About") {
    if (data.entityTrustMap.hasLinkedIn) {
      score += 2;
    } else {
      score -= 4;
    }
    if (data.entityTrustMap.hasXAccount) {
      score += 1;
    } else {
      score -= 2;
    }
  } else {
    score += 3;
  }

  if (data.entityTrustMap.brandDisambiguationStatus === "Optimal") {
    score += 5;
  } else if (data.entityTrustMap.brandDisambiguationStatus === "Inconsistent") {
    score -= 5;
  } else if (data.entityTrustMap.brandDisambiguationStatus === "Critical Missing") {
    if (data.pageType === "Article" || data.pageType === "FAQ") {
      score -= 3;
    } else {
      score -= 10;
    }
  }

  // ==========================================
  // 6. SEMANTIČKI KÔD & VISUAL RAG (Max 10 bodova)
  // ==========================================
  if (data.semanticLayoutMap.hasMainTag) score += 2;
  if (data.semanticLayoutMap.hasArticleTag) score += 1;
  if (!data.semanticLayoutMap.hasHeadingLeap) score += 2;

  if (data.semanticLayoutMap.totalImages > 0) {
    const missingRatio = data.semanticLayoutMap.missingAltCount / data.semanticLayoutMap.totalImages;
    if (missingRatio <= 0.2) score += 3;
  } else {
    score += 3;
  }

  if (data.hasVideoElements) score += 2;

  return Math.max(0, Math.min(score, 100));
}