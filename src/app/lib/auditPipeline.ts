import { scrapeWebsite } from "./scraper";
import { calculateScoreBreakdown, ScoreBreakdownResult } from "./scorer";
import { generateAiAnalysis } from "./gemini";
import { getUrlsFromSitemap } from "./crawler";
import { aggregateDomainResults } from "./aggregator";
import { ScrapedData } from "./types";

export type AuditMode = "single" | "domain";

const BATCH_SIZE = 5;
const MAX_DOMAIN_PAGES = 15;

interface PageResult {
  pageUrl: string;
  scraped: ScrapedData;
  result: ScoreBreakdownResult;
  score: number;
}

async function scrapeBatch(urls: string[], apiKey: string): Promise<PageResult[]> {
  const out: PageResult[] = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const settled = await Promise.allSettled(
      urls.slice(i, i + BATCH_SIZE).map(async (pageUrl) => {
        const scraped = await scrapeWebsite(pageUrl, apiKey);
        const result = calculateScoreBreakdown(scraped);
        return { pageUrl, scraped, result, score: result.totalScore };
      })
    );
    for (const s of settled) {
      if (s.status === "fulfilled") out.push(s.value);
      else console.error("[pipeline] page failed:", s.reason);
    }
  }
  return out;
}

/**
 * The ONE place an audit is produced. The web dashboard and the Chrome extension both call this,
 * so the same URL always yields the same score and the same stored shape.
 */
export async function runAudit(opts: {
  url: string;
  mode: AuditMode;
  scrapingKey: string;
  geminiKey: string;
  source?: string;
}) {
  const { url, mode, scrapingKey, geminiKey, source } = opts;

  if (mode === "domain") {
    const targetUrls = await getUrlsFromSitemap(url, MAX_DOMAIN_PAGES);
    const pages = await scrapeBatch(targetUrls, scrapingKey);
    if (pages.length === 0) throw new Error("Unable to crawl domain sample pages.");

    // The homepage (index 0 of the sample) is the representative page; the score is the sample average.
    const primary = pages.find((p) => p.pageUrl === targetUrls[0]) ?? pages[0];
    const avgScore = Math.round(pages.reduce((a, p) => a + p.score, 0) / pages.length);
    const rawAvg = Math.round(pages.reduce((a, p) => a + p.result.rawScore, 0) / pages.length);

    const domainStats = aggregateDomainResults(pages);
    const ai = await generateAiAnalysis(primary.scraped, avgScore, url, geminiKey, {
      isDomainAudit: true,
      pagesAudited: pages.length,
      domainStats,
      breakdown: primary.result.breakdown,
      scoreCapReason: primary.result.capReason,
    });

    return {
      ...primary.scraped,
      website_url: url,
      score: avgScore,
      rawScore: rawAvg,
      scoreCapReason: primary.result.capReason,
      scoreBreakdown: primary.result.breakdown,
      pageCategory: ai.pageCategory || primary.scraped.pageCategory || "General Website",
      aiAnalysis: `[Multi-Page Domain Audit (Sample: ${pages.length} pages)]\n\n${ai.aiAnalysis}`,
      recommendations: ai.recommendations,
      bluffScore: ai.bluffScore,
      atomicStructureScore: ai.atomicStructureScore,
      entityDensityScore: ai.entityDensityScore,
      sentenceSimplicityScore: ai.sentenceSimplicityScore,
      commodityContentScore: ai.commodityContentScore,
      keywordsData: ai.keywordsData,
      isDomainAudit: true,
      pagesAuditedCount: pages.length,
      sampledPages: pages.map((p) => ({ url: p.pageUrl, score: p.score })),
      domainStats,
      ...(source ? { source } : {}),
    };
  }

  const scraped = await scrapeWebsite(url, scrapingKey);
  const result = calculateScoreBreakdown(scraped);
  const ai = await generateAiAnalysis(scraped, result.totalScore, url, geminiKey, {
    breakdown: result.breakdown,
    scoreCapReason: result.capReason,
  });

  return {
    ...scraped,
    website_url: url,
    score: result.totalScore,
    rawScore: result.rawScore,
    scoreCapReason: result.capReason,
    scoreBreakdown: result.breakdown,
    pageCategory: ai.pageCategory || "Uncategorized",
    aiAnalysis: ai.aiAnalysis,
    recommendations: ai.recommendations,
    bluffScore: ai.bluffScore,
    atomicStructureScore: ai.atomicStructureScore,
    entityDensityScore: ai.entityDensityScore,
    sentenceSimplicityScore: ai.sentenceSimplicityScore,
    commodityContentScore: ai.commodityContentScore,
    keywordsData: ai.keywordsData,
    ...(source ? { source } : {}),
  };
}
