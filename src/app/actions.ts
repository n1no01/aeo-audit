"use server";

import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface BotStatus {
  gptBot: "Allowed" | "Blocked";
  claudeBot: "Allowed" | "Blocked";
  perplexityBot: "Allowed" | "Blocked";
  oaiSearchBot: "Allowed" | "Blocked";
  googleExtended: "Allowed" | "Blocked";
  anthropicAi: "Allowed" | "Blocked";
  cohereAi: "Allowed" | "Blocked";
}

export interface EntityTrustMap {
  hasWikidataOrWikipedia: boolean;
  hasLinkedIn: boolean;
  hasXAccount: boolean;
  hasFacebookAccount: boolean;
  hasPhysicalSignals: boolean;
  brandDisambiguationStatus: "Optimal" | "Inconsistent" | "Critical Missing";
  detectedBrandVariants: string[];
}

// Novi interfejs za semantičku strukturu HTML-a
export interface SemanticLayoutMap {
  hasMainTag: boolean;
  hasArticleTag: boolean;
  hasHeadingLeap: boolean;
  totalImages: number;
  missingAltCount: number;
}

export interface AuditData {
  title: string;
  metaDescription: string;
  h1: string;
  score: number;
  detectedSchemas: string[];
  aiAnalysis: string;
  wordCount: number;
  h2Count: number;
  recommendations: string[];
  robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error";
  robotsRawContent: string;
  qaBlocksCount: number;
  hasTablesOrLists: boolean;
  aiBotsStatus: BotStatus;
  entityTrustMap: EntityTrustMap;
  semanticLayoutMap: SemanticLayoutMap; // Nova AEO metrika na backendu
}

interface ScraperResponseData {
  html?: string;
}

function formatUrl(rawUrl: string): string {
  let cleaned = rawUrl.trim();
  if (!cleaned) return "";
  
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = "https://" + cleaned;
  }
  
  return cleaned;
}

function calculateScore(data: {
  title: string;
  metaDescription: string;
  h1: string;
  wordCount: number;
  h2Count: number;
  schemas: string[];
  robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error";
  qaBlocksCount: number;
  hasTablesOrLists: boolean;
  entityTrustMap: EntityTrustMap;
  semanticLayoutMap: SemanticLayoutMap;
}): number {
  let score = 0;

  // 1. Meta & Core Tagovi (Max 25 bodova)
  if (data.title.length >= 30 && data.title.length <= 65) score += 10;
  if (data.metaDescription.length >= 120 && data.metaDescription.length <= 160) score += 5;
  if (data.h1 && data.h1 !== "No H1 Found") score += 10;

  // 2. Sadržaj i Formati (Max 25 bodova)
  if (data.wordCount >= 500) score += 10;
  if (data.hasTablesOrLists) score += 5;
  if (data.qaBlocksCount >= 2) {
    score += 10;
  } else if (data.qaBlocksCount === 1) {
    score += 5;
  }

  // 3. Robots & Crawlability (Max 15 bodova)
  if (data.robotsStatus === "Valid" || data.robotsStatus === "Missing") score += 15; 

  // 4. Strukturirani Podaci & Šeme (Max 15 bodova)
  if (data.schemas.length > 0) score += 5;
  const highValueAeoSchemas = ["FAQPage", "TechArticle", "Article", "Organization", "LocalBusiness", "Product"];
  const hasHighValueSchema = data.schemas.some(s => highValueAeoSchemas.includes(s));
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
  
  // Kazneni bodovi za slike bez alt teksta (ako slike postoje)
  if (data.semanticLayoutMap.totalImages > 0) {
    const missingRatio = data.semanticLayoutMap.missingAltCount / data.semanticLayoutMap.totalImages;
    if (missingRatio <= 0.2) score += 3; // Manje od 20% slika nema alt tekst
  } else {
    score += 3; // Ako nema slika, ne penalizujemo
  }

  return Math.min(score, 100);
}

export async function analyzeUrl(formData: FormData) {
  const rawUrlInput = formData.get("url") as string;
  const url = formatUrl(rawUrlInput);

  const SCRAPING_API_KEY = process.env.SCRAPING_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!url) {
    return { error: "Please enter a valid target domain or URL." };
  }

  if (!SCRAPING_API_KEY || !GEMINI_API_KEY) {
    return { error: "Missing API keys. Check your .env.local file." };
  }

  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    if (
      hostname.includes("localhost") ||
      hostname.startsWith("127.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.")
    ) {
      return { error: "Invalid target URL." };
    }

    // ==========================================
    // ROBOTS.TXT CRAWLING AND AI BOT ANALYSIS
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
      aiBotsStatus.cohereAi = checkBot("cohere-ai");

      const isAnyBlocked = Object.values(aiBotsStatus).includes("Blocked");
      robotsStatus = isAnyBlocked ? "Blocking AI" : "Valid";
    };

    try {
      const robotsResponse = await axios.get(robotsUrl, { timeout: 7000 });
      if (robotsResponse.status === 200 && typeof robotsResponse.data === "string") {
        robotsRawContent = robotsResponse.data;
        parseRobotsConfig(robotsRawContent);
      }
    } catch {
      try {
        const scraperRobotsResponse = await axios.get("https://api.webscraping.ai/html", {
          params: {
            api_key: SCRAPING_API_KEY,
            url: robotsUrl,
            proxy: "residential",
            render: "false",
          },
          timeout: 15000,
        });

        const htmlOrText =
          typeof scraperRobotsResponse.data === "string"
            ? scraperRobotsResponse.data
            : (scraperRobotsResponse.data as ScraperResponseData)?.html || "";

        if (htmlOrText && !htmlOrText.includes("<html")) {
          robotsRawContent = htmlOrText;
          parseRobotsConfig(htmlOrText);
        } else {
          robotsStatus = "Missing";
        }
      } catch {
        robotsStatus = "Error";
        robotsRawContent = "Could not fetch or locate robots.txt file.";
      }
    }

    // ==========================================
    // SCRAPE MAIN WEBSITE
    // ==========================================
    let scrapeResponse;
    try {
      scrapeResponse = await axios.get("https://api.webscraping.ai/html", {
        params: {
          api_key: SCRAPING_API_KEY,
          url,
          proxy: "residential",
          render: "false",
        },
        timeout: 20000,
      });
    } catch {
      scrapeResponse = await axios.get("https://api.webscraping.ai/html", {
        params: {
          api_key: SCRAPING_API_KEY,
          url,
          proxy: "residential",
          render: "true",
        },
        timeout: 30000,
      });
    }

    const html =
      typeof scrapeResponse.data === "string"
        ? scrapeResponse.data
        : (scrapeResponse.data as ScraperResponseData)?.html || "";

    if (!html) {
      return { error: "Failed to retrieve website HTML." };
    }

    const $ = cheerio.load(html);

    const title = $("title").text().trim().substring(0, 150) || "No title found";
    const metaDescription = $('meta[name="description"]').attr("content")?.trim().substring(0, 300) || "No meta description";
    const h1 = $("h1").first().text().trim().substring(0, 150) || "No H1 Found";
    const h2Count = $("h2").length;

    const hasTablesOrLists = $("table").length > 0 || $("ul").length > 0 || $("ol").length > 0;

    // ==========================================
    // SEMANTIC HTML & MULTIMODAL AUDIT ENGINE
    // ==========================================
    const semanticLayoutMap: SemanticLayoutMap = {
      hasMainTag: $("main").length === 1,
      hasArticleTag: $("article").length > 0,
      hasHeadingLeap: false,
      totalImages: $("img").length,
      missingAltCount: 0,
    };

    // Provjera slika za multimodalni fokus
    $("img").each((_, el) => {
      const alt = $(el).attr("alt")?.trim();
      if (!alt) {
        semanticLayoutMap.missingAltCount++;
      }
    });

    // Detekcija skokova/anomalija u hijerarhiji naslova
    let lastHeadingLevel = 1;
    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
      const currentLevel = parseInt(el.tagName.substring(1));
      if (currentLevel - lastHeadingLevel > 1) {
        semanticLayoutMap.hasHeadingLeap = true; 
      }
      lastHeadingLevel = currentLevel;
    });

    // ==========================================
    // ENTITY AND BRAND MAPPER
    // ==========================================
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
        const potentialBrandStart = parts[0]?.trim();
        const potentialBrandEnd = parts[parts.length - 1]?.trim();
        if (potentialBrandStart && potentialBrandStart.length < 30) brandVariantsSet.add(potentialBrandStart);
        if (potentialBrandEnd && potentialBrandEnd.length < 30) brandVariantsSet.add(potentialBrandEnd);
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
      if (rawFooterBrand.length > 2) {
        brandVariantsSet.add(rawFooterBrand);
      }
    }

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")?.toLowerCase() || "";
      
      if (href.includes("wikipedia.org") || href.includes("wikidata.org")) {
        entityTrustMap.hasWikidataOrWikipedia = true;
      }
      if (href.includes("linkedin.com")) {
        entityTrustMap.hasLinkedIn = true;
      }
      if (href.includes("x.com") || href.includes("twitter.com")) {
        entityTrustMap.hasXAccount = true;
      }
      if (href.includes("facebook.com")) {
        entityTrustMap.hasFacebookAccount = true;
      }
    });

    const fullBodyLowerText = $("body").text().toLowerCase();
    const phoneRegex = /(\+?\d{1,4}[\s\-])?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/;
    const hasZipOrAddressMarkers = /\b(suite|floor|st\.|street|ave|avenue|postal|zip|code|address)\b/i.test(fullBodyLowerText);
    
    if (phoneRegex.test(fullBodyLowerText) && hasZipOrAddressMarkers) {
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
          if (Array.isArray(obj)) {
            obj.forEach(extractTypesAndNames);
            return;
          }
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
              if (typeof typedObj["name"] === "string" && typedObj["name"].length < 40) {
                brandVariantsSet.add(typedObj["name"].trim());
              }
            }
          }
        };
        extractTypesAndNames(parsed);
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
    
    entityTrustMap.detectedBrandVariants = Array.from(lowerSet).map(lowerStr => {
      const original = rawVariants.find(v => v.toLowerCase() === lowerStr);
      return original || lowerStr;
    });

    if (entityTrustMap.detectedBrandVariants.length === 0) {
      entityTrustMap.brandDisambiguationStatus = "Critical Missing";
    } else if (entityTrustMap.detectedBrandVariants.length > 2) {
      entityTrustMap.brandDisambiguationStatus = "Inconsistent";
    } else {
      entityTrustMap.brandDisambiguationStatus = "Optimal";
    }

    let qaBlocksCount = 0;
    const questionRegex = /\b(what|how|why|who|where|when|which|is|can|should|are)\b/i;

    $("h2, h3, h4, p strong").each((_, el) => {
      const text = $(el).text().trim();
      if (text.endsWith("?") || (questionRegex.test(text) && text.length < 100)) {
        const nextSibling = $(el).next();
        if (nextSibling.length > 0) {
          const siblingText = nextSibling.text().trim();
          if (siblingText.length > 15) {
            qaBlocksCount++;
          }
        }
      }
    });

    const bodyText = $("p, li, table tr, blockquote")
      .map((_, el) => {
        const text = $(el).text().trim();
        return text ? `${text} ` : "";
      })
      .get()
      .join(" ")
      .replace(/\s+/g, " ")
      .substring(0, 5000);

    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    const score = calculateScore({
      title,
      metaDescription,
      h1,
      wordCount,
      h2Count,
      schemas: detectedSchemas,
      robotsStatus,
      qaBlocksCount,
      hasTablesOrLists,
      entityTrustMap,
      semanticLayoutMap,
    });

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    type GeminiSchema = NonNullable<
      NonNullable<Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"]>["responseSchema"]
    >;

    const aeoResponseSchema = {
      type: "OBJECT",
      properties: {
        aiAnalysis: {
          type: "STRING",
          description: "Executive synthesis audit looking deeply at LLM crawlability, semantic HTML structures, heading cascade rules, multimodal image alt tags, and graph optimizations.",
        },
        recommendations: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "List of highly specific tactical adjustments needed to rank across modern answer engines.",
        },
      },
      required: ["aiAnalysis", "recommendations"],
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.15, 
        responseMimeType: "application/json",
        responseSchema: aeoResponseSchema as unknown as GeminiSchema, 
      },
    });

    const prompt = `
You are an expert Senior Answer Engine Optimisation (AEO) strategist.
Analyze the target website data context provided and perform a highly specific structural alignment audit.

WEBSITE: ${url}
ROBOTS.TXT STATUS: ${robotsStatus}
TITLE: ${title}
META DESCRIPTION: ${metaDescription}
H1: ${h1}
DETECTED EXPLICIT Q&A CONTENT BLOCKS: ${qaBlocksCount}
HAS TABLE OR BULLET GRAPH STRUCTURES: ${hasTablesOrLists}
DETECTED SCHEMA ENTITIES: ${detectedSchemas.join(", ") || "None"}

SEMANTIC LAYOUT MAP:
Has Strict Main Tag: ${semanticLayoutMap.hasMainTag}
Has Article Container Tag: ${semanticLayoutMap.hasArticleTag}
Has Bad Heading Leap (Cascade Failure): ${semanticLayoutMap.hasHeadingLeap}
Total Images Scanned: ${semanticLayoutMap.totalImages}
Images Missing Description (Alt Tag): ${semanticLayoutMap.missingAltCount}

KNOWLEDGE GRAPH FOOTPRINT MAP:
Authority Reference Outlinks (Wikipedia/Wikidata): ${entityTrustMap.hasWikidataOrWikipedia}
LinkedIn Identity Profile: ${entityTrustMap.hasLinkedIn}
X/Twitter Profile Anchor: ${entityTrustMap.hasXAccount}
Facebook Profile Anchor: ${entityTrustMap.hasFacebookAccount}
Brand Disambiguation Status: ${entityTrustMap.brandDisambiguationStatus}
Identified Raw Brand Variants Across Code Contexts: ${entityTrustMap.detectedBrandVariants.join(", ")}

CONTENT MAP SAMPLE:
${bodyText}

COMPUTED SEED OPTIMIZATION SCORE: ${score}/100
`;

    const aiResult = await model.generateContent(prompt);
    const responseText = aiResult.response.text();
    
    const parsedAiData = JSON.parse(responseText) as {
      aiAnalysis: string;
      recommendations: string[];
    };

    return {
      success: true,
      data: {
        title,
        metaDescription,
        h1,
        score,
        detectedSchemas,
        aiAnalysis: parsedAiData.aiAnalysis || "No analysis provided.",
        wordCount,
        h2Count,
        recommendations: parsedAiData.recommendations || [],
        robotsStatus,
        robotsRawContent,
        qaBlocksCount,
        hasTablesOrLists,
        aiBotsStatus,
        entityTrustMap,
        semanticLayoutMap,
      },
    };
  } catch (error) {
    console.error("FULL ERROR:", error);
    return { error: "Audit failed. Please verify the URL and try again." };
  }
}