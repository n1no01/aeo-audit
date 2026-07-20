import { ScrapedData } from "./types";

export interface DomainAggregatedStats {
  totalPagesAudited: number;
  schemaCoveragePercent: number;
  hasH1CoveragePercent: number;
  hasMetaDescriptionPercent: number;
  avgWordCount: number;
  
  // 🚀 NOVE AEO & RAG METRIKE
  qaBlocksCoveragePercent: number;
  tablesOrListsCoveragePercent: number;
  openGraphCoveragePercent: number;
  detectedSchemaTypes: { type: string; count: number }[];
  
  // Brand & Social Footprint
  hasSocialAnchorsPercent: number;
  hasWikiLinksPercent: number;
  
  // Bot & Crawlability Directives
  robotsStatus: string;
  hasLlmsTxt: boolean;
  botProtectionDetected: boolean;

  missingSchemaPages: string[];
  missingH1Pages: string[];
}

function isNonEmptyArray(val: unknown): boolean {
  return Array.isArray(val) && val.length > 0;
}

export function aggregateDomainResults(
  scrapedResults: { pageUrl: string; scraped: ScrapedData; score: number }[]
): DomainAggregatedStats {
  const total = scrapedResults.length;
  if (total === 0) {
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

  let schemaCount = 0;
  let h1Count = 0;
  let metaDescCount = 0;
  let totalWords = 0;
  let qaBlocksCount = 0;
  let tablesOrListsCount = 0;
  let ogCount = 0;
  let socialAnchorsCount = 0;
  let wikiLinksCount = 0;

  const schemaMap: Record<string, number> = {};
  const missingSchemaPages: string[] = [];
  const missingH1Pages: string[] = [];

  for (const item of scrapedResults) {
    const { pageUrl, scraped } = item;
    const rec = (scraped as unknown) as Record<string, unknown>;

    // 1. Schema Check
    const hasSchema = Boolean(
      isNonEmptyArray(rec.jsonLd) ||
      isNonEmptyArray(rec.jsonLdData) ||
      isNonEmptyArray(rec.schemaData) ||
      rec.hasSchema === true
    );

    if (hasSchema) {
      schemaCount++;
    } else {
      missingSchemaPages.push(pageUrl);
    }

    // Schema Types Aggregation
    const schemas = (Array.isArray(rec.detectedSchemas) ? rec.detectedSchemas : []) as string[];
    for (const schemaName of schemas) {
      if (typeof schemaName === "string" && schemaName.trim().length > 0) {
        schemaMap[schemaName] = (schemaMap[schemaName] || 0) + 1;
      }
    }

    // 2. H1 Check
    const headingsObj = (typeof rec.headings === "object" && rec.headings !== null)
      ? (rec.headings as Record<string, unknown>)
      : null;

    const hasH1 = Boolean(
      (headingsObj && isNonEmptyArray(headingsObj.h1)) ||
      isNonEmptyArray(rec.h1) ||
      isNonEmptyArray(rec.h1s) ||
      (typeof rec.h1 === "string" && rec.h1.trim().length > 0) ||
      rec.hasH1 === true
    );

    if (hasH1) {
      h1Count++;
    } else {
      missingH1Pages.push(pageUrl);
    }

    // 3. Meta opis & OG
    const metaDesc = (typeof rec.metaDescription === "string" ? rec.metaDescription : "") ||
                     (typeof rec.description === "string" ? rec.description : "");
    if (metaDesc.trim().length > 0) metaDescCount++;

    const ogTitle = typeof rec.ogTitle === "string" ? rec.ogTitle : "";
    if (ogTitle.trim().length > 0) ogCount++;

    // 4. Broj riječi
    const words = typeof rec.wordCount === "number" ? rec.wordCount :
                  typeof rec.wordsCount === "number" ? rec.wordsCount : 0;
    totalWords += words;

    // 5. Q&A i Tabele/Liste za RAG
    const qaNum = typeof rec.qaBlocksCount === "number" ? rec.qaBlocksCount : 0;
    if (qaNum > 0) qaBlocksCount++;

    if (rec.hasTablesOrLists === true) tablesOrListsCount++;

    // 6. Social & Wiki Anchors
    const entityTrustMap = (typeof rec.entityTrustMap === "object" && rec.entityTrustMap !== null)
      ? (rec.entityTrustMap as Record<string, unknown>)
      : {};

    if (entityTrustMap.hasLinkedIn || entityTrustMap.hasXAccount || entityTrustMap.hasFacebookAccount) {
      socialAnchorsCount++;
    }

    if (entityTrustMap.hasWikidataOrWikipedia) {
      wikiLinksCount++;
    }
  }

  // Formatiranje mape šema u sortiran niz
  const detectedSchemaTypes = Object.entries(schemaMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const primaryScraped = (scrapedResults[0]?.scraped as unknown) as Record<string, unknown>;
  const primaryAiAccess = (typeof primaryScraped.aiAccessibility === "object" && primaryScraped.aiAccessibility !== null)
    ? (primaryScraped.aiAccessibility as Record<string, unknown>)
    : {};

  return {
    totalPagesAudited: total,
    schemaCoveragePercent: Math.round((schemaCount / total) * 100),
    hasH1CoveragePercent: Math.round((h1Count / total) * 100),
    hasMetaDescriptionPercent: Math.round((metaDescCount / total) * 100),
    avgWordCount: Math.round(totalWords / total),

    qaBlocksCoveragePercent: Math.round((qaBlocksCount / total) * 100),
    tablesOrListsCoveragePercent: Math.round((tablesOrListsCount / total) * 100),
    openGraphCoveragePercent: Math.round((ogCount / total) * 100),
    detectedSchemaTypes,

    hasSocialAnchorsPercent: Math.round((socialAnchorsCount / total) * 100),
    hasWikiLinksPercent: Math.round((wikiLinksCount / total) * 100),

    robotsStatus: typeof primaryScraped.robotsStatus === "string" ? primaryScraped.robotsStatus : "Allowed",
    hasLlmsTxt: Boolean(primaryScraped.llmsTxtContent),
    botProtectionDetected: Boolean(primaryAiAccess.cloudflareDetected),

    missingSchemaPages,
    missingH1Pages,
  };
}