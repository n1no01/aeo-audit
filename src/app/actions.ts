"use server";

import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
}

export interface BrandConfig {
  agencyName: string;
  primaryColor: string; // Hex code, e.g., "2563eb"
  authorName: string;
}

interface ScraperResponseData {
  html?: string;
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
}): number {
  let score = 0;

  // TITLE QUALITY
  if (data.title.length >= 30 && data.title.length <= 65) {
    score += 10;
  }

  // META DESCRIPTION QUALITY (Lowered slightly for AEO weight)
  if (data.metaDescription.length >= 120 && data.metaDescription.length <= 160) {
    score += 5;
  }

  // H1 EXISTENCE
  if (data.h1 && data.h1 !== "No H1 Found") {
    score += 10;
  }

  // HEADING STRUCTURE
  if (data.h2Count >= 3) {
    score += 10;
  }

  // CONTENT DEPTH
  if (data.wordCount >= 500) {
    score += 10;
  }

  // STRUCTURED DATA (AI engines love Knowledge Graphs)
  if (data.schemas.length > 0) {
    score += 10;
  }

  // CRITICAL AEO SCHEMAS (FAQ, Article, Product, Organization, etc.)
  const highValueAeoSchemas = ["FAQPage", "TechArticle", "Article", "Organization", "LocalBusiness", "Product"];
  const hasHighValueSchema = data.schemas.some(s => highValueAeoSchemas.includes(s));
  if (hasHighValueSchema) {
    score += 15;
  }

  // EXPLICIT Q&A BLOCKS (Crucial for Featured Snippets / AI Citations)
  if (data.qaBlocksCount >= 2) {
    score += 15;
  } else if (data.qaBlocksCount === 1) {
    score += 7;
  }

  // SEMANTIC STRUCTURE SIGNAL (Presence of dense layout maps like lists or tables)
  if (data.hasTablesOrLists) {
    score += 10;
  }

  // ROBOTS.TXT EVALUATION
  if (data.robotsStatus === "Valid" || data.robotsStatus === "Missing") {
    score += 5; 
  } else if (data.robotsStatus === "Blocking AI") {
    score += 0; 
  }

  return Math.min(score, 100);
}

export async function analyzeUrl(formData: FormData) {
  const url = formData.get("url") as string;

  const SCRAPING_API_KEY = process.env.SCRAPING_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!url || !url.startsWith("http")) {
    return {
      error: "Please enter a valid URL (e.g. https://example.com).",
    };
  }

  if (!SCRAPING_API_KEY || !GEMINI_API_KEY) {
    return {
      error: "Missing API keys. Check your .env.local file.",
    };
  }

  try {
    // SSRF PROTECTION
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    if (
      hostname.includes("localhost") ||
      hostname.startsWith("127.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.")
    ) {
      return {
        error: "Invalid target URL.",
      };
    }

    // ==========================================
    // ROBOTS.TXT CRAWLING AND AI BOT ANALYSIS
    // ==========================================
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`;
    let robotsRawContent = "";
    let robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error" = "Missing";

    const checkAiBlockers = (content: string): boolean => {
      const lower = content.toLowerCase();
      const aiBots = [
        "gptbot",
        "claudebot",
        "perplexitybot",
        "oai-searchbot",
        "google-extended",
        "anthropic-ai",
        "cohere-ai"
      ];

      const blocksAll = lower.includes("user-agent: *") && (lower.includes("disallow: /") || lower.includes("disallow: / "));
      const blocksSpecificAi = aiBots.some(bot => lower.includes(`user-agent: ${bot}`)) && (lower.includes("disallow: /") || lower.includes("disallow: / "));

      return blocksAll || blocksSpecificAi;
    };

    try {
      const robotsResponse = await axios.get(robotsUrl, { timeout: 7000 });
      if (robotsResponse.status === 200 && typeof robotsResponse.data === "string") {
        robotsRawContent = robotsResponse.data;
        robotsStatus = checkAiBlockers(robotsRawContent) ? "Blocking AI" : "Valid";
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
          robotsStatus = checkAiBlockers(robotsRawContent) ? "Blocking AI" : "Valid";
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
      return {
        error: "Failed to retrieve website HTML.",
      };
    }

    const $ = cheerio.load(html);

    // BASIC SEO ELEMENTS
    const title = $("title").text().trim().substring(0, 150) || "No title found";
    const metaDescription = $('meta[name="description"]').attr("content")?.trim().substring(0, 300) || "No meta description";
    const h1 = $("h1").first().text().trim().substring(0, 150) || "No H1 Found";
    const h2Count = $("h2").length;

    // STRUCTURAL ELEMENT DETECTION
    const hasTablesOrLists = $("table").length > 0 || $("ul").length > 0 || $("ol").length > 0;

    // ==========================================
    // EXPLICIT Q&A BLOCK DETECTION LOGIC
    // ==========================================
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

    // CONTENT EXTRACTION WITH LAYOUT CAPTURE
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

    // SCHEMA EXTRACTION
    const schemaScripts = $('script[type="application/ld+json"]');
    const schemaSet = new Set<string>();

    schemaScripts.each((_, el) => {
      const content = $(el).html();
      if (!content?.includes("@context")) return;

      try {
        const parsed: unknown = JSON.parse(content);
        const extractTypes = (obj: unknown): void => {
          if (!obj) return;
          if (Array.isArray(obj)) {
            obj.forEach(extractTypes);
            return;
          }
          if (typeof obj !== "object") return;

          const typedObj = obj as Record<string, unknown>;
          if (typedObj["@graph"]) extractTypes(typedObj["@graph"]);

          if (typedObj["@type"]) {
            const typeValue = typedObj["@type"];
            if (Array.isArray(typeValue)) {
              typeValue.forEach((t) => { if (typeof t === "string") schemaSet.add(t); });
            } else if (typeof typeValue === "string") {
              schemaSet.add(typeValue);
            }
          }
        };
        extractTypes(parsed);
      } catch {}
    });

    const detectedSchemas = Array.from(schemaSet);

    // DETERMINISTIC SCORE 
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
    });

    // ==========================================
    // AI ANALYSIS VIA GEMINI (STRUCTURED JSON RESPONSE)
    // ==========================================
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    type GeminiSchema = NonNullable<
      NonNullable<Parameters<typeof genAI.getGenerativeModel>[0]["generationConfig"]>["responseSchema"]
    >;

    const aeoResponseSchema = {
      type: "OBJECT",
      properties: {
        aiAnalysis: {
          type: "STRING",
          description: "Executive synthesis audit looking deeply at LLM crawlability, conversational alignment, semantic authority formatting, and entity parsing optimizations.",
        },
        recommendations: {
          type: "ARRAY",
          items: {
            type: "STRING",
          },
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
Analyze the target website data context provided and perform a highly specific structural alignment audit. Evaluate layout architectures (tables, bullet points), question phrasing relevance, and explicit AI agent accessibility configurations across the robots file rules.

WEBSITE:
${url}

ROBOTS.TXT STATUS:
${robotsStatus}

ROBOTS.TXT CONTENT:
${robotsRawContent || "No robots.txt content available."}

TITLE:
${title}

META DESCRIPTION:
${metaDescription}

H1:
${h1}

H2 COUNT:
${h2Count}

WORD COUNT:
${wordCount}

DETECTED EXPLICIT Q&A CONTENT BLOCKS:
${qaBlocksCount}

HAS TABLE OR BULLET GRAPH STRUCTURES:
${hasTablesOrLists}

DETECTED SCHEMA ENTITIES:
${detectedSchemas.join(", ") || "None"}

CONTENT MAP SAMPLE:
${bodyText}

COMPUTED SEED OPTIMIZATION SCORE:
${score}/100
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
      },
    };
  } catch (error) {
    console.error("FULL ERROR:", error);

    return {
      error: "Audit failed. Please verify the URL and try again.",
    };
  }
}