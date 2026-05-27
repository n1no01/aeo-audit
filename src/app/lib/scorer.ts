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
  // Dužina teksta - Kontekstualno prilagođena (FAQ stranice ne kažnjavamo za kratak tekst)
  if (data.pageType === "FAQ") {
    score += 5; 
  } else {
    if (data.wordCount >= 500) {
      score += 5; 
    } else if (data.wordCount >= 200) {
      score += 2;
    }
  }
  
  // Tabele i liste (Listicles) -> Esencijalno za ChatGPT/Perplexity ekstrakciju fragmenata
  if (data.hasTablesOrLists) score += 10;

  // Q&A Struktura - Kritična za FAQ i Articles, opciona za Homepage/Commercial
  if (data.qaBlocksCount >= 2) {
    score += 10;
  } else if (data.qaBlocksCount === 1) {
    score += 5;
  } else {
    if (data.pageType === "Homepage" || data.pageType === "Commercial") {
      score += 5; 
    }
  }

  // ==========================================
  // 3. ROBOTS, ACCESS & RENDERING (Max 15 bodova)
  // ==========================================
  if (data.robotsStatus === "Valid" || data.robotsStatus === "Missing") {
    score += 10; 
  } else if (data.robotsStatus === "Blocking AI") {
    score -= 25; // Teška penalizacija ako je pristup botovima eksplicitno zabranjen
  }

  if (data.javascriptDependency === "Low") {
    score += 5;
  } else if (data.javascriptDependency === "Critical") {
    score -= 10; // Penalizacija jer Client-Side Rendering drastično smanjuje šanse za RAG indeksiranje
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
    // 1. Direktno podudaranje iz mape (Homepage traži Organizaciju, Commercial traži Product/SaaS itd.)
    if (expectedSchemas.includes(schema)) return true;
    
    // 2. Fallback za standardne tipove članaka ili FAQ stranica
    if (data.pageType === "Article" && (schema.endsWith("Article") || schema.endsWith("Posting"))) return true;
    if (data.pageType === "FAQ" && schema.endsWith("Page")) return true;

    // 3. ULTIMATE AEO FILTER: Pokriva SVE specifične niše (Recepti, Knjige, Kursevi...) na bazi eliminacije generičkih šema
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
  
  // Socijalni signali se striktno zahtijevaju samo na Homepage i About zonama
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
    score += 3; // Neutralni bodovi za duboke stranice koje ne moraju imati ove linkove u kodu
  }
  
  if (data.entityTrustMap.brandDisambiguationStatus === "Optimal") {
    score += 5;
  } else if (data.entityTrustMap.brandDisambiguationStatus === "Inconsistent") {
    score += 1;
    score -= 5; 
  } else if (data.entityTrustMap.brandDisambiguationStatus === "Critical Missing") {
    if (data.pageType === "Article" || data.pageType === "FAQ") {
      score -= 3; // Blaži penal za duboki sadržaj
    } else {
      score -= 10; // Teški penal ako na Homepage nema brand sidra
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