import { ScrapedData } from "./types";

export function calculateScore(data: Omit<ScrapedData, "bodyText">): number {
  let score = 0;

  // ==========================================
  // 1. META & CORE TAGOVI (Max 25 bodova)
  // ==========================================
  if (data.title.length >= 30 && data.title.length <= 65) score += 10;
  if (data.metaDescription.length >= 120 && data.metaDescription.length <= 160) score += 5;
  if (data.h1 && data.h1 !== "No H1 Found") score += 10;

  // ==========================================
  // 2. SADRŽAJ I FORMATI (Max 25 bodova)
  // ==========================================
  // Dužina teksta (Max 5 bodova)
  if (data.wordCount >= 500) {
    score += 5; 
  } else if (data.wordCount >= 200) {
    score += 2;
  }
  
  // Tabele i liste (Listicles) -> Esencijalno za ChatGPT/Perplexity citate (Max 10 bodova)
  if (data.hasTablesOrLists) score += 10;

  // Q&A Struktura (Max 10 bodova)
  if (data.qaBlocksCount >= 2) {
    score += 10;
  } else if (data.qaBlocksCount === 1) {
    score += 5;
  }

  // ==========================================
  // 3. ROBOTS, ACCESS & RENDERING (Max 15 bodova)
  // ==========================================
  // A. Robots.txt status i AI botovi (Max 10 bodova)
  if (data.robotsStatus === "Valid" || data.robotsStatus === "Missing") {
    score += 10; 
  } else if (data.robotsStatus === "Blocking AI") {
    score -= 25; // Teška penalizacija ako je pristup botovima eksplicitno zabranjen
  }

  // B. Google AI SEO 2026: JS Framework rendering zavisnost (Max 5 bodova)
  // Ako je "Low" (Server-Side Rendered), sajt je imun na timeout-e AI parsera.
  if (data.javascriptDependency === "Low") {
    score += 5;
  } else if (data.javascriptDependency === "Critical") {
    score -= 10; // Penalizacija jer Client-Side Rendering drastično smanjuje šanse za RAG indeksiranje
  }

  // ==========================================
  // 4. STRUKTURIRANI PODACI & ŠEME (Max 15 bodova)
  // ==========================================
  if (data.detectedSchemas.length > 0) score += 5;
  const highValueAeoSchemas = ["FAQPage", "TechArticle", "Article", "Organization", "LocalBusiness", "Product"];
  const hasHighValueSchema = data.detectedSchemas.some(s => highValueAeoSchemas.includes(s));
  if (hasHighValueSchema) score += 10;

  // ==========================================
  // 5. ENTITETI I BREND DISAMBIGUATION (Max 10 bodova)
  // ==========================================
  if (data.entityTrustMap.hasWikidataOrWikipedia) score += 1;
  if (data.entityTrustMap.hasLinkedIn) score += 1;
  if (data.entityTrustMap.hasXAccount) score += 1;
  
  if (data.entityTrustMap.brandDisambiguationStatus === "Optimal") {
    score += 7;
  } else if (data.entityTrustMap.brandDisambiguationStatus === "Inconsistent") {
    score += 3;
  }

  // ==========================================
  // 6. SEMANTIČKI KÔD & VISUAL RAG (Max 10 bodova)
  // ==========================================
  if (data.semanticLayoutMap.hasMainTag) score += 2;
  if (data.semanticLayoutMap.hasArticleTag) score += 1;
  if (!data.semanticLayoutMap.hasHeadingLeap) score += 2;
  
  // Slike i Alt Tagovi (Max 3 boda)
  if (data.semanticLayoutMap.totalImages > 0) {
    const missingRatio = data.semanticLayoutMap.missingAltCount / data.semanticLayoutMap.totalImages;
    if (missingRatio <= 0.2) score += 3;
  } else {
    score += 3;
  }

  // Google AI SEO 2026: Multimodalni Visual RAG (Video integracija) -> (Max 2 boda)
  if (data.hasVideoElements) {
    score += 2;
  }

  // Osiguravamo da zbog penalizacija skor ne ode ispod 0, niti preko 100
  return Math.max(0, Math.min(score, 100));
}