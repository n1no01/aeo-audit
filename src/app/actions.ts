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
}): number {
  let score = 0;

  // TITLE QUALITY
  if (data.title.length >= 30 && data.title.length <= 65) {
    score += 15;
  }

  // META DESCRIPTION QUALITY
  if (
    data.metaDescription.length >= 120 &&
    data.metaDescription.length <= 160
  ) {
    score += 15;
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

  // STRUCTURED DATA
  if (data.schemas.length > 0) {
    score += 10;
  }

  // FAQ OPTIMIZATION
  if (data.schemas.includes("FAQPage")) {
    score += 10;
  }

  // TRUST / ENTITY SIGNALS
  if (
    data.schemas.includes("Organization") ||
    data.schemas.includes("LocalBusiness")
  ) {
    score += 10;
  }

  // ROBOTS.TXT EVALUACIJA
  if (data.robotsStatus === "Valid") {
    score += 10;
  } else if (data.robotsStatus === "Blocking AI") {
    score += 2;
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
    // ROBOTS.TXT KRAULOVANJE I ANALIZA
    // ==========================================
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`;
    let robotsRawContent = "";
    let robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error" = "Missing";

    try {
      const robotsResponse = await axios.get(robotsUrl, { timeout: 7000 });
      if (robotsResponse.status === 200 && typeof robotsResponse.data === "string") {
        robotsRawContent = robotsResponse.data;
        robotsStatus = "Valid";

        const lowerContent = robotsRawContent.toLowerCase();
        if (
          lowerContent.includes("user-agent: gptbot") ||
          lowerContent.includes("user-agent: claudebot") ||
          (lowerContent.includes("user-agent: *") && lowerContent.includes("disallow: /"))
        ) {
          if (lowerContent.includes("disallow: /") || lowerContent.includes("disallow: / ")) {
            robotsStatus = "Blocking AI";
          }
        }
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
          robotsStatus = "Valid";
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

    const metaDescription =
      $('meta[name="description"]')
        .attr("content")
        ?.trim()
        .substring(0, 300) || "No meta description";

    const h1 =
      $("h1")
        .first()
        .text()
        .trim()
        .substring(0, 150) || "No H1 Found";

    const h2Count = $("h2").length;

    // CONTENT EXTRACTION
    const bodyText = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .join(" ")
      .replace(/\s+/g, " ")
      .substring(0, 4000);

    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    // SCHEMA EXTRACTION (100% Sigurno od 'any' ključne riječi)
    const schemaScripts = $('script[type="application/ld+json"]');
    const schemaSet = new Set<string>();

    schemaScripts.each((_, el) => {
      const content = $(el).html();

      if (!content?.includes("@context")) {
        return;
      }

      try {
        const parsed: unknown = JSON.parse(content);

        const extractTypes = (obj: unknown): void => {
          if (!obj) return;

          if (Array.isArray(obj)) {
            obj.forEach(extractTypes);
            return;
          }

          if (typeof obj !== "object") {
            return;
          }

          const typedObj = obj as Record<string, unknown>;

          if (typedObj["@graph"]) {
            extractTypes(typedObj["@graph"]);
          }

          if (typedObj["@type"]) {
            const typeValue = typedObj["@type"];

            if (Array.isArray(typeValue)) {
              typeValue.forEach((t) => {
                if (typeof t === "string") {
                  schemaSet.add(t);
                }
              });
            } else if (typeof typeValue === "string") {
              schemaSet.add(typeValue);
            }
          }
        };

        extractTypes(parsed);
      } catch {
        // Ignoriši neispravan JSON unutar skripte
      }
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
    });

    // AI ANALYSIS via Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.2,
      },
    });

    const prompt = `
You are a Senior Answer Engine Optimisation strategist.
Analyze this website data and provide a professional executive audit. Pay special attention to the robots.txt file to see if it is correctly structured and if it blocks AI crawlers (like GPTBot, ClaudeBot, etc.).

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

DETECTED SCHEMA:
${detectedSchemas.join(", ") || "None"}

CONTENT SAMPLE:
${bodyText}

CURRENT SCORE:
${score}/100

Return EXACTLY in this format:

ANALYSIS:
[professional analysis, including a sub-section explicitly evaluating the robots.txt file structure and its friendliness towards AI agents]

RECOMMENDATIONS:
- recommendation
- recommendation
- recommendation
`;

    const aiResult = await model.generateContent(prompt);
    const aiText = aiResult.response.text();

    const analysisMatch = aiText.match(
      /ANALYSIS:\s*([\s\S]*?)RECOMMENDATIONS:/i
    );

    const recommendationsMatch = aiText.match(
      /RECOMMENDATIONS:\s*([\s\S]*)/i
    );

    const aiAnalysis = analysisMatch?.[1]?.trim() || "No AI analysis generated.";

    const recommendations =
      recommendationsMatch?.[1]
        ?.split("\n")
        .map((line) => line.replace("-", "").trim())
        .filter(Boolean) || [];

    return {
      success: true,
      data: {
        title,
        metaDescription,
        h1,
        score,
        detectedSchemas,
        aiAnalysis,
        wordCount,
        h2Count,
        recommendations,
        robotsStatus,
        robotsRawContent,
      } as AuditData,
    };
  } catch (error) {
    console.error("FULL ERROR:", error);

    return {
      error: "Audit failed. Please verify the URL and try again.",
    };
  }
}