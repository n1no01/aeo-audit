import { ScrapedData } from "./types";

export function calculateScore(data: Omit<ScrapedData, "bodyText">): number {
  let score = 0;

  // 1. Meta & Core Tagovi (Max 25 bodova)
  if (data.title.length >= 30 && data.title.length <= 65) score += 10;
  if (data.metaDescription.length >= 120 && data.metaDescription.length <= 160) score += 5;
  if (data.h1 && data.h1 !== "No H1 Found") score += 10;

  // 2. Sadržaj i Formati (Max 25 bodova)
  // Smanjen uticaj wordCount-a jer dužina ne utiče na AI citiranje
  if (data.wordCount >= 500) {
    score += 5; // Smanjeno sa 10 na 5
  } else if (data.wordCount >= 200) {
    score += 2;
  }
  
  // Povećan uticaj tabela i listi (Listicles čine 43.8% svih ChatGPT citata!)
  if (data.hasTablesOrLists) score += 10; // Povećano sa 5 na 10

  if (data.qaBlocksCount >= 2) {
    score += 10;
  } else if (data.qaBlocksCount === 1) {
    score += 5;
  }

  // 3. Robots & Crawlability (Max 15 bodova)
  if (data.robotsStatus === "Valid" || data.robotsStatus === "Missing") {
    score += 15; 
  } else if (data.robotsStatus === "Blocking AI") {
    score -= 25; 
  }

  // 4. Strukturirani Podaci & Šeme (Max 15 bodova)
  if (data.detectedSchemas.length > 0) score += 5;
  const highValueAeoSchemas = ["FAQPage", "TechArticle", "Article", "Organization", "LocalBusiness", "Product"];
  const hasHighValueSchema = data.detectedSchemas.some(s => highValueAeoSchemas.includes(s));
  if (hasHighValueSchema) score += 10;

  // 5. Entiteti i Brend Disambiguation (Max 10 bodova)
  if (data.entityTrustMap.hasWikidataOrWikipedia) score += 1;
  if (data.entityTrustMap.hasLinkedIn) score += 1;
  if (data.entityTrustMap.hasXAccount) score += 1;
  if (data.entityTrustMap.brandDisambiguationStatus === "Optimal") {
    score += 7;
  } else if (data.entityTrustMap.brandDisambiguationStatus === "Inconsistent") {
    score += 3;
  }

  // 6. Semantički Kôd i Multimodalnost (Max 10 bodova)
  if (data.semanticLayoutMap.hasMainTag) score += 3;
  if (data.semanticLayoutMap.hasArticleTag) score += 2;
  if (!data.semanticLayoutMap.hasHeadingLeap) score += 2;
  
  if (data.semanticLayoutMap.totalImages > 0) {
    const missingRatio = data.semanticLayoutMap.missingAltCount / data.semanticLayoutMap.totalImages;
    if (missingRatio <= 0.2) score += 3;
  } else {
    score += 3;
  }

  // Osiguravamo da zbog penalizacije skor ne ode ispod 0, niti preko 100
  return Math.max(0, Math.min(score, 100));
}