import axios from "axios";
import * as cheerio from "cheerio";
import { ScrapedData, BotStatus, EntityTrustMap, SemanticLayoutMap } from "./types";

interface ScraperResponseData {
  html?: string;
}

function isValidSocialProfile(url: string, platform: 'linkedin' | 'x' | 'facebook'): boolean {
  if (!url) return false;
  const cleanUrl = url.trim().toLowerCase();

  const strictlyMainDomains = [
    "https://linkedin.com", "https://www.linkedin.com", "linkedin.com", "linkedin.com/",
    "https://x.com", "https://www.x.com", "x.com", "x.com/",
    "https://twitter.com", "https://www.twitter.com", "twitter.com", "twitter.com/",
    "https://facebook.com", "https://www.facebook.com", "facebook.com", "facebook.com/"
  ];
  
  if (strictlyMainDomains.includes(cleanUrl)) return false;

  if (platform === 'linkedin') {
    const linkedinRegex = /linkedin\.com\/(in|company|school|pub|showcase)\/[a-zA-Z0-9-_]+/i;
    return linkedinRegex.test(cleanUrl);
  }

  if (platform === 'x') {
    const xRegex = /(x|twitter)\.com\/([a-zA-Z0-9-_]+)/i;
    const match = cleanUrl.match(xRegex);
    if (!match) return false;
    const username = match[2];
    const ignored = ["home", "intent", "share", "widgets", "privacy", "tos", "search", "i"];
    return !ignored.includes(username);
  }

  if (platform === 'facebook') {
    const fbRegex = /facebook\.com\/([a-zA-Z0-9-_\.]+)/i;
    const match = cleanUrl.match(fbRegex);
    if (!match) return false;
    const pageName = match[1];
    const ignored = ["sharer", "share", "plugins", "policies", "pages"];
    return !ignored.includes(pageName);
  }

  return false;
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
    const lines = content.split(/\r?\n/);
    let currentAgents: string[] = [];
    
    // Čisti tokeni mapirani na odgovarajuće izlazne ključeve
    const botTokens = {
      "gptbot": ["gptBot"],
      "oai-searchbot": ["oaiSearchBot"],
      "google-extended": ["googleExtended"],
      "claudebot": ["claudeBot"],
      "anthropic-ai": ["anthropicAi"],
      "perplexitybot": ["perplexityBot"],
      "deepseekbot": ["deepSeekBot"],
      "applebot-extended": ["appleBotExtended"],
      "cohere-ai": ["cohereAi"],
      "bingbot": ["bingbot"]
    };

    for (const rawLine of lines) {
      const line = rawLine.split("#")[0].trim().toLowerCase();
      if (!line) continue;

      if (line.startsWith("user-agent:")) {
        const agent = line.replace("user-agent:", "").trim();
        
        // Ako prethodna linija u robots.txt nije bila User-Agent, kreće nova grupa definisanja blokova
        if (currentAgents.length > 0 && !lines[lines.indexOf(rawLine) - 1]?.split("#")[0].trim().toLowerCase().startsWith("user-agent:")) {
          currentAgents = [];
        }
        if (agent) currentAgents.push(agent);
      } else if (line.startsWith("disallow:")) {
        const path = line.replace("disallow:", "").trim();
        
        // Zvanične varijacije globalnih blokada celog sajta ("/", "/*" ili prazan prostor)
        const isGlobalBlock = path === "/" || path === "/*" || path === "";

        if (isGlobalBlock && currentAgents.length > 0) {
          for (const agent of currentAgents) {
            // Slučaj A: Globalna zvezdica (*) - blokira sve AI botove u našem sistemu
            if (agent === "*") {
              Object.keys(aiBotsStatus).forEach(target => {
                aiBotsStatus[target as keyof BotStatus] = "Blocked";
              });
              continue;
            }

            // Slučaj B: Pametna provera podstringa (.includes) - hvata divlju sintaksu, zareze i džokere poput *gptbot*
            for (const [token, targets] of Object.entries(botTokens)) {
              if (agent.includes(token)) {
                targets.forEach(target => {
                  aiBotsStatus[target as keyof BotStatus] = "Blocked";
                });
              }
            }
          }
        }
      }
    }

    const isAnyBlocked = Object.values(aiBotsStatus).includes("Blocked");
    robotsStatus = isAnyBlocked ? "Blocking AI" : "Valid";
  };

  try {
    // TIER 1: Direktan Axios poziv sa dozvolom za 404 status
    const robotsResponse = await axios.get(robotsUrl, { 
      timeout: 5000,
      validateStatus: (status) => status === 200 || status === 404 
    });

    if (robotsResponse.status === 200 && typeof robotsResponse.data === "string") {
      robotsRawContent = robotsResponse.data;
      parseRobotsConfig(robotsRawContent);
    } else if (robotsResponse.status === 404) {
      robotsStatus = "Missing";
      robotsRawContent = "No robots.txt file found (404 Not Found).";
    }
  } catch {
    try {
      // TIER 2: Fallback Scraper API bez JS renderovanja
      const scraperRobotsResponse = await axios.get("https://api.webscraping.ai/html", {
        params: { api_key: scrapingApiKey, url: robotsUrl, render: "false" },
        timeout: 10000,
        validateStatus: (status) => status === 200 || status === 404
      });

      if (scraperRobotsResponse.status === 404) {
        robotsStatus = "Missing";
        robotsRawContent = "No robots.txt file found via proxy (404 Not Found).";
      } else {
        const htmlOrText = typeof scraperRobotsResponse.data === "string" 
          ? scraperRobotsResponse.data 
          : (scraperRobotsResponse.data as ScraperResponseData)?.html || "";

        if (htmlOrText && !htmlOrText.includes("<html")) {
          robotsRawContent = htmlOrText;
          parseRobotsConfig(htmlOrText);
        } else {
          robotsStatus = "Missing";
        }
      }
    } catch {
      try {
        // TIER 3: Fallback sa rezidencijalnim proksijem
        const ultraRobotsResponse = await axios.get("https://api.webscraping.ai/html", {
          params: { api_key: scrapingApiKey, url: robotsUrl, proxy: "residential", render: "false" },
          timeout: 12000,
          validateStatus: (status) => status === 200 || status === 404
        });

        if (ultraRobotsResponse.status === 404) {
          robotsStatus = "Missing";
          robotsRawContent = "No robots.txt file found via residential proxy (404 Not Found).";
        } else {
          const finalHtmlOrText = typeof ultraRobotsResponse.data === "string" ? ultraRobotsResponse.data : "";
          if (finalHtmlOrText && !finalHtmlOrText.includes("<html")) {
            robotsRawContent = finalHtmlOrText;
            parseRobotsConfig(finalHtmlOrText);
          } else {
            robotsStatus = "Missing";
          }
        }
      } catch {
        robotsStatus = "Error";
        robotsRawContent = "Could not fetch or locate robots.txt file due to a network error.";
      }
    }
  }

  // ==========================================
  // MAIN HTML CRAWL
  // ==========================================
  let scrapeResponse;
  let javascriptDependency: "Low" | "Critical" = "Low";

  try {
    scrapeResponse = await axios.get("https://api.webscraping.ai/html", {
      params: { api_key: scrapingApiKey, url, render: "false" },
      timeout: 12000,
    });
    
    const t1Check = cheerio.load(typeof scrapeResponse.data === "string" ? scrapeResponse.data : "");
    if (t1Check("body").text().trim().length < 200 && t1Check("#root, #__next, #app").length > 0) {
      throw new Error("Trigger JS fallback: Empty DOM detected in Tier 1");
    }
  } catch {
    try {
      scrapeResponse = await axios.get("https://api.webscraping.ai/html", {
        params: { api_key: scrapingApiKey, url, proxy: "residential", render: "false" },
        timeout: 18000,
      });

      const t2Check = cheerio.load(typeof scrapeResponse.data === "string" ? scrapeResponse.data : "");
      if (t2Check("body").text().trim().length < 200 && t2Check("#root, #__next, #app").length > 0) {
        throw new Error("Trigger JS fallback: Empty DOM detected in Tier 2");
      }
    } catch {
      javascriptDependency = "Critical"; 
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

  // INICIJALIZACIJA SEMANTIČKE MAPE SA UKLJUČENOM ARIA DETEKCIJOM ZA AI AGENTE
  const semanticLayoutMap: SemanticLayoutMap = {
    hasMainTag: $("main").length === 1,
    hasArticleTag: $("article").length > 0,
    hasHeadingLeap: false,
    totalImages: $("img").length,
    missingAltCount: 0,
    hasAriaLabels: false,
  };

  // EVALUACIJA STRUKTURE ZA AI BROWSING AGENTE (ARIA & ACCESSIBILITY TREE)
  let totalInteractiveElements = 0;
  let elementsWithAria = 0;

  $("button, form, input, select, textarea, [role], [aria-label], [aria-labelledby]").each((_, el) => {
    totalInteractiveElements++;
    const hasLabel = $(el).attr("aria-label") || $(el).attr("aria-labelledby");
    const hasDescribed = $(el).attr("aria-describedby");
    const hasRole = $(el).attr("role");
    const hasExpanded = $(el).attr("aria-expanded");

    if (hasLabel || hasDescribed || hasRole || hasExpanded) {
      elementsWithAria++;
    }
  });

  if (totalInteractiveElements > 0 && (elementsWithAria / totalInteractiveElements) >= 0.20) {
    semanticLayoutMap.hasAriaLabels = true;
  } else if (totalInteractiveElements === 0) {
    semanticLayoutMap.hasAriaLabels = true;
  }

  $("img").each((_, el) => {
    if (!$(el).attr("alt")?.trim()) semanticLayoutMap.missingAltCount++;
  });

  let lastHeadingLevel = 1;
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const currentLevel = parseInt(el.tagName.substring(1));
    if (currentLevel > lastHeadingLevel && currentLevel - lastHeadingLevel > 1) {
      semanticLayoutMap.hasHeadingLeap = true;
    }
    lastHeadingLevel = currentLevel;
  });

  const entityTrustMap: EntityTrustMap = {
    hasWikidataOrWikipedia: false,
    hasLinkedIn: false,
    hasXAccount: false,
    hasFacebookAccount: false,
    hasPhysicalSignals: false,
    brandDisambiguationStatus: "Optimal",
    detectedBrandVariants: [],
    hasDeepLocalBusinessSchema: false,
    hasDeepProductSchema: false,
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
    const href = $(el).attr("href")?.trim() || "";
    if (!href) return;

    if (href.toLowerCase().includes("wikipedia.org") || href.toLowerCase().includes("wikidata.org")) {
      entityTrustMap.hasWikidataOrWikipedia = true;
    } 
    if (href.toLowerCase().includes("linkedin.com") && isValidSocialProfile(href, 'linkedin')) {
      entityTrustMap.hasLinkedIn = true;
    } 
    if ((href.toLowerCase().includes("x.com") || href.toLowerCase().includes("twitter.com")) && isValidSocialProfile(href, 'x')) {
      entityTrustMap.hasXAccount = true;
    } 
    if (href.toLowerCase().includes("facebook.com") && isValidSocialProfile(href, 'facebook')) {
      entityTrustMap.hasFacebookAccount = true;
    }
  });

  const fullBodyLowerText = $("body").text().toLowerCase();
  if (/(\+?\d{1,4}[\s\-])?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/.test(fullBodyLowerText) && /\b(suite|floor|st\.|street|ave|avenue|postal|zip|code|address)\b/i.test(fullBodyLowerText)) {
    entityTrustMap.hasPhysicalSignals = true;
  }

  // ==========================================
  // SCHEMA PARSING (DUBOKO RAZDVAJANJE ENTITETA)
  // ==========================================
  const schemaScripts = $('script[type="application/ld+json"]');
  const schemaSet = new Set<string>();
  let qaBlocksCount = 0;

  schemaScripts.each((_, el) => {
    const content = $(el).html();
    if (!content) return;
    try {
      const parsed: unknown = JSON.parse(content);
      
      const deepParseSchema = (obj: unknown): void => {
        if (!obj) return;
        if (Array.isArray(obj)) {
          obj.forEach(deepParseSchema);
          return;
        }
        if (typeof obj !== "object") return;
        
        const typedObj = obj as Record<string, unknown>;
        
        if (typedObj["@type"]) {
          const typeValue = typedObj["@type"];
          if (Array.isArray(typeValue)) {
            typeValue.forEach((t) => { if (typeof t === "string") schemaSet.add(t); });
          } else if (typeof typeValue === "string") {
            schemaSet.add(typeValue);
          }

          // 🏢 1. DUBOKI LOCAL BUSINESS AUDIT
          if (["LocalBusiness", "Store", "Restaurant", "AutomotiveBusiness", "MedicalBusiness"].includes(String(typedObj["@type"]))) {
            const hasPhone = !!typedObj["telephone"];
            const hasAddress = !!typedObj["address"];
            const hasHours = !!typedObj["openingHours"] || !!typedObj["openingHoursSpecification"];
            
            if ((hasPhone && hasAddress) || (hasAddress && hasHours)) {
              entityTrustMap.hasDeepLocalBusinessSchema = true;
            }
          }

          // 🛒 2. DUBOKI E-COMMERCE PRODUCT AUDIT
          if (typedObj["@type"] === "Product") {
            const hasOffers = !!typedObj["offers"];
            const hasRating = !!typedObj["aggregateRating"] || !!typedObj["review"];
            const hasBrand = !!typedObj["brand"];

            if (hasOffers && (hasBrand || hasRating)) {
              entityTrustMap.hasDeepProductSchema = true;
            }
          }

          if (["Organization", "LocalBusiness", "Brand", "WebSite"].includes(String(typedObj["@type"]))) {
            if (typeof typedObj["name"] === "string" && typedObj["name"].length < 40) {
              brandVariantsSet.add(typedObj["name"].trim());
            }
          }

          if (typedObj["@type"] === "FAQPage" && Array.isArray(typedObj["mainEntity"])) {
            qaBlocksCount += typedObj["mainEntity"].length;
          }
        }

        for (const key in typedObj) {
          if (typeof typedObj[key] === "object" && typedObj[key] !== null) {
            deepParseSchema(typedObj[key]);
          }
        }
      };

      deepParseSchema(parsed);
    } catch {}
  });

  const detectedSchemas = Array.from(schemaSet);
  if (detectedSchemas.includes("LocalBusiness") || detectedSchemas.includes("PostalAddress")) {
    entityTrustMap.hasPhysicalSignals = true;
  }

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
  // ALGORITAMSKI Q&A DETECTOR
  // ==========================================
  if (qaBlocksCount === 0) {
    const textNodes: { text: string; element: ReturnType<typeof $> }[] = [];
    
    $("h1, h2, h3, h4, h5, h6, p, div, li, summary, [aria-expanded], [aria-controls]").each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (text.length > 5 && text.length < 250) {
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

  // ==========================================
  // GLOBAL CONTEXTUAL PAGE TYPE DETECTION
  // ==========================================
  let pageType: "Homepage" | "Article" | "FAQ" | "About" | "Commercial" | "General" = "General";
  const pathname = parsedUrl.pathname.toLowerCase();
  const cleanPath = pathname.replace(/\/$/, "").replace(/^\/(en|de|bs|fr|es|it|hr|sr|nl|pl)(\/|$)/, "/");

  if (cleanPath === "" || cleanPath === "/" || cleanPath === "/index.html") {
    pageType = "Homepage";
  } else if (cleanPath.includes("faq") || cleanPath.includes("question") || detectedSchemas.includes("FAQPage")) {
    pageType = "FAQ";
  } else if (
    /(\b)(about|contact|team|legal|info|imprint|contact-us|profile)(\b)/.test(cleanPath) || 
    detectedSchemas.includes("AboutPage") || 
    detectedSchemas.includes("ContactPage")
  ) {
    pageType = "About";
  } else if (
    /(\b)(shop|product|service|pricing|store|cart|checkout|item|p)(\b)/.test(cleanPath) || 
    detectedSchemas.includes("Product") || 
    detectedSchemas.includes("Service")
  ) {
    pageType = "Commercial";
  } else if (
    $("article").length > 0 || 
    /(\b)(blog|article|news|post|story|insights)(\b)/.test(cleanPath) ||
    detectedSchemas.includes("BlogPosting") ||
    detectedSchemas.includes("TechArticle") ||
    detectedSchemas.includes("Article")
  ) {
    pageType = "Article";
  }

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
    javascriptDependency,
    robotsStatus,
    robotsRawContent,
    aiBotsStatus,
    entityTrustMap,
    semanticLayoutMap,
    pageType,
  };
}