import { ScrapedData, DomainAggregatedStats } from "./types";

export type { DomainAggregatedStats };

const NO_H1 = "No H1 Found";
const NO_META = "No meta description";

function pct(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

function emptyStats(): DomainAggregatedStats {
  return {
    totalPagesAudited: 0,
    schemaCoveragePercent: 0,
    hasH1CoveragePercent: 0,
    hasMetaDescriptionPercent: 0,
    avgWordCount: 0,
    qaBlocksCoveragePercent: 0,
    tablesOrListsCoveragePercent: 0,
    openGraphCoveragePercent: 0,
    detectedSchemaTypes: [],
    hasSocialAnchorsPercent: 0,
    hasWikiLinksPercent: 0,
    robotsStatus: "Unknown",
    hasLlmsTxt: false,
    botProtectionDetected: false,
    missingSchemaPages: [],
    missingH1Pages: [],
  };
}

export function aggregateDomainResults(
  scrapedResults: { pageUrl: string; scraped: ScrapedData; score: number }[]
): DomainAggregatedStats {
  const total = scrapedResults.length;
  if (total === 0) return emptyStats();

  let schemaCount = 0;
  let h1Count = 0;
  let metaDescCount = 0;
  let totalWords = 0;
  let qaPages = 0;
  let tablesOrListsPages = 0;
  let ogCount = 0;
  let socialAnchorsCount = 0;
  let wikiLinksCount = 0;

  const schemaMap: Record<string, number> = {};
  const missingSchemaPages: string[] = [];
  const missingH1Pages: string[] = [];

  for (const { pageUrl, scraped } of scrapedResults) {
    const schemas = Array.isArray(scraped.detectedSchemas) ? scraped.detectedSchemas : [];
    if (schemas.length > 0) schemaCount++;
    else missingSchemaPages.push(pageUrl);

    for (const name of schemas) {
      if (typeof name === "string" && name.trim()) schemaMap[name] = (schemaMap[name] || 0) + 1;
    }

    // The scraper stores placeholder strings for missing values, so "non-empty" is NOT "present".
    const h1 = (scraped.h1 ?? "").trim();
    if (h1 && h1 !== NO_H1) h1Count++;
    else missingH1Pages.push(pageUrl);

    const meta = (scraped.metaDescription ?? "").trim();
    if (meta && meta !== NO_META) metaDescCount++;

    if (scraped.hasOpenGraph) ogCount++;

    totalWords += Number(scraped.wordCount) || 0;
    if ((scraped.qaBlocksCount ?? 0) > 0) qaPages++;
    if (scraped.hasTablesOrLists) tablesOrListsPages++;

    const trust = scraped.entityTrustMap;
    if (trust?.hasLinkedIn || trust?.hasXAccount || trust?.hasFacebookAccount) socialAnchorsCount++;
    if (trust?.hasWikidataOrWikipedia) wikiLinksCount++;
  }

  const detectedSchemaTypes = Object.entries(schemaMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // robots.txt / llms.txt / bot protection are domain-level facts: take them from ANY page, not just the first.
  const robotsStatus =
    scrapedResults.map((r) => r.scraped.robotsStatus).find((s) => s === "Blocking AI") ??
    scrapedResults[0].scraped.robotsStatus ??
    "Unknown";

  return {
    totalPagesAudited: total,
    schemaCoveragePercent: pct(schemaCount, total),
    hasH1CoveragePercent: pct(h1Count, total),
    hasMetaDescriptionPercent: pct(metaDescCount, total),
    avgWordCount: Math.round(totalWords / total),
    qaBlocksCoveragePercent: pct(qaPages, total),
    tablesOrListsCoveragePercent: pct(tablesOrListsPages, total),
    openGraphCoveragePercent: pct(ogCount, total),
    detectedSchemaTypes,
    hasSocialAnchorsPercent: pct(socialAnchorsCount, total),
    hasWikiLinksPercent: pct(wikiLinksCount, total),
    robotsStatus,
    hasLlmsTxt: scrapedResults.some((r) => r.scraped.llmsTxtStatus === "Present" || Boolean(r.scraped.llmsRawContent?.trim())),
    botProtectionDetected: scrapedResults.some((r) => Boolean(r.scraped.aiAccessibility?.cloudflareDetected)),
    missingSchemaPages,
    missingH1Pages,
  };
}
