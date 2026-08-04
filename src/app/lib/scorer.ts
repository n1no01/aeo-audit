import { ScrapedData, BotStatus } from "./types";

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
  totalScore: number;
  breakdown: {
    metaAndCore: { scored: number; max: number };
    aiBlueprint: { scored: number; max: number };
    botAccess: { scored: number; max: number };
    structuredData: { scored: number; max: number };
    entityTrust: { scored: number; max: number };
    semanticCode: { scored: number; max: number };
  };
}

export function calculateScoreBreakdown(data: ExtendedScrapedData): ScoreBreakdownResult {
  // ==========================================
  // 1. META & CORE TAGOVI (Max 25 bodova)
  // ==========================================
  let metaScore = 0;
  if (data.title.length >= 30 && data.title.length <= 65) metaScore += 10;
  if (data.metaDescription.length >= 120 && data.metaDescription.length <= 160) metaScore += 5;
  if (data.h1 && data.h1 !== "No H1 Found") metaScore += 10;
  const metaAndCore = { scored: Math.max(0, Math.min(metaScore, 25)), max: 25 };

  // ==========================================
  // 2. AI CONTENT BLUEPRINT (Max 25 bodova)
  // ==========================================
  let blueprintScore = 0;
  const commodityScore = data.commodityContentScore ?? 5;
  if (commodityScore >= 8) {
    blueprintScore += 10;
  } else if (commodityScore >= 5) {
    blueprintScore += 5;
  } else {
    blueprintScore -= 5;
  }

  if (data.hasTablesOrLists) blueprintScore += 5;

  if (data.qaBlocksCount >= 2) {
    blueprintScore += 5;
  } else if (data.qaBlocksCount === 1) {
    blueprintScore += 2;
  } else {
    if (data.pageType === "Homepage" || data.pageType === "Commercial") {
      blueprintScore += 2;
    }
  }

  if (data.semanticLayoutMap.hasAriaLabels) {
    blueprintScore += 5;
  } else if (data.pageType === "Commercial") {
    blueprintScore -= 3;
  }
  const aiBlueprint = { scored: Math.max(0, Math.min(blueprintScore, 25)), max: 25 };

  // ==========================================
  // 3. ROBOTS, BOT ACCESS & RENDERING (Max 15 bodova)
  // ==========================================
  let botScore = 0;
  const botSeverity = data.aiAccessibility?.cloudflareSeverity ?? "None";
  const botDetected = data.aiAccessibility?.cloudflareDetected ?? false;

  const botStatuses = Object.values(data.aiBotsStatus ?? {}) as string[];
  const totalBotsCount = botStatuses.length;
  const blockedBotsCount = botStatuses.filter((s) => s === "Blocked").length;

  const isCoreSearchBlocked =
    data.aiBotsStatus?.googlebot === "Blocked" ||
    data.aiBotsStatus?.oaiSearchBot === "Blocked" ||
    data.aiBotsStatus?.claudeSearchBot === "Blocked" ||
    data.aiBotsStatus?.perplexityBot === "Blocked" ||
    data.aiBotsStatus?.bingbot === "Blocked" ||
    data.aiBotsStatus?.metaExternalAgent === "Blocked" ||
    data.aiBotsStatus?.grokBot === "Blocked";

  const isAllBotsBlocked = totalBotsCount > 0 && blockedBotsCount === totalBotsCount;
  const completelyBlocked = isAllBotsBlocked || (botDetected && botSeverity === "Hard");
  const partiallyBlocked =
    !completelyBlocked &&
    (blockedBotsCount > 0 || isCoreSearchBlocked || (botDetected && botSeverity === "Soft"));

  if (completelyBlocked) {
    botScore -= 60;
  } else if (partiallyBlocked) {
    botScore -= 15;
  } else if (data.robotsStatus === "Valid" || data.robotsStatus === "Missing") {
    botScore += 10;
  }

  if (data.javascriptDependency === "Low") {
    botScore += 5;
  } else if (data.javascriptDependency === "Critical") {
    botScore -= 10;
  }
  const botAccess = { scored: Math.max(0, Math.min(botScore, 15)), max: 15 };

  // ==========================================
  // 4. STRUKTURIRANI PODACI & ŠEME (Max 15 bodova)
  // ==========================================
  let schemaScore = 0;
  if (data.detectedSchemas.length > 0) schemaScore += 5;

  const schemaValidationMap: Record<string, string[]> = {
    Homepage: ["Organization", "LocalBusiness", "SoftwareApplication", "Brand", "WebSite"],
    Commercial: ["Product", "SoftwareApplication", "Service", "Offer", "OfferCatalog"],
    Product: ["Product", "Offer", "AggregateRating", "Brand"],
    Category: ["CollectionPage", "ItemList", "BreadcrumbList"],
    Article: ["Article", "TechArticle", "BlogPosting", "NewsArticle"],
    Blog: ["Blog", "CollectionPage", "BlogPosting"],
    FAQ: ["FAQPage", "Question", "Answer"],
    About: ["Organization", "Person", "ProfilePage", "AboutPage", "ContactPage"],
    Contact: ["ContactPage", "LocalBusiness", "Organization"],
    Landing: ["WebPage", "Product", "Service", "Offer"],
  };

  const expectedSchemas = schemaValidationMap[data.pageType] || [];
  
  // Eksplicitno tipiziran parametar (schema: string) rešava implicit any grešku
  const hasContextualHighValueSchema = data.detectedSchemas.some((schema: string) => {
    if (expectedSchemas.includes(schema)) return true;
    if (data.pageType === "Article" && (schema.endsWith("Article") || schema.endsWith("Posting"))) return true;
    if (data.pageType === "FAQ" && schema.endsWith("Page")) return true;
    if (data.pageType === "Article") {
      const genericSchemas = ["WebPage", "Thing", "WebSite", "BreadcrumbList"];
      if (!genericSchemas.includes(schema)) return true;
    }
    return false;
  });

  if (hasContextualHighValueSchema) schemaScore += 10;
  const structuredData = { scored: Math.max(0, Math.min(schemaScore, 15)), max: 15 };

  // ==========================================
  // 5. ENTITETI I BREND DISAMBIGUATION (Max 10 bodova)
  // ==========================================
  let entityScore = 0;
  if (data.entityTrustMap.hasWikidataOrWikipedia) {
    entityScore += 3;
  }

  let socialScore = 0;
  if (data.entityTrustMap.hasLinkedIn) socialScore += 2;
  if (data.entityTrustMap.hasXAccount) socialScore += 1;
  
  const socialRequiredTypes = ["Homepage", "About", "Contact"];
  if (socialRequiredTypes.includes(data.pageType)) {
    if (socialScore === 0) {
      entityScore -= 1; 
    } else {
      entityScore += socialScore;
    }
  } else {
    entityScore += 2;
  }

  const hasStrongSchema = 
    data.detectedSchemas.includes("Organization") || 
    data.detectedSchemas.includes("Brand") || 
    data.detectedSchemas.includes("LocalBusiness");

  if (data.entityTrustMap.brandDisambiguationStatus === "Optimal") {
    entityScore += 5;
  } else if (data.entityTrustMap.brandDisambiguationStatus === "Inconsistent") {
    entityScore -= 2;
  } else if (data.entityTrustMap.brandDisambiguationStatus === "Critical Missing") {
    if (hasStrongSchema) {
      entityScore += 2;
    } else if (data.pageType === "Article" || data.pageType === "FAQ") {
      entityScore -= 2;
    } else {
      entityScore -= 4;
    }
  }
  const entityTrust = { scored: Math.max(0, Math.min(entityScore, 10)), max: 10 };

  // ==========================================
  // 6. SEMANTIČKI KÔD & VISUAL RAG (Max 10 bodova)
  // ==========================================
  let semanticScore = 0;
  if (data.semanticLayoutMap.hasMainTag) semanticScore += 2;
  if (data.semanticLayoutMap.hasArticleTag) semanticScore += 1;
  if (!data.semanticLayoutMap.hasHeadingLeap) semanticScore += 2;

  if (data.semanticLayoutMap.totalImages > 0) {
    const missingRatio = data.semanticLayoutMap.missingAltCount / data.semanticLayoutMap.totalImages;
    if (missingRatio <= 0.2) semanticScore += 3;
  } else {
    semanticScore += 3;
  }

  if (data.hasVideoElements) semanticScore += 2;
  const semanticCode = { scored: Math.max(0, Math.min(semanticScore, 10)), max: 10 };

  // ==========================================
  // UKUPAN SKOR
  // ==========================================
  const totalScore = Math.max(
    0,
    Math.min(
      metaAndCore.scored +
        aiBlueprint.scored +
        botAccess.scored +
        structuredData.scored +
        entityTrust.scored +
        semanticCode.scored,
      100
    )
  );

  return {
    totalScore,
    breakdown: {
      metaAndCore,
      aiBlueprint,
      botAccess,
      structuredData,
      entityTrust,
      semanticCode,
    },
  };
}

export function calculateScore(data: ExtendedScrapedData): number {
  return calculateScoreBreakdown(data).totalScore;
}