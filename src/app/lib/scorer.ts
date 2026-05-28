import { ScrapedData } from "./types";

// Proširujemo interfejs unutar funkcije ako types.ts još nije ažuriran na frontendu
interface ExtendedScrapedData extends Omit<ScrapedData, "bodyText"> {
  commodityContentScore?: number;
  semanticLayoutMap: ScrapedData["semanticLayoutMap"] & {
    hasAriaLabels?: boolean; // Spremno za AI Agente
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
  // 2a. Google Non-Commodity Evaluacija (10 bodova) - Direktno iz Google Doc-a
  // Pošto Gemini računa ovu ocjenu od 1 do 10, ovdje je skaliramo na bodove
  const commodityScore = data.commodityContentScore ?? 5; // Fallback na 5 ako još nije izračunato
  if (commodityScore >= 8) {
    score += 10; // Izuzetan, unikatni sadržaj (Non-Commodity)
  } else if (commodityScore >= 5) {
    score += 5;  // Prosječan sadržaj
  } else {
    score -= 5;  // Penalizacija za čisti "Commodity Content" (recyled tekst)
  }

  // 2b. Tabele i liste (5 bodova) - Važno za LLM fragmentaciju
  if (data.hasTablesOrLists) score += 5;

  // 2c. Q&A Struktura (5 bodova) - Kritična za RAG i Query Fan-out
  if (data.qaBlocksCount >= 2) {
    score += 5;
  } else if (data.qaBlocksCount === 1) {
    score += 2;
  } else {
    if (data.pageType === "Homepage" || data.pageType === "Commercial") {
      score += 2; 
    }
  }

  // 2d. AI Agent Accessibility - ARIA podrška (5 bodova)
  // Ako stranica ima bazičnu ARIA strukturu, AI agenti je mogu lakše izvršavati
  if (data.semanticLayoutMap.hasAriaLabels) {
    score += 5;
  } else if (data.pageType === "Commercial") {
    score -= 3; // Komercijalne stranice (shop/pricing) gube bodove ako AI agent ne može kupiti uslugu
  }

  // ==========================================
  // 3. ROBOTS, ACCESS & RENDERING (Max 15 bodova)
  // ==========================================
  if (data.robotsStatus === "Valid" || data.robotsStatus === "Missing") {
    score += 10; 
  } else if (data.robotsStatus === "Blocking AI") {
    score -= 25; // Teška penalizacija ako sajt eksplicitno izbacuje AI botove
  }

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
    About: ["Organization", "Person", "ProfilePage", "AboutPage", "ContactPage"]
  };

  const expectedSchemas = schemaValidationMap[data.pageType] || [];
  const hasContextualHighValueSchema = data.detectedSchemas.some(schema => {
    if (expectedSchemas.includes(schema)) return true;
    if (data.pageType === "Article" && (schema.endsWith("Article") || schema.endsWith("Posting"))) return true;
    if (data.pageType === "FAQ" && schema.endsWith("Page")) return true;

    if (data.pageType === "Article") {
      const genericSchemas = ["WebPage", "Thing", "WebSite", "BreadcrumbList"];
      if (!genericSchemas.includes(schema)) return true;
    }
    
    return false;
  });

  if (hasContextualHighValueSchema) {
    score += 10; 
  }

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
    score += 1;
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

  if (data.hasVideoElements) {
    score += 2;
  }

  // Osiguravamo opseg bodova isključivo između 0 i 100
  return Math.max(0, Math.min(score, 100));
}