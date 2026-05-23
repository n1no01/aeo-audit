import axios from "axios";
import * as cheerio from "cheerio";
import { ScrapedData, BotStatus, EntityTrustMap, SemanticLayoutMap } from "./types";

interface ScraperResponseData {
  html?: string;
}

export async function scrapeWebsite(url: string, scrapingApiKey: string): Promise<ScrapedData> {
  const parsedUrl = new URL(url);
  
  // ==========================================
  // ROBOTS.TXT ANALYSIS
  // ==========================================
  const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`;
  let robotsRawContent = "";
  let robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error" = "Missing";

  const aiBotsStatus: BotStatus = {
    gptBot: "Allowed",
    claudeBot: "Allowed",
    perplexityBot: "Allowed",
    oaiSearchBot: "Allowed",
    googleExtended: "Allowed",
    anthropicAi: "Allowed",
    deepSeekBot: "Allowed",    
    appleBotExtended: "Allowed",
    bingbot: "Allowed",
    cohereAi: "Allowed",
  };

  const parseRobotsConfig = (content: string) => {
    const lower = content.toLowerCase();
    const checkBot = (agentToken: string): "Allowed" | "Blocked" => {
      const blocksAll = lower.includes("user-agent: *") && (lower.includes("disallow: /") || lower.includes("disallow: / "));
      const blocksSpecific = lower.includes(`user-agent: ${agentToken}`) && (lower.includes("disallow: /") || lower.includes("disallow: / "));
      return (blocksAll || blocksSpecific) ? "Blocked" : "Allowed";
    };

    aiBotsStatus.gptBot = checkBot("gptbot");
    aiBotsStatus.claudeBot = checkBot("claudebot");
    aiBotsStatus.perplexityBot = checkBot("perplexitybot");
    aiBotsStatus.oaiSearchBot = checkBot("oai-searchbot");
    aiBotsStatus.googleExtended = checkBot("google-extended");
    aiBotsStatus.anthropicAi = checkBot("anthropic-ai");
    aiBotsStatus.deepSeekBot = checkBot("deepseekbot");
    aiBotsStatus.appleBotExtended = checkBot("applebot-extended");
    aiBotsStatus.cohereAi = checkBot("cohere-ai");
    aiBotsStatus.bingbot = checkBot("bingbot");

    const isAnyBlocked = Object.values(aiBotsStatus).includes("Blocked");
    robotsStatus = isAnyBlocked ? "Blocking AI" : "Valid";
  };

  // 1. Pokušaj bazični Axios za robots.txt (0 kredita)
  try {
    const robotsResponse = await axios.get(robotsUrl, { timeout: 5000 });
    if (robotsResponse.status === 200 && typeof robotsResponse.data === "string") {
      robotsRawContent = robotsResponse.data;
      parseRobotsConfig(robotsRawContent);
    }
  } catch {
    // 2. Fallback: Pokušaj najjeftiniji API poziv bez proksija (1 kredit) umjesto odmah na 5 kredita
    try {
      const scraperRobotsResponse = await axios.get("https://api.webscraping.ai/html", {
        params: { api_key: scrapingApiKey, url: robotsUrl, render: "false" },
        timeout: 10000,
      });
      const htmlOrText = typeof scraperRobotsResponse.data === "string" 
        ? scraperRobotsResponse.data 
        : (scraperRobotsResponse.data as ScraperResponseData)?.html || "";

      if (htmlOrText && !htmlOrText.includes("<html")) {
        robotsRawContent = htmlOrText;
        parseRobotsConfig(htmlOrText);
      } else {
        robotsStatus = "Missing";
      }
    } catch {
      // 3. Zadnji pokušaj za robots: Ako je sajt baš zaključan, upali Residential (5 kredita)
      try {
        const ultraRobotsResponse = await axios.get("https://api.webscraping.ai/html", {
          params: { api_key: scrapingApiKey, url: robotsUrl, proxy: "residential", render: "false" },
          timeout: 12000,
        });
        const finalHtmlOrText = typeof ultraRobotsResponse.data === "string" ? ultraRobotsResponse.data : "";
        if (finalHtmlOrText && !finalHtmlOrText.includes("<html")) {
          robotsRawContent = finalHtmlOrText;
          parseRobotsConfig(finalHtmlOrText);
        } else {
          robotsStatus = "Missing";
        }
      } catch {
        robotsStatus = "Error";
        robotsRawContent = "Could not fetch or locate robots.txt file.";
      }
    }
  }

  // ==========================================
  // MAIN HTML CRAWL (OPTIMIZOVAN TRISLOJNI MEHANIZAM)
  // ==========================================
  let scrapeResponse;
  try {
    // TIER 1: Najbrža i najjeftinija opcija (Basic - Bez JS, Bez Residential) -> 💸 TROŠI: 1 KREDIT
    scrapeResponse = await axios.get("https://api.webscraping.ai/html", {
      params: { api_key: scrapingApiKey, url, render: "false" },
      timeout: 12000,
    });
  } catch {
    try {
      // TIER 2: Ako Basic baci grešku, palimo težu artiljeriju (Residential bez JS) -> 💸 TROŠI: 5 KREDITA
      scrapeResponse = await axios.get("https://api.webscraping.ai/html", {
        params: { api_key: scrapingApiKey, url, proxy: "residential", render: "false" },
        timeout: 18000,
      });
    } catch {
      // TIER 3: Zadnja linija odbrane za najteže JS/SPA aplikacije (Residential + JS) -> 💸 TROŠI: 10 KREDITA
      scrapeResponse = await axios.get("https://api.webscraping.ai/html", {
        params: { api_key: scrapingApiKey, url, proxy: "residential", render: "true" },
        timeout: 30000,
      });
    }
  }

  const html = typeof scrapeResponse.data === "string" ? scrapeResponse.data : (scrapeResponse.data as ScraperResponseData)?.html || "";
  if (!html) throw new Error("Failed to retrieve HTML payload.");

  const $ = cheerio.load(html);

  const title = $("title").text().trim().substring(0, 150) || "No title found";
  const metaDescription = $('meta[name="description"]').attr("content")?.trim().substring(0, 300) || "No meta description";
  const h1 = $("h1").first().text().trim().substring(0, 150) || "No H1 Found";
  const h2Count = $("h2").length;
  const hasTablesOrLists = $("table").length > 0 || $("ul").length > 0 || $("ol").length > 0;

  // Semantic layout processing
  const semanticLayoutMap: SemanticLayoutMap = {
    hasMainTag: $("main").length === 1,
    hasArticleTag: $("article").length > 0,
    hasHeadingLeap: false,
    totalImages: $("img").length,
    missingAltCount: 0,
  };

  $("img").each((_, el) => {
    if (!$(el).attr("alt")?.trim()) semanticLayoutMap.missingAltCount++;
  });

 let lastHeadingLevel = 1;
$("h1, h2, h3, h4, h5, h6").each((_, el) => {
  const currentLevel = parseInt(el.tagName.substring(1));
  // Skok je neispravan samo ako preskočimo nivo idući dublje (npr. h1 direktno na h3)
  if (currentLevel > lastHeadingLevel && currentLevel - lastHeadingLevel > 1) {
    semanticLayoutMap.hasHeadingLeap = true;
  }
  lastHeadingLevel = currentLevel;
});

  // Entity Map processing
  const entityTrustMap: EntityTrustMap = {
    hasWikidataOrWikipedia: false,
    hasLinkedIn: false,
    hasXAccount: false,
    hasFacebookAccount: false,
    hasPhysicalSignals: false,
    brandDisambiguationStatus: "Optimal",
    detectedBrandVariants: [],
  };

  const brandVariantsSet = new Set<string>();
  if (title && title !== "No title found") {
    const parts = title.split(/[\-\|•·–]/);
    if (parts.length > 1) {
      if (parts[0]?.trim().length < 30) brandVariantsSet.add(parts[0].trim());
      if (parts[parts.length - 1]?.trim().length < 30) brandVariantsSet.add(parts[parts.length - 1].trim());
    } else if (title.length < 30) {
      brandVariantsSet.add(title);
    }
  }

  const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim();
  if (ogSiteName) brandVariantsSet.add(ogSiteName);

  const footerText = $("footer").text() || $("body").text().substring($("body").text().length - 1500);
  const copyrightMatch = footerText.match(/(?:©|copyright)\s*(Lifespan|\d{4}|\d{4}\-\d{4})?\s*([A-Za-z0-9\s\.\,\-\&]{3,40})/i);
  if (copyrightMatch && copyrightMatch[2]) {
    const rawFooterBrand = copyrightMatch[2].replace(/(ltd|llc|inc|d\.o\.o\.|doo|corp|corporation|gmbh|co|company|all rights reserved.*)/i, "").trim();
    if (rawFooterBrand.length > 2) brandVariantsSet.add(rawFooterBrand);
  }

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.toLowerCase() || "";
    if (href.includes("wikipedia.org") || href.includes("wikidata.org")) entityTrustMap.hasWikidataOrWikipedia = true;
    if (href.includes("linkedin.com")) entityTrustMap.hasLinkedIn = true;
    if (href.includes("x.com") || href.includes("twitter.com")) entityTrustMap.hasXAccount = true;
    if (href.includes("facebook.com")) entityTrustMap.hasFacebookAccount = true;
  });

  const fullBodyLowerText = $("body").text().toLowerCase();
  if (/(\+?\d{1,4}[\s\-])?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/.test(fullBodyLowerText) && /\b(suite|floor|st\.|street|ave|avenue|postal|zip|code|address)\b/i.test(fullBodyLowerText)) {
    entityTrustMap.hasPhysicalSignals = true;
  }

  const schemaScripts = $('script[type="application/ld+json"]');
  const schemaSet = new Set<string>();

  schemaScripts.each((_, el) => {
    const content = $(el).html();
    if (!content?.includes("@context")) return;
    try {
      const parsed: unknown = JSON.parse(content);
      const extractTypesAndNames = (obj: unknown): void => {
        if (!obj) return;
        if (Array.isArray(obj)) { obj.forEach(extractTypesAndNames); return; }
        if (typeof obj !== "object") return;
        const typedObj = obj as Record<string, unknown>;
        if (typedObj["@graph"]) extractTypesAndNames(typedObj["@graph"]);
        if (typedObj["@type"]) {
          const typeValue = typedObj["@type"];
          if (Array.isArray(typeValue)) {
            typeValue.forEach((t) => { if (typeof t === "string") schemaSet.add(t); });
          } else if (typeof typeValue === "string") {
            schemaSet.add(typeValue);
          }
          if (["Organization", "LocalBusiness", "Brand", "WebSite"].includes(String(typedObj["@type"]))) {
            if (typeof typedObj["name"] === "string" && typedObj["name"].length < 40) brandVariantsSet.add(typedObj["name"].trim());
          }
        }
      };
      extractTypesAndNames(parsed);
    } catch {}
  });

  const detectedSchemas = Array.from(schemaSet);
  if (detectedSchemas.includes("LocalBusiness") || detectedSchemas.includes("PostalAddress")) entityTrustMap.hasPhysicalSignals = true;

  const rawVariants = Array.from(brandVariantsSet)
    .map(v => v.replace(/[\.\,\-\|]/g, "").trim())
    .filter(v => v.length > 2 && !/^(home|index|main page|welcome|website)$/i.test(v));

  const lowerSet = new Set(rawVariants.map(v => v.toLowerCase()));
  entityTrustMap.detectedBrandVariants = Array.from(lowerSet).map(l => rawVariants.find(v => v.toLowerCase() === l) || l);

  if (entityTrustMap.detectedBrandVariants.length === 0) {
    entityTrustMap.brandDisambiguationStatus = "Critical Missing";
  } else if (entityTrustMap.detectedBrandVariants.length > 2) {
    entityTrustMap.brandDisambiguationStatus = "Inconsistent";
  } else {
    entityTrustMap.brandDisambiguationStatus = "Optimal";
  }

  // ==========================================
  // UNIVERSAL ALGORITHMIC Q&A DETECTOR
  // ==========================================
  let qaBlocksCount = 0;
  
  schemaScripts.each((_, el) => {
    const content = $(el).html();
    if (!content) return;
    try {
      const parsed = JSON.parse(content);
      const countFaqItems = (obj: unknown): void => {
        if (!obj || typeof obj !== "object") return;
        const typedObj = obj as Record<string, unknown>;
        
        if (typedObj["@type"] === "FAQPage" && Array.isArray(typedObj["mainEntity"])) {
          qaBlocksCount += typedObj["mainEntity"].length;
        }
        if (typedObj["@graph"] && Array.isArray(typedObj["@graph"])) {
          typedObj["@graph"].forEach(countFaqItems);
        }
      };
      countFaqItems(parsed);
    } catch {}
  });

  if (qaBlocksCount === 0) {
    const textNodes: { text: string; element: ReturnType<typeof $> }[] = [];
    $("h1, h2, h3, h4, h5, h6, p, div, li, summary, [aria-expanded], [aria-controls]").each((_, el) => {
      const text = $(el).clone().children().remove().end().text().trim();
      if (text.length > 5 && text.length < 160) {
        textNodes.push({ text, element: $(el) });
      }
    });

    for (let i = 0; i < textNodes.length - 1; i++) {
      const currentText = textNodes[i].text;
      const isQuestionStyle = 
        currentText.endsWith("?") || 
        textNodes[i].element.is("h1, h2, h3, h4, h5, h6, summary") ||
        textNodes[i].element.is("[aria-expanded], [aria-controls]") ||
        textNodes[i].element.attr("class")?.toLowerCase().includes("question") ||
        textNodes[i].element.attr("class")?.toLowerCase().includes("title");

      if (isQuestionStyle) {
        const nextNode = textNodes[i + 1];
        const nextText = nextNode.text;
        const isAnswerStyle = 
          nextText.length > 20 && 
          !nextText.endsWith("?") && 
          !nextNode.element.is("h1, h2, h3, h4, h5, h6");

        if (isAnswerStyle) {
          qaBlocksCount++;
          i++; 
        }
      }
    }
  }

  const hasVideoElements = 
  $("video").length > 0 || 
  $("iframe[src*='youtube.com']").length > 0 || 
  $("iframe[src*='youtu.be']").length > 0 || 
  $("iframe[src*='vimeo.com']").length > 0;

  const bodyText = $("p, li, table tr, blockquote").map((_, el) => $(el).text().trim() ? `${$(el).text().trim()} ` : "").get().join(" ").replace(/\s+/g, " ").substring(0, 5000);
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  return {
    title,
    metaDescription,
    h1,
    h2Count,
    wordCount,
    bodyText,
    hasTablesOrLists,
    hasVideoElements,
    qaBlocksCount,
    detectedSchemas,
    robotsStatus,
    robotsRawContent,
    aiBotsStatus,
    entityTrustMap,
    semanticLayoutMap,
  };
}