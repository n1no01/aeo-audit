"use server";

import { formatUrl } from "./lib/utils";
import { scrapeWebsite } from "./lib/scraper";
import { calculateScore } from "./lib/scorer";
import { generateAiAnalysis } from "./lib/gemini";
import { ScrapedData } from "./lib/types";

export async function analyzeUrl(formData: FormData) {
  const rawUrlInput = formData.get("url") as string;
  const url = formatUrl(rawUrlInput);

  const SCRAPING_API_KEY = process.env.SCRAPING_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!url) return { error: "Please enter a valid target domain or URL." };
  if (!SCRAPING_API_KEY || !GEMINI_API_KEY) return { error: "Missing API configuration keys." };

  try {
    // 1. Izvrši scraping i HTML ekstrakciju
    const scrapedResult = await scrapeWebsite(url, SCRAPING_API_KEY) as ScrapedData;
    
    // 2. Izračunaj matematičke bodove
    const score = calculateScore(scrapedResult);
    
    // 3. Generiši AI dubinske uvide preko Gemini API-ja
    const aiData = await generateAiAnalysis(scrapedResult, score, url, GEMINI_API_KEY);

    return {
      success: true,
      data: {
        ...scrapedResult,
        score,
        aiAnalysis: aiData.aiAnalysis || "No analysis provided.",
        recommendations: aiData.recommendations || [],
      },
    };
  } catch (error) {
    console.error("CRITICAL AUDIT ERROR CONTROL:", error);
    return { error: "Audit failed. Please verify the URL and infrastructure keys." };
  }
}