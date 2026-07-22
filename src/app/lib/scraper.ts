import axios, { AxiosResponse } from "axios";
import * as cheerio from "cheerio";
import {
  ScrapedData,
  BotStatus,
  EntityTrustMap,
  SemanticLayoutMap,
  AIAccessibilityResult,
} from "./types";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface ScraperResponseData {
  html?: string;
}

type CloudflareSeverity = "None" | "Soft" | "Hard";

interface CloudflareResult {
  detected: boolean;
  severity: CloudflareSeverity;
  confirmedBlock: boolean;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function isValidSocialProfile(
  url: string,
  platform: "linkedin" | "x" | "facebook"
): boolean {
  if (!url) return false;
  const cleanUrl = url.trim().toLowerCase();

  const strictlyMainDomains = [
    "https://linkedin.com",
    "https://www.linkedin.com",
    "linkedin.com",
    "linkedin.com/",
    "https://x.com",
    "https://www.x.com",
    "x.com",
    "x.com/",
    "https://twitter.com",
    "https://www.twitter.com",
    "twitter.com",
    "twitter.com/",
    "https://facebook.com",
    "https://www.facebook.com",
    "facebook.com",
    "facebook.com/",
  ];

  if (strictlyMainDomains.includes(cleanUrl)) return false;

  if (platform === "linkedin") {
    return /linkedin\.com\/(in|company|school|pub|showcase)\/[a-zA-Z0-9-_]+/i.test(
      cleanUrl
    );
  }

  if (platform === "x") {
    const match = cleanUrl.match(/(x|twitter)\.com\/([a-zA-Z0-9-_]+)/i);
    if (!match) return false;
    const ignored = [
      "home",
      "intent",
      "share",
      "widgets",
      "privacy",
      "tos",
      "search",
      "i",
    ];
    return !ignored.includes(match[2]);
  }

  if (platform === "facebook") {
    const match = cleanUrl.match(/facebook\.com\/([a-zA-Z0-9-_\.]+)/i);
    if (!match) return false;
    const ignored = ["sharer", "share", "plugins", "policies", "pages"];
    return !ignored.includes(match[1]);
  }

  return false;
}

function looksLikeCloudflareChallenge(html: string): boolean {
  return (
    html.includes("Just a moment...") ||
    html.includes("Attention Required!") ||
    html.includes("cf-browser-verification") ||
    html.includes("Checking your browser before accessing") ||
    html.includes("Enable JavaScript and cookies to continue") ||
    html.includes("cf-spinner") ||
    html.includes("__cf_chl")
  );
}

function extractHtml(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    return (data as ScraperResponseData).html ?? "";
  }
  return "";
}

// ─────────────────────────────────────────────
// ROBOTS.TXT FETCHING (Optimized timeouts)
// ─────────────────────────────────────────────

async function fetchRobotsTxt(
  robotsUrl: string,
  scrapingApiKey: string
): Promise<{ content: string; status: number }> {
  try {
    const res = await axios.get<string>(robotsUrl, {
      timeout: 3000,
      validateStatus: (s) => s === 200 || s === 404,
    });
    if (res.status === 200 && typeof res.data === "string") {
      return { content: res.data, status: 200 };
    }
    if (res.status === 404) {
      return { content: "", status: 404 };
    }
  } catch {
    // fall through
  }

  try {
    const res = await axios.get("https://api.webscraping.ai/html", {
      params: {
        api_key: scrapingApiKey,
        url: robotsUrl,
        js: false,
      },
      timeout: 5000,
      validateStatus: (s) => s === 200 || s === 404,
    });

    const targetStatus = Number(res.headers["x-target-status"] ?? res.status);
    if (targetStatus === 404) return { content: "", status: 404 };

    const html = extractHtml(res.data);
    if (html && !html.trimStart().startsWith("<")) {
      return { content: html, status: 200 };
    }
  } catch {
    // fall through
  }

  return { content: "", status: -1 };
}

// ─────────────────────────────────────────────
// LLMS.TXT FETCHING (Optimized timeouts)
// ─────────────────────────────────────────────

async function fetchLlmsTxt(
  llmsUrl: string,
  scrapingApiKey: string
): Promise<{ content: string; status: number }> {
  try {
    const res = await axios.get<string>(llmsUrl, {
      timeout: 3000,
      validateStatus: (s) => s === 200 || s === 404,
    });
    if (res.status === 200 && typeof res.data === "string") {
      return { content: res.data, status: 200 };
    }
    if (res.status === 404) {
      return { content: "", status: 404 };
    }
  } catch {
    // fall through
  }

  try {
    const res = await axios.get("https://api.webscraping.ai/html", {
      params: {
        api_key: scrapingApiKey,
        url: llmsUrl,
        js: false,
      },
      timeout: 5000,
      validateStatus: (s) => s === 200 || s === 404,
    });

    const targetStatus = Number(res.headers["x-target-status"] ?? res.status);
    if (targetStatus === 404) return { content: "", status: 404 };

    const html = extractHtml(res.data);
    if (html && !html.trimStart().startsWith("<")) {
      return { content: html, status: 200 };
    }
  } catch {
    // fall through
  }

  return { content: "", status: -1 };
}

// ─────────────────────────────────────────────
// ROBOTS.TXT PARSER (Striktno pojedinačna provjera)
// ─────────────────────────────────────────────

const BOT_TOKENS: Record<string, Array<keyof BotStatus>> = {
  googlebot: ["googlebot"],
  "oai-searchbot": ["oaiSearchBot"],
  "claude-searchbot": ["claudeSearchBot"],
  "claude-user": ["claudeUser"],
  perplexitybot: ["perplexityBot"],
  bingbot: ["bingbot"],
  "meta-externalagent": ["metaExternalAgent"],
  grokbot: ["grokBot"],
  "xai-grok": ["grokBot"],
  grok: ["grokBot"],
};

function parseRobotsTxt(content: string): {
  aiBotsStatus: BotStatus;
  robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error";
} {
  const aiBotsStatus: BotStatus = {
    googlebot: "Allowed",
    oaiSearchBot: "Allowed",
    claudeSearchBot: "Allowed",
    claudeUser: "Allowed",
    perplexityBot: "Allowed",
    bingbot: "Allowed",
    metaExternalAgent: "Allowed",
    grokBot: "Allowed",
  };

  const lines = content.split(/\r?\n/).map((raw) => {
    const withoutComment = raw.split("#")[0].trimEnd();
    return withoutComment.trim();
  });

  let currentAgents: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === "") {
      currentAgents = [];
      continue;
    }

    const lower = line.toLowerCase();

    if (lower.startsWith("user-agent:")) {
      const agent = lower.replace("user-agent:", "").trim();
      if (agent) currentAgents.push(agent);
      continue;
    }

    if (lower.startsWith("disallow:")) {
      const path = lower.replace("disallow:", "").trim();

      if (path !== "/" && path !== "/*") continue;
      if (currentAgents.length === 0) continue;

      for (const agent of currentAgents) {
        if (agent === "*") {
          (Object.keys(aiBotsStatus) as Array<keyof BotStatus>).forEach(
            (k) => {
              aiBotsStatus[k] = "Blocked";
            }
          );
          break;
        }

        for (const [token, targets] of Object.entries(BOT_TOKENS)) {
          if (agent === token || agent.includes(token)) {
            targets.forEach((t) => {
              aiBotsStatus[t] = "Blocked";
            });
          }
        }
      }

      continue;
    }
  }

  const anyBlocked = (
    Object.values(aiBotsStatus) as string[]
  ).includes("Blocked");

  return {
    aiBotsStatus,
    robotsStatus: anyBlocked ? "Blocking AI" : "Valid",
  };
}

// ─────────────────────────────────────────────
// CLOUDFLARE DETECTION
// ─────────────────────────────────────────────

function isBlockedResponse(status: number, headers: Record<string, unknown>, html: string): boolean {
  if (status === 403 || status === 503 || status === 429) return true;
  if (looksLikeCloudflareChallenge(html)) return true;
  if (headers["cf-mitigated"]) return true;
  if (String(headers["server"] ?? "").toLowerCase().includes("cloudflare")) return true;
  if (headers["cf-ray"]) return true;

  if (html.includes("Access Denied") && html.includes("</title>")) return true;
  if (html.includes("Request blocked") || html.includes("Bot verification")) return true;
  if (html.includes("security check") && html.length < 5000) return true;
  if (html.includes("Your IP has been blocked")) return true;
  if (html.includes("Please verify you are a human")) return true;

  return false;
}

async function detectCloudflare(
  url: string,
  scrapingApiKey: string
): Promise<CloudflareResult> {
  let phase1Blocked = false;

  try {
    const res = await axios.get(url, {
      timeout: 4000,
      validateStatus: () => true,
      maxRedirects: 3,
      headers: {
        "User-Agent": "OAI-SearchBot/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = typeof res.data === "string" ? res.data : "";
    phase1Blocked = isBlockedResponse(res.status, res.headers as Record<string, unknown>, html);
  } catch {
    phase1Blocked = true;
  }

  if (!phase1Blocked) {
    return { detected: false, severity: "None", confirmedBlock: false };
  }

  return { detected: true, severity: "Soft", confirmedBlock: false };
}

// ─────────────────────────────────────────────
// AI ACCESSIBILITY
// ─────────────────────────────────────────────

function buildAIAccessibility(
  aiBotsStatus: BotStatus,
  cloudflare: CloudflareResult
): AIAccessibilityResult {
  const botMap: Record<string, keyof BotStatus> = {
    Googlebot: "googlebot",
    "OAI-SearchBot": "oaiSearchBot",
    "Claude-SearchBot": "claudeSearchBot",
    "Claude-User": "claudeUser",
    PerplexityBot: "perplexityBot",
    Bingbot: "bingbot",
    "Meta-ExternalAgent": "metaExternalAgent",
    GrokBot: "grokBot",
  };

  const userAgentTests: AIAccessibilityResult["userAgentTests"] = {};
  let blockedCount = 0;

  for (const [displayName, statusKey] of Object.entries(botMap)) {
    const robotsBlocked = aiBotsStatus[statusKey] === "Blocked";
    const cfBlocked = cloudflare.confirmedBlock;
    const blocked = robotsBlocked || cfBlocked;

    if (blocked) blockedCount++;

    userAgentTests[displayName] = {
      status: blocked ? 403 : 200,
      blocked,
      cloudflareDetected: cloudflare.detected,
      blockedReason: cfBlocked
        ? "cloudflare"
        : robotsBlocked
        ? "robots.txt"
        : undefined,
    };
  }

  const totalBots = Object.keys(botMap).length;
  let accessibilityStatus: "Accessible" | "Warning" | "Blocked";

  if (blockedCount === totalBots || cloudflare.confirmedBlock) {
    accessibilityStatus = "Blocked";
  } else if (blockedCount > 0 || cloudflare.detected) {
    accessibilityStatus = "Warning";
  } else {
    accessibilityStatus = "Accessible";
  }

  return {
    userAgentTests,
    cloudflareDetected: cloudflare.detected,
    cloudflareSeverity: cloudflare.severity,
    possibleCrawlerBlocking: blockedCount > 0 || cloudflare.detected,
    accessibilityStatus,
  } as AIAccessibilityResult & { cloudflareSeverity: CloudflareSeverity };
}

// ─────────────────────────────────────────────
// MAIN CRAWL (Brza podrška za besplatni plan)
// ─────────────────────────────────────────────

async function fetchMainHtml(
  url: string,
  scrapingApiKey: string
): Promise<{ html: string; javascriptDependency: "Low" | "Critical" }> {
  const isSpaLike = ($: ReturnType<typeof cheerio.load>) =>
    $("body").text().trim().length < 200 &&
    $("#root, #__next, #app").length > 0;

  // 1. Domaći direktni fetch bez proxyja za brzinu (0.5s)
  try {
    const res = await axios.get(url, {
      timeout: 4000,
      headers: {
        "User-Agent": "AEO-Audit-Pro-Bot/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (typeof res.data === "string" && res.data.length > 300) {
      const $ = cheerio.load(res.data);
      if (!isSpaLike($)) {
        return { html: res.data, javascriptDependency: "Low" };
      }
    }
  } catch {
    // Nastavi na Webscraping API
  }

  // 2. Webscraping API bez JS-a (Brzi proxy, ~2-3s)
  try {
    const res = await axios.get("https://api.webscraping.ai/html", {
      params: { api_key: scrapingApiKey, url, js: false },
      timeout: 6000,
    });
    const html = extractHtml(res.data);
    if (html) {
      const $ = cheerio.load(html);
      return { 
        html, 
        javascriptDependency: isSpaLike($) ? "Critical" : "Low" 
      };
    }
  } catch {
    // Nastavi
  }

  // 3. Fallback: Webscraping API sa JS renderovanjem
  const res = await axios.get("https://api.webscraping.ai/html", {
    params: {
      api_key: scrapingApiKey,
      url,
      js: true,
    },
    timeout: 10000,
  });
  const html = extractHtml(res.data);
  if (!html) throw new Error("Failed to retrieve HTML payload.");
  return { html, javascriptDependency: "Critical" };
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export async function scrapeWebsite(
  url: string,
  scrapingApiKey: string
): Promise<ScrapedData> {
  const parsedUrl = new URL(url);

  // Paralelno pokrećemo preuzimanje pomoćnih fajlova (robots, llms, cloudflare) radi ušteđevine vremena
  const [robotsRes, llmsRes, cloudflare] = await Promise.all([
    fetchRobotsTxt(`${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`, scrapingApiKey),
    fetchLlmsTxt(`${parsedUrl.protocol}//${parsedUrl.hostname}/llms.txt`, scrapingApiKey),
    detectCloudflare(url, scrapingApiKey)
  ]);

  const { content: robotsRawContent, status: robotsFetchStatus } = robotsRes;
  const { content: llmsRawContent } = llmsRes;

  let robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error";
  let aiBotsStatus: BotStatus;

  const defaultBotStatus: BotStatus = {
    googlebot: "Allowed",
    oaiSearchBot: "Allowed",
    claudeSearchBot: "Allowed",
    claudeUser: "Allowed",
    perplexityBot: "Allowed",
    bingbot: "Allowed",
    metaExternalAgent: "Allowed",
    grokBot: "Allowed",
  };

  if (robotsFetchStatus === 404) {
    robotsStatus = "Missing";
    aiBotsStatus = { ...defaultBotStatus };
  } else if (robotsFetchStatus === -1 || !robotsRawContent) {
    robotsStatus = "Error";
    aiBotsStatus = { ...defaultBotStatus };
  } else {
    const parsed = parseRobotsTxt(robotsRawContent);
    aiBotsStatus = parsed.aiBotsStatus;
    robotsStatus = parsed.robotsStatus;
  }

  const aiAccessibility = buildAIAccessibility(aiBotsStatus, cloudflare);

  // Učitavanje glavnog HTML-a
  const { html, javascriptDependency } = await fetchMainHtml(
    url,
    scrapingApiKey
  );
  const $ = cheerio.load(html);

  // Osnovni signali stranice
  const title =
    $("title").text().trim().substring(0, 150) || "No title found";
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim().substring(0, 300) ||
    "No meta description";
  const h1 =
    $("h1").first().text().trim().substring(0, 150) || "No H1 Found";
  const h2Count = $("h2").length;
  const hasTablesOrLists =
    $("table").length > 0 || $("ul").length > 0 || $("ol").length > 0;

  // Semantička mapa
  const allH1s = $("h1");

  const semanticLayoutMap: SemanticLayoutMap = {
    hasMainTag: $("main").length === 1,
    hasArticleTag: $("article").length > 0,
    hasHeadingLeap: false,
    hasSingleH1: allH1s.length === 1,
    totalImages: $("img").length,
    missingAltCount: 0,
    hasAriaLabels: false,
  };

  let totalInteractive = 0;
  let withAria = 0;
  $(
    "button, form, input, select, textarea, [role], [aria-label], [aria-labelledby]"
  ).each((_, el) => {
    totalInteractive++;
    if (
      $(el).attr("aria-label") ||
      $(el).attr("aria-labelledby") ||
      $(el).attr("aria-describedby") ||
      $(el).attr("role") ||
      $(el).attr("aria-expanded")
    ) {
      withAria++;
    }
  });

  semanticLayoutMap.hasAriaLabels =
    totalInteractive === 0 || withAria / totalInteractive >= 0.2;

  $("img").each((_, el) => {
    if (!$(el).attr("alt")?.trim()) semanticLayoutMap.missingAltCount++;
  });

  let previousLevel: number | null = null;

  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const currentLevel = Number(el.tagName.substring(1));

    if (previousLevel === null && currentLevel > 1) {
      semanticLayoutMap.hasHeadingLeap = true;
      return false;
    }

    if (previousLevel !== null && currentLevel > previousLevel + 1) {
      semanticLayoutMap.hasHeadingLeap = true;
      return false;
    }

    previousLevel = currentLevel;
  });

  // Entity Trust Map
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
      const last = parts[parts.length - 1]?.trim();
      if (last && last.length < 30) brandVariantsSet.add(last);
    } else if (title.length < 30) {
      brandVariantsSet.add(title);
    }
  }

  const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim();
  if (ogSiteName) brandVariantsSet.add(ogSiteName);

  const footerText =
    $("footer").text() ||
    $("body").text().substring($("body").text().length - 1500);
  const copyrightMatch = footerText.match(
    /(?:©|copyright)\s*(?:\d{4}|\d{4}-\d{4})?\s*([A-Za-z0-9\s\.\,\-\&]{3,40})/i
  );
  if (copyrightMatch?.[1]) {
    const raw = copyrightMatch[1]
      .replace(
        /(ltd|llc|inc|d\.o\.o\.|doo|corp|corporation|gmbh|co|company|all rights reserved.*)/i,
        ""
      )
      .trim();
    if (raw.length > 2) brandVariantsSet.add(raw);
  }

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim() ?? "";
    if (!href) return;
    const h = href.toLowerCase();

    if (h.includes("wikipedia.org") || h.includes("wikidata.org")) {
      entityTrustMap.hasWikidataOrWikipedia = true;
    }
    if (h.includes("linkedin.com") && isValidSocialProfile(href, "linkedin")) {
      entityTrustMap.hasLinkedIn = true;
    }
    if (
      (h.includes("x.com") || h.includes("twitter.com")) &&
      isValidSocialProfile(href, "x")
    ) {
      entityTrustMap.hasXAccount = true;
    }
    if (h.includes("facebook.com") && isValidSocialProfile(href, "facebook")) {
      entityTrustMap.hasFacebookAccount = true;
    }
  });

  const bodyLower = $("body").text().toLowerCase();
  if (
    /(\+?\d{1,4}[\s\-])?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/.test(
      bodyLower
    ) &&
    /\b(suite|floor|st\.|street|ave|avenue|postal|zip|code|address)\b/i.test(
      bodyLower
    )
  ) {
    entityTrustMap.hasPhysicalSignals = true;
  }

  // Schema parsing
  const schemaSet = new Set<string>();
  let qaBlocksCount = 0;

  $('script[type="application/ld+json"]').each((_, el) => {
    const content = $(el).html();
    if (!content) return;
    try {
      const parsed: unknown = JSON.parse(content);

      const deepParse = (obj: unknown): void => {
        if (!obj || typeof obj !== "object") return;
        if (Array.isArray(obj)) {
          obj.forEach(deepParse);
          return;
        }
        const o = obj as Record<string, unknown>;

        if (o["@type"]) {
          const t = o["@type"];
          const types = Array.isArray(t) ? t : [t];
          types.forEach((v) => {
            if (typeof v === "string") schemaSet.add(v);
          });

          const typeStr = String(Array.isArray(t) ? t[0] : t);

          if (
            ["LocalBusiness", "Store", "Restaurant", "AutomotiveBusiness", "MedicalBusiness"].includes(typeStr)
          ) {
            if (
              (!!o["telephone"] && !!o["address"]) ||
              (!!o["address"] &&
                (!!o["openingHours"] || !!o["openingHoursSpecification"]))
            ) {
              entityTrustMap.hasDeepLocalBusinessSchema = true;
            }
          }

          if (typeStr === "Product") {
            if (!!o["offers"] && (!!o["brand"] || !!o["aggregateRating"] || !!o["review"])) {
              entityTrustMap.hasDeepProductSchema = true;
            }
          }

          if (
            ["Organization", "LocalBusiness", "Brand", "WebSite"].includes(typeStr) &&
            typeof o["name"] === "string" &&
            o["name"].length < 40
          ) {
            brandVariantsSet.add((o["name"] as string).trim());
          }

          if (typeStr === "FAQPage" && Array.isArray(o["mainEntity"])) {
            qaBlocksCount += o["mainEntity"].length;
          }
        }

        for (const val of Object.values(o)) {
          if (val && typeof val === "object") deepParse(val);
        }
      };

      deepParse(parsed);
    } catch {
      // malformed JSON
    }
  });

  const detectedSchemas = Array.from(schemaSet);
  if (
    detectedSchemas.includes("LocalBusiness") ||
    detectedSchemas.includes("PostalAddress")
  ) {
    entityTrustMap.hasPhysicalSignals = true;
  }

  const rawVariants = Array.from(brandVariantsSet)
    .map((v) => v.replace(/[\.\,\-\|]/g, "").trim())
    .filter((v) => v.length > 2 && !/^(home|index|main page|welcome|website)$/i.test(v));

  const lowerSeen = new Set<string>();
  entityTrustMap.detectedBrandVariants = rawVariants.filter((v) => {
    const l = v.toLowerCase();
    if (lowerSeen.has(l)) return false;
    lowerSeen.add(l);
    return true;
  });

  entityTrustMap.brandDisambiguationStatus =
    entityTrustMap.detectedBrandVariants.length === 0
      ? "Critical Missing"
      : entityTrustMap.detectedBrandVariants.length > 2
      ? "Inconsistent"
      : "Optimal";

  // Q&A detekcija
  if (qaBlocksCount === 0) {
    const textNodes: { text: string; el: ReturnType<typeof $> }[] = [];

    $(
      "h1, h2, h3, h4, h5, h6, p, div, li, summary, [aria-expanded], [aria-controls]"
    ).each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (text.length > 5 && text.length < 250) {
        textNodes.push({ text, el: $(el) });
      }
    });

    for (let i = 0; i < textNodes.length - 1; i++) {
      const { text, el } = textNodes[i];
      const isQuestion =
        text.endsWith("?") ||
        el.is("h1, h2, h3, h4, h5, h6, summary") ||
        el.is("[aria-expanded], [aria-controls]") ||
        el.attr("class")?.toLowerCase().includes("question") ||
        el.attr("class")?.toLowerCase().includes("title");

      if (!isQuestion) continue;

      const next = textNodes[i + 1];
      const isAnswer =
        next.text.length > 20 &&
        !next.text.endsWith("?") &&
        !next.el.is("h1, h2, h3, h4, h5, h6");

      if (isAnswer) {
        qaBlocksCount++;
        i++;
      }
    }
  }

  // Preostali signali
  const hasVideoElements =
    $("video").length > 0 ||
    $("iframe[src*='youtube.com']").length > 0 ||
    $("iframe[src*='youtu.be']").length > 0 ||
    $("iframe[src*='vimeo.com']").length > 0;

  const bodyText = $("p, li, table tr, blockquote")
    .map((_, el) => $(el).text().trim())
    .get()
    .join(" ")
    .replace(/\s+/g, " ")
    .substring(0, 5000);

  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Detekcija tipa stranice
  let pageType: "Homepage" | "Article" | "FAQ" | "About" | "Commercial" | "General" =
    "General";
  const pathname = parsedUrl.pathname.toLowerCase();
  const cleanPath = pathname
    .replace(/\/$/, "")
    .replace(/^\/(en|de|bs|fr|es|it|hr|sr|nl|pl)(\/|$)/, "/");

  if (cleanPath === "" || cleanPath === "/" || cleanPath === "/index.html") {
    pageType = "Homepage";
  } else if (
    cleanPath.includes("faq") ||
    cleanPath.includes("question") ||
    detectedSchemas.includes("FAQPage")
  ) {
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
    llmsRawContent,
    aiBotsStatus,
    entityTrustMap,
    semanticLayoutMap,
    pageType,
    aiAccessibility,
  };
}