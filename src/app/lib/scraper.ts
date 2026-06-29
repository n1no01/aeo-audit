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
  // true = even residential proxy got a challenge page
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

/** Returns true if the HTML response looks like a Cloudflare challenge page. */
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

/** Extracts plain text from a webscraping.ai response (string or object). */
function extractHtml(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    return (data as ScraperResponseData).html ?? "";
  }
  return "";
}

// ─────────────────────────────────────────────
// ROBOTS.TXT FETCHING (3-tier)
// ─────────────────────────────────────────────

async function fetchRobotsTxt(
  robotsUrl: string,
  scrapingApiKey: string
): Promise<{ content: string; status: number }> {
  // Tier 1 — direct request (fastest, free)
  try {
    const res = await axios.get<string>(robotsUrl, {
      timeout: 5000,
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

  // Tier 2 — webscraping.ai datacenter (bypasses basic IP blocks)
  try {
    const res = await axios.get("https://api.webscraping.ai/html", {
      params: {
        api_key: scrapingApiKey,
        url: robotsUrl,
        js: false,
      },
      timeout: 10000,
      validateStatus: (s) => s === 200 || s === 404,
    });

    const targetStatus = Number(res.headers["x-target-status"] ?? res.status);

    if (targetStatus === 404) return { content: "", status: 404 };

    const html = extractHtml(res.data);
    // robots.txt is plain text — if we get an HTML page back something went wrong
    if (html && !html.trimStart().startsWith("<")) {
      return { content: html, status: 200 };
    }
  } catch {
    // fall through
  }

  // Tier 3 — webscraping.ai residential (bypasses stricter protections)
  try {
    const res = await axios.get("https://api.webscraping.ai/html", {
      params: {
        api_key: scrapingApiKey,
        url: robotsUrl,
        js: false,
        proxy: "residential",
      },
      timeout: 15000,
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

  return { content: "", status: -1 }; // network error
}

// ─────────────────────────────────────────────
// ROBOTS.TXT PARSER
// ─────────────────────────────────────────────

const BOT_TOKENS: Record<string, Array<keyof BotStatus>> = {
  gptbot: ["gptBot"],
  "oai-searchbot": ["oaiSearchBot"],
  "google-extended": ["googleExtended"],
  claudebot: ["claudeBot"],
  "anthropic-ai": ["anthropicAi"],
  perplexitybot: ["perplexityBot"],
  deepseekbot: ["deepSeekBot"],
  "applebot-extended": ["appleBotExtended"],
  "cohere-ai": ["cohereAi"],
  bingbot: ["bingbot"],
};

/**
 * Parses a robots.txt string.
 *
 * Rules:
 *  - Comments (#) and surrounding whitespace are stripped first.
 *  - Groups are separated by blank lines between directives.
 *  - Disallow: /  or  Disallow: /*  → blocked for that group's agents.
 *  - Allow: directive is intentionally ignored (simple mode).
 *  - User-agent: * blocks ALL tracked bots.
 */
function parseRobotsTxt(content: string): {
  aiBotsStatus: BotStatus;
  robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error";
} {
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

  // Strip comments and trim each line, keep blank lines as group separators
  const lines = content.split(/\r?\n/).map((raw) => {
    const withoutComment = raw.split("#")[0].trimEnd();
    return withoutComment.trim();
  });

  let currentAgents: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Blank line → end of current group
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

      // Only treat as full-block if path is "/" or "/*"
      if (path !== "/" && path !== "/*") continue;
      if (currentAgents.length === 0) continue;

      for (const agent of currentAgents) {
        if (agent === "*") {
          // Wildcard → block every tracked bot
          (Object.keys(aiBotsStatus) as Array<keyof BotStatus>).forEach(
            (k) => {
              aiBotsStatus[k] = "Blocked";
            }
          );
          break; // no need to check further agents in this group
        }

        // Specific bot token matching (substring)
        for (const [token, targets] of Object.entries(BOT_TOKENS)) {
          if (agent.includes(token)) {
            targets.forEach((t) => {
              aiBotsStatus[t] = "Blocked";
            });
          }
        }
      }

      continue;
    }

    // Any other directive (Allow, Sitemap, Crawl-delay, …) → skip
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

/**
 * Checks whether a raw HTTP response (status + headers + html) looks like
 * any form of bot/Cloudflare blocking — regardless of who made the request.
 */
function isBlockedResponse(status: number, headers: Record<string, unknown>, html: string): boolean {
  // Hard status codes that always mean blocked
  if (status === 403 || status === 503 || status === 429) return true;

  // Cloudflare-specific HTML challenge signatures
  if (looksLikeCloudflareChallenge(html)) return true;

  // Cloudflare headers that survive some proxies
  if (headers["cf-mitigated"]) return true;
  if (String(headers["server"] ?? "").toLowerCase().includes("cloudflare")) return true;
  if (headers["cf-ray"]) return true;

  // Generic bot-wall patterns (non-CF services: Akamai, Imperva, etc.)
  if (html.includes("Access Denied") && html.includes("</title>")) return true;
  if (html.includes("Request blocked") || html.includes("Bot verification")) return true;
  if (html.includes("security check") && html.length < 5000) return true;
  if (html.includes("Your IP has been blocked")) return true;
  if (html.includes("Please verify you are a human")) return true;

  return false;
}

/**
 * Three-phase bot blocking detection:
 *
 * Phase 1 — Direct fetch with a known AI bot User-Agent (GPTBot).
 *   This bypasses webscraping.ai entirely, so we see the raw response
 *   the site actually sends to bots. CF headers, challenge HTML, status
 *   codes — all visible. This is the most reliable signal.
 *   Cost: 0 credits.
 *
 * Phase 2 — Only runs if Phase 1 detected a block.
 *   Direct fetch with a browser-like User-Agent to distinguish
 *   "blocking bots only" from "blocking everyone" (e.g. site is down).
 *   If the browser UA gets through → confirmed bot-specific block.
 *   If the browser UA is also blocked → site might just be down,
 *   or it's a very aggressive block. Either way, mark as Hard.
 *   Cost: 0 credits.
 *
 * Phase 3 — Only runs if Phase 1 detected a block AND Phase 2 confirmed
 *   it's bot-specific. Retries via webscraping.ai residential proxy to
 *   test whether a real-IP bypass works, which tells us severity.
 *   Cost: 5 credits (residential).
 */
async function detectCloudflare(
  url: string,
  scrapingApiKey: string
): Promise<CloudflareResult> {

  // ── Phase 1: direct bot-UA fetch ─────────────────────────────────────────
  // Use GPTBot — one of the most commonly blocked UAs, gives us a clean signal.
  let phase1Blocked = false;

  try {
    const res = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
      maxRedirects: 5,
      headers: {
        "User-Agent": "GPTBot/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const html = typeof res.data === "string" ? res.data : "";
    phase1Blocked = isBlockedResponse(res.status, res.headers as Record<string, unknown>, html);
  } catch {
    // Connection refused, ECONNRESET, etc. — site may be blocking at TCP level.
    // Treat as detected; Phase 2 will clarify.
    phase1Blocked = true;
  }

  if (!phase1Blocked) {
    return { detected: false, severity: "None", confirmedBlock: false };
  }

  // ── Phase 2: direct browser-UA fetch — confirm it's bot-specific ─────────
  // If a normal browser also gets blocked, the site may just be down or
  // doing IP-level blocking. If the browser gets through, it's definitely
  // a bot-targeting block.
  let browserGetsThrough = false;

  try {
    const res = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    const html = typeof res.data === "string" ? res.data : "";
    const browserBlocked = isBlockedResponse(res.status, res.headers as Record<string, unknown>, html);
    browserGetsThrough = !browserBlocked;
  } catch {
    // Browser UA also failed — likely site-level block or site is down
    browserGetsThrough = false;
  }

  // If even a browser UA is blocked, this is a Hard block (or site is down)
  if (!browserGetsThrough) {
    return { detected: true, severity: "Hard", confirmedBlock: true };
  }

  // Bot-specific block confirmed. Now test whether a residential proxy bypasses it.
  // ── Phase 3: residential proxy — determine severity ───────────────────────
  try {
    const res: AxiosResponse = await axios.get(
      "https://api.webscraping.ai/html",
      {
        params: {
          api_key: scrapingApiKey,
          url,
          js: false,
          proxy: "residential",
        },
        timeout: 20000,
        validateStatus: () => true,
      }
    );

    const targetStatus = Number(res.headers["x-target-status"] ?? res.status);
    const html = extractHtml(res.data);
    const stillBlocked = isBlockedResponse(targetStatus, res.headers as Record<string, unknown>, html);

    // Residential also blocked → Hard (fingerprinting beyond just IP/UA)
    if (stillBlocked) {
      return { detected: true, severity: "Hard", confirmedBlock: true };
    }

    // Residential got through → datacenter/bot-UA blocked but real IPs ok
    return { detected: true, severity: "Soft", confirmedBlock: false };
  } catch {
    // Can't confirm residential — default to Soft since browser UA got through
    return { detected: true, severity: "Soft", confirmedBlock: false };
  }
}

// ─────────────────────────────────────────────
// AI ACCESSIBILITY (robots.txt inference)
// ─────────────────────────────────────────────

/**
 * Instead of making 6 live UA requests (expensive), we infer per-bot
 * accessibility purely from the already-parsed robots.txt status.
 *
 * The single datacenter + residential fetch for Cloudflare detection
 * (run separately) provides the live blocking signal.
 */
function buildAIAccessibility(
  aiBotsStatus: BotStatus,
  cloudflare: CloudflareResult
): AIAccessibilityResult {
  const botMap: Record<string, keyof BotStatus> = {
    GPTBot: "gptBot",
    ClaudeBot: "claudeBot",
    PerplexityBot: "perplexityBot",
    "OAI-SearchBot": "oaiSearchBot",
    "Google-Extended": "googleExtended",
    "Anthropic-AI": "anthropicAi",
  };

  const userAgentTests: AIAccessibilityResult["userAgentTests"] = {};
  let blockedCount = 0;

  for (const [displayName, statusKey] of Object.entries(botMap)) {
    const robotsBlocked = aiBotsStatus[statusKey] === "Blocked";
    // If Cloudflare is a hard block, every bot is effectively blocked at the
    // network level regardless of robots.txt
    const cfBlocked = cloudflare.confirmedBlock;
    const blocked = robotsBlocked || cfBlocked;

    if (blocked) blockedCount++;

    userAgentTests[displayName] = {
      // 200 = inferred allowed, 403 = inferred blocked
      status: blocked ? 403 : 200,
      blocked,
      cloudflareDetected: cloudflare.detected,
      // Surface the reason so the UI can explain it
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
// MAIN CRAWL (3-tier with correct js param)
// ─────────────────────────────────────────────

async function fetchMainHtml(
  url: string,
  scrapingApiKey: string
): Promise<{ html: string; javascriptDependency: "Low" | "Critical" }> {
  const isSpaLike = ($: ReturnType<typeof cheerio.load>) =>
    $("body").text().trim().length < 200 &&
    $("#root, #__next, #app").length > 0;

  // Tier 1 — datacenter, no JS (fastest, 1 credit)
  try {
    const res = await axios.get("https://api.webscraping.ai/html", {
      params: { api_key: scrapingApiKey, url, js: false },
      timeout: 12000,
    });
    const html = extractHtml(res.data);
    if (html && !isSpaLike(cheerio.load(html))) {
      return { html, javascriptDependency: "Low" };
    }
    // SPA detected → skip Tier 2, go straight to JS rendering (Tier 3)
    if (html && isSpaLike(cheerio.load(html))) {
      throw new Error("SPA detected in Tier 1");
    }
  } catch (err: unknown) {
    const isSpa =
      err instanceof Error && err.message.startsWith("SPA detected");

    if (!isSpa) {
      // Tier 2 — residential, no JS (overcomes IP blocks, 5 credits)
      try {
        const res = await axios.get("https://api.webscraping.ai/html", {
          params: {
            api_key: scrapingApiKey,
            url,
            js: false,
            proxy: "residential",
          },
          timeout: 18000,
        });
        const html = extractHtml(res.data);
        if (html && !isSpaLike(cheerio.load(html))) {
          return { html, javascriptDependency: "Low" };
        }
      } catch {
        // fall through to Tier 3
      }
    }
  }

  // Tier 3 — residential + JS rendering (handles SPAs & heavy anti-bot, 10 credits)
  const res = await axios.get("https://api.webscraping.ai/html", {
    params: {
      api_key: scrapingApiKey,
      url,
      js: true,
      proxy: "residential",
    },
    timeout: 30000,
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

  // ── 1. Robots.txt ─────────────────────────────────────────────────────────
  const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`;

  const { content: robotsRawContent, status: robotsFetchStatus } =
    await fetchRobotsTxt(robotsUrl, scrapingApiKey);

  let robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error";
  let aiBotsStatus: BotStatus;

  if (robotsFetchStatus === 404) {
    robotsStatus = "Missing";
    aiBotsStatus = {
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
  } else if (robotsFetchStatus === -1 || !robotsRawContent) {
    robotsStatus = "Error";
    aiBotsStatus = {
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
  } else {
    const parsed = parseRobotsTxt(robotsRawContent);
    aiBotsStatus = parsed.aiBotsStatus;
    robotsStatus = parsed.robotsStatus;
  }

  // ── 2. Cloudflare detection ───────────────────────────────────────────────
  const cloudflare = await detectCloudflare(url, scrapingApiKey);

  // ── 3. AI accessibility (inferred, no extra credits) ─────────────────────
  const aiAccessibility = buildAIAccessibility(aiBotsStatus, cloudflare);

  // ── 4. Main HTML crawl ────────────────────────────────────────────────────
  const { html, javascriptDependency } = await fetchMainHtml(
    url,
    scrapingApiKey
  );
  const $ = cheerio.load(html);

  // ── 5. Basic page signals ─────────────────────────────────────────────────
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

  // ── 6. Semantic layout map ────────────────────────────────────────────────
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

// ── Napredna detekcija Heading Leap anomalija ──────────────────────────────
  let previousLevel: number | null = null;

  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const currentLevel = Number(el.tagName.substring(1));

    // Slučaj A: Prvi naslov na stranici preskače H1 (npr. stranica počinje sa H2 ili H3)
    if (previousLevel === null && currentLevel > 1) {
      semanticLayoutMap.hasHeadingLeap = true;
      return false;
    }

    // Slučaj B: Standardni leap unutar strukture (npr. H2 -> H4)
    if (previousLevel !== null && currentLevel > previousLevel + 1) {
      semanticLayoutMap.hasHeadingLeap = true;
      return false;
    }

    previousLevel = currentLevel;
  });

  // ── 7. Entity trust map ───────────────────────────────────────────────────
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

  // ── 8. Schema parsing ─────────────────────────────────────────────────────
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
      // malformed JSON — skip
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

  // ── 9. Q&A detection ──────────────────────────────────────────────────────
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

  // ── 10. Remaining signals ─────────────────────────────────────────────────
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

  // ── 11. Page type detection ────────────────────────────────────────────────
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

  // ── Return ────────────────────────────────────────────────────────────────
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
    aiAccessibility,
  };
}