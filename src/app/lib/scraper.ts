import axios from "axios";
import * as cheerio from "cheerio";
import {
  ScrapedData,
  BotStatus,
  EntityTrustMap,
  SemanticLayoutMap,
  AIAccessibilityResult,
} from "./types";
import { assertPublicHttpUrl, safeGet, UnsafeUrlError } from "./urlSafety";

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
  /** true when no conclusion could be drawn (e.g. both probes timed out) */
  inconclusive: boolean;
}

type Cheerio$ = ReturnType<typeof cheerio.load>;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const AI_BOT_UA = "Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)";
const MAX_RAW_TEXT = 20_000; // robots.txt / llms.txt are stored in the DB and rendered in the UI

// ─────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────

function extractHtml(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    return (data as ScraperResponseData).html ?? "";
  }
  return "";
}

function looksLikeHtmlDocument(content: string): boolean {
  return /^\s*<(!doctype|html|head|body|\?xml)/i.test(content);
}

function looksLikeCloudflareChallenge(html: string): boolean {
  if (!html || html.length > 80_000) return false; // real challenge pages are small
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

function looksLikeBlockPage(html: string): boolean {
  if (!html || html.length > 20_000) return false;
  return (
    (html.includes("Access Denied") && html.includes("</title>")) ||
    html.includes("Request blocked") ||
    html.includes("Bot verification") ||
    html.includes("security check") ||
    html.includes("Your IP has been blocked") ||
    html.includes("Please verify you are a human")
  );
}

function decodeSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

// ─────────────────────────────────────────────
// EXTERNAL LINK CLASSIFICATION (social / knowledge bases)
// ─────────────────────────────────────────────

type ExternalKind = "linkedin" | "x" | "facebook" | "wikipedia" | null;

const X_IGNORED = new Set([
  "home", "intent", "share", "widgets", "privacy", "tos", "search", "i", "hashtag",
  "explore", "settings", "login", "signup", "messages", "notifications", "compose",
]);
const FB_IGNORED = new Set([
  "sharer", "sharer.php", "share", "share.php", "plugins", "policies", "pages", "dialog",
  "tr", "login", "login.php", "help", "legal", "privacy", "watch", "marketplace", "events",
]);

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith("." + domain);
}

/**
 * Classifies an outbound link by its real hostname (NOT by substring), so that
 * e.g. "https://www.fedex.com/en" is not mistaken for an x.com profile.
 */
function classifyExternalLink(href: string, base: string): ExternalKind {
  let parsed: URL;
  try {
    parsed = new URL(href, base);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const segments = parsed.pathname.split("/").filter(Boolean);
  const first = (segments[0] ?? "").toLowerCase();

  if (hostMatches(host, "wikipedia.org") || hostMatches(host, "wikidata.org")) return "wikipedia";

  if (hostMatches(host, "linkedin.com")) {
    return /^(in|company|school|showcase|pub)$/.test(first) && Boolean(segments[1]) ? "linkedin" : null;
  }

  if (host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com") {
    return /^[a-z0-9_]{1,15}$/i.test(first) && !X_IGNORED.has(first) ? "x" : null;
  }

  if (hostMatches(host, "facebook.com") || host === "fb.com" || host === "fb.me") {
    if (!first || FB_IGNORED.has(first)) return null;
    return "facebook";
  }

  return null;
}

// ─────────────────────────────────────────────
// ROBOTS.TXT + LLMS.TXT FETCHING
// ─────────────────────────────────────────────

async function fetchTextFile(
  fileUrl: string,
  scrapingApiKey: string
): Promise<{ content: string; status: number }> {
  // 1) direct, SSRF-safe fetch
  try {
    const res = await safeGet(fileUrl, { timeout: 3000, headers: { "User-Agent": BROWSER_UA } });
    if (res.status === 200 && typeof res.data === "string") {
      // SPAs often answer 200 with their HTML shell for unknown paths: that is "no file".
      if (looksLikeHtmlDocument(res.data)) return { content: "", status: 404 };
      return { content: res.data.slice(0, MAX_RAW_TEXT), status: 200 };
    }
    if (res.status === 404 || res.status === 410) return { content: "", status: 404 };
  } catch (e) {
    if (e instanceof UnsafeUrlError) throw e;
    // fall through to proxy
  }

  // 2) proxy (target blocked us directly, 5xx or timeout)
  try {
    const res = await axios.get("https://api.webscraping.ai/html", {
      params: { api_key: scrapingApiKey, url: fileUrl, js: false },
      timeout: 5000,
      validateStatus: (s) => s === 200 || s === 404,
    });

    const targetStatus = Number(res.headers["x-target-status"] ?? res.status);
    if (targetStatus === 404) return { content: "", status: 404 };

    const body = extractHtml(res.data);
    if (body && !looksLikeHtmlDocument(body)) {
      return { content: body.slice(0, MAX_RAW_TEXT), status: 200 };
    }
    if (body && looksLikeHtmlDocument(body)) return { content: "", status: 404 };
  } catch {
    // fall through
  }

  return { content: "", status: -1 };
}

// ─────────────────────────────────────────────
// ROBOTS.TXT PARSER (group aware, RFC 9309 style)
// ─────────────────────────────────────────────

const BOT_TOKENS: Record<keyof BotStatus, string[]> = {
  googlebot: ["googlebot"],
  oaiSearchBot: ["oai-searchbot"],
  claudeSearchBot: ["claude-searchbot"],
  claudeUser: ["claude-user"],
  perplexityBot: ["perplexitybot"],
  bingbot: ["bingbot"],
  metaExternalAgent: ["meta-externalagent"],
  grokBot: ["grokbot", "xai-grok", "grok"],
  gptBot: ["gptbot"],
  claudeBot: ["claudebot", "anthropic-ai", "claude-web"],
  googleExtended: ["google-extended"],
  ccBot: ["ccbot"],
};

function makeBotStatus(): Required<BotStatus> {
  return {
    googlebot: "Allowed",
    oaiSearchBot: "Allowed",
    claudeSearchBot: "Allowed",
    claudeUser: "Allowed",
    perplexityBot: "Allowed",
    bingbot: "Allowed",
    metaExternalAgent: "Allowed",
    grokBot: "Allowed",
    gptBot: "Allowed",
    claudeBot: "Allowed",
    googleExtended: "Allowed",
    ccBot: "Allowed",
  };
}

interface RobotsGroup {
  agents: string[];
  rules: { type: "allow" | "disallow"; path: string }[];
}

function parseRobotsTxt(content: string): {
  aiBotsStatus: BotStatus;
  robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error";
} {
  const aiBotsStatus = makeBotStatus();
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.split("#")[0].trim();
    if (!line) continue; // blank lines do NOT end a group in the spec

    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "user-agent") {
      const agent = value.toLowerCase().split("/")[0].trim();
      if (!agent) continue;
      // A user-agent line after rule lines starts a NEW group.
      if (!current || current.rules.length > 0) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(agent);
      continue;
    }

    if ((field === "disallow" || field === "allow") && current) {
      current.rules.push({ type: field, path: value });
    }
  }

  const wildcardGroups = groups.filter((g) => g.agents.includes("*"));

  for (const [key, tokens] of Object.entries(BOT_TOKENS) as [keyof BotStatus, string[]][]) {
    const specific = groups.filter((g) => g.agents.some((a) => tokens.includes(a)));
    const applicable = specific.length > 0 ? specific : wildcardGroups; // most specific group wins
    const rules = applicable.flatMap((g) => g.rules);

    const disallowsRoot = rules.some((r) => r.type === "disallow" && (r.path === "/" || r.path === "/*"));
    const allowsRoot = rules.some((r) => r.type === "allow" && (r.path === "/" || r.path === "/*" || r.path === "/$"));

    if (disallowsRoot && !allowsRoot) aiBotsStatus[key] = "Blocked";
  }

  const anyBlocked = Object.values(aiBotsStatus).includes("Blocked");
  return { aiBotsStatus, robotsStatus: anyBlocked ? "Blocking AI" : "Valid" };
}

// ─────────────────────────────────────────────
// BOT PROTECTION DETECTION
// ─────────────────────────────────────────────

interface Probe {
  status: number;
  blocked: boolean;
}

async function probe(url: string, userAgent: string): Promise<Probe | null> {
  try {
    const res = await safeGet(url, {
      timeout: 4000,
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const html = typeof res.data === "string" ? res.data.slice(0, 200_000) : "";
    const blocked =
      [401, 403, 429, 503].includes(res.status) ||
      Boolean(res.headers["cf-mitigated"]) ||
      looksLikeCloudflareChallenge(html) ||
      looksLikeBlockPage(html);
    return { status: res.status, blocked };
  } catch (e) {
    if (e instanceof UnsafeUrlError) throw e;
    return null; // timeout / network error: no evidence either way
  }
}

/**
 * Compares a normal browser request with an AI-crawler request from the same server.
 * The mere presence of Cloudflare (cf-ray / server: cloudflare) is NOT a block: ~20% of the web uses it.
 * "Hard" is decided later in scrapeWebsite, when even the proxy-fetched HTML is a challenge page.
 */
async function detectBotProtection(url: string): Promise<CloudflareResult> {
  const [control, bot] = await Promise.all([probe(url, BROWSER_UA), probe(url, AI_BOT_UA)]);

  if (!control && !bot) {
    return { detected: false, severity: "None", confirmedBlock: false, inconclusive: true };
  }
  if (bot?.blocked) {
    // Blocked for the bot UA (with or without also being blocked for the browser UA):
    // datacenter IP / fake-bot rules. The residential proxy may still get through => Soft.
    return { detected: true, severity: "Soft", confirmedBlock: false, inconclusive: false };
  }
  return { detected: false, severity: "None", confirmedBlock: false, inconclusive: false };
}

// ─────────────────────────────────────────────
// AI ACCESSIBILITY
// ─────────────────────────────────────────────

function buildAIAccessibility(aiBotsStatus: BotStatus, cloudflare: CloudflareResult): AIAccessibilityResult {
  const botMap: Record<string, keyof BotStatus> = {
    Googlebot: "googlebot",
    "OAI-SearchBot": "oaiSearchBot",
    "Claude-SearchBot": "claudeSearchBot",
    "Claude-User": "claudeUser",
    PerplexityBot: "perplexityBot",
    Bingbot: "bingbot",
    "Meta-ExternalAgent": "metaExternalAgent",
    GrokBot: "grokBot",
    GPTBot: "gptBot",
    ClaudeBot: "claudeBot",
    "Google-Extended": "googleExtended",
    CCBot: "ccBot",
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
      blockedReason: cfBlocked ? "cloudflare" : robotsBlocked ? "robots.txt" : undefined,
    };
  }

  const totalBots = Object.keys(botMap).length;
  let accessibilityStatus: "Accessible" | "Warning" | "Blocked";
  if (blockedCount === totalBots || cloudflare.confirmedBlock) accessibilityStatus = "Blocked";
  else if (blockedCount > 0 || cloudflare.detected) accessibilityStatus = "Warning";
  else accessibilityStatus = "Accessible";

  return {
    userAgentTests,
    cloudflareDetected: cloudflare.detected,
    cloudflareSeverity: cloudflare.severity,
    possibleCrawlerBlocking: blockedCount > 0 || cloudflare.detected,
    accessibilityStatus,
  };
}

// ─────────────────────────────────────────────
// MAIN HTML FETCH
// ─────────────────────────────────────────────

interface MainHtmlResult {
  html: string;
  javascriptDependency: "Low" | "Critical";
  /** the HTML we ended up with is a bot-challenge page, not the real site */
  challenge: boolean;
}

function isSpaLike($: Cheerio$): boolean {
  return $("body").text().trim().length < 200 && $("#root, #__next, #app").length > 0;
}

async function fetchMainHtml(url: string, scrapingApiKey: string): Promise<MainHtmlResult> {
  let staticWasSpa = false;

  // 1) direct SSRF-safe fetch: fastest and shows exactly what a non-JS crawler receives
  try {
    const res = await safeGet(url, {
      timeout: 4000,
      headers: { "User-Agent": "AEO-Audit-Pro-Bot/1.0", Accept: "text/html,application/xhtml+xml,*/*;q=0.8" },
    });
    const body = typeof res.data === "string" ? res.data : "";
    if (res.status >= 200 && res.status < 300 && body.length > 300 && !looksLikeCloudflareChallenge(body)) {
      const $ = cheerio.load(body);
      if (!isSpaLike($)) return { html: body, javascriptDependency: "Low", challenge: false };
      staticWasSpa = true;
    }
  } catch (e) {
    if (e instanceof UnsafeUrlError) throw e;
  }

  // 2) proxy without JS rendering
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
        javascriptDependency: isSpaLike($) ? "Critical" : "Low",
        challenge: looksLikeCloudflareChallenge(html),
      };
    }
  } catch {
    // continue
  }

  // 3) proxy with JS rendering. Reaching this step because of timeouts says nothing about JS
  //    dependency, so only report "Critical" when the static HTML was really an empty SPA shell.
  const res = await axios.get("https://api.webscraping.ai/html", {
    params: { api_key: scrapingApiKey, url, js: true },
    timeout: 10000,
  });
  const html = extractHtml(res.data);
  if (!html) throw new Error("Failed to retrieve HTML payload.");
  return {
    html,
    javascriptDependency: staticWasSpa ? "Critical" : "Low",
    challenge: looksLikeCloudflareChallenge(html),
  };
}

// ─────────────────────────────────────────────
// BRAND DISAMBIGUATION
// ─────────────────────────────────────────────

const LEGAL_SUFFIXES =
  /\b(ltd|llc|inc|incorporated|corp|corporation|gmbh|co|company|limited|d\.?\s?o\.?\s?o\.?|s\.?r\.?l\.?|plc|ag|oy|bv|nv)\b\.?/gi;
const GENERIC_NAMES = /^(home|homepage|index|main page|welcome|website|official site|official website|untitled)$/i;

function cleanBrand(s: string): string {
  return s
    .replace(LEGAL_SUFFIXES, " ")
    .replace(/[|•·–—:]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s.,\-]+|[\s.,\-]+$/g, "")
    .trim();
}

function compactName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9À-ɏ]+/g, "");
}

function sameBrand(a: string, b: string): boolean {
  const ca = compactName(a);
  const cb = compactName(b);
  if (!ca || !cb) return false;
  if (ca === cb) return true;
  const [short, long] = ca.length <= cb.length ? [ca, cb] : [cb, ca];
  return short.length >= 3 && long.includes(short);
}

function computeBrand(
  strongNames: string[],
  title: string,
  hostname: string
): { variants: string[]; status: EntityTrustMap["brandDisambiguationStatus"] } {
  const strong = strongNames
    .map(cleanBrand)
    .filter((n) => n.length >= 2 && n.length <= 40 && !GENERIC_NAMES.test(n));

  const clusters: string[][] = [];
  for (const name of strong) {
    const cluster = clusters.find((c) => c.some((m) => sameBrand(m, name)));
    if (cluster) cluster.push(name);
    else clusters.push([name]);
  }

  // Clusters that both match the domain name are the same brand written differently.
  const domainLabel = compactName(hostname.replace(/^www\./, "").split(".")[0] ?? "");
  if (domainLabel.length >= 3) {
    const anchored = clusters.filter((c) => c.some((m) => domainLabel.includes(compactName(m)) && compactName(m).length >= 3));
    if (anchored.length > 1) {
      const merged = anchored.flat();
      for (const c of anchored) clusters.splice(clusters.indexOf(c), 1);
      clusters.unshift(merged);
    }
  }

  const variants = clusters.map((c) => c[0]);

  // The page <title> is only supporting evidence: "Pricing | Acme" must not create a brand "Pricing".
  if (variants.length === 0 && title && title !== "No title found") {
    const segments = title
      .split(/\s+[\-–—|•·:]\s+|\s*[|•·]\s*/)
      .map(cleanBrand)
      .filter((s) => s.length >= 2 && s.length <= 30 && !GENERIC_NAMES.test(s));
    if (segments.length > 0) {
      const fromDomain = segments.find((s) => sameBrand(s, domainLabel));
      variants.push(fromDomain ?? segments[segments.length - 1]);
    }
  }

  const status: EntityTrustMap["brandDisambiguationStatus"] =
    variants.length === 0 ? "Critical Missing" : variants.length > 2 ? "Inconsistent" : "Optimal";
  return { variants, status };
}

function extractCopyrightHolder(footerText: string): string | null {
  const m = footerText.match(
    /(?:©|&copy;|\(c\)|copyright)\s*(?:\d{4}(?:\s*[-–]\s*\d{2,4})?)?\s*[,.:]?\s*([^\n|•·©]{2,60})/i
  );
  if (!m?.[1]) return null;
  const holder = m[1].split(/all rights|powered by|built by|designed by|privacy|terms|\.\s/i)[0].trim();
  return holder.length >= 2 ? holder.slice(0, 40) : null;
}

// ─────────────────────────────────────────────
// Q&A DETECTION
// ─────────────────────────────────────────────

function countQaBlocks($: Cheerio$): number {
  const seen = new Set<string>();
  const norm = (t: string) => t.toLowerCase().replace(/\s+/g, " ").trim();

  // 1) <details><summary>Question?</summary>Answer</details>
  $("details").each((_, el) => {
    const summary = $(el).children("summary").first().text().replace(/\s+/g, " ").trim();
    const answer = $(el).text().replace(/\s+/g, " ").replace(summary, "").trim();
    if (summary.length > 5 && answer.length >= 20) seen.add(norm(summary));
  });

  // 2) question headings / definition terms directly followed by an answer
  $("h2, h3, h4, h5, h6, dt").each((_, el) => {
    const q = $(el).text().replace(/\s+/g, " ").trim();
    if (q.length < 8 || q.length > 200 || !q.endsWith("?")) return;

    const next = $(el).next();
    if (!next.length || next.is("h1, h2, h3, h4, h5, h6")) return;
    const answer = next.text().replace(/\s+/g, " ").trim();
    if (answer.length >= 20) seen.add(norm(q));
  });

  // 3) accordion triggers: <button aria-controls="panel-id">Question?</button>
  $("[aria-controls]").each((_, el) => {
    const q = $(el).text().replace(/\s+/g, " ").trim();
    if (q.length < 8 || q.length > 200 || !q.endsWith("?")) return;
    const id = $(el).attr("aria-controls");
    if (!id) return;
    const panel = $(`[id="${id.replace(/"/g, '\\"')}"]`);
    if (panel.text().replace(/\s+/g, " ").trim().length >= 20) seen.add(norm(q));
  });

  return seen.size;
}

// ─────────────────────────────────────────────
// PAGE TYPE DETECTION
// ─────────────────────────────────────────────

const ARTICLE_SCHEMAS = ["Article", "BlogPosting", "NewsArticle", "TechArticle", "ScholarlyArticle", "Report"];

function detectPageType(
  pathname: string,
  schemas: string[],
  hasArticleElement: boolean
): ScrapedData["pageType"] {
  const cleanPath = decodeSafe(pathname)
    .toLowerCase()
    .replace(/\/+$/, "")
    .replace(/\/index\.(html?|php)$/, "")
    .replace(/^\/(en|de|bs|fr|es|it|hr|sr|nl|pl|pt|tr|ru|sl|mk|sq)(\/|$)/, "/");

  if (cleanPath === "" || cleanPath === "/") return "Homepage";

  const segments = cleanPath.split("/").filter(Boolean);
  const tokens = segments.flatMap((s) => s.split(/[-_.]+/)).filter(Boolean);
  const depth = segments.length;
  const has = (...words: string[]) => words.some((w) => tokens.includes(w));
  const hasSchema = (...types: string[]) => types.some((t) => schemas.includes(t));
  const articleSchema = hasSchema(...ARTICLE_SCHEMAS);

  if (hasSchema("FAQPage") || has("faq", "faqs", "questions")) return "FAQ";
  if (has("pricing", "price", "prices", "plans")) return "Pricing";
  if (hasSchema("ContactPage") || has("contact", "kontakt")) return "Contact";
  if (hasSchema("AboutPage") || has("about", "team", "imprint", "impressum")) return "About";
  if (has("case") && has("study", "studies")) return "CaseStudy";
  if (has("docs", "documentation", "developers")) return "Documentation";
  if (has("author", "authors")) return "Author";

  if (
    has("product", "item") ||
    (has("products", "items") && depth >= 2) ||
    (hasSchema("Product") && !articleSchema)
  ) {
    return "Product";
  }

  if (articleSchema || (has("blog", "news", "post", "posts", "article", "articles", "insights", "guides") && depth >= 2)) {
    return "Article";
  }
  if (has("blog", "news", "articles", "insights", "resources", "posts")) return "Blog";

  if (
    has("category", "categories", "collection", "collections", "shop", "store", "products", "items") ||
    hasSchema("CollectionPage") ||
    (hasSchema("ItemList") && depth <= 2)
  ) {
    return "Category";
  }

  if (has("landing", "lp", "campaign", "promo")) return "Landing";
  if (has("service", "services", "solutions", "features", "commercial", "industries") || hasSchema("Service")) {
    return "Commercial";
  }
  if (hasArticleElement && depth >= 2) return "Article";

  return "General";
}

// ─────────────────────────────────────────────
// PER-ORIGIN CACHE
// robots.txt, llms.txt and the bot-protection probe are properties of the DOMAIN, not of a page.
// A 15-page domain audit used to repeat all of them 15 times.
// ─────────────────────────────────────────────

const ORIGIN_CACHE_TTL_MS = 120_000;
type OriginSignals = [{ content: string; status: number }, { content: string; status: number }, CloudflareResult];
const originCache = new Map<string, { at: number; value: Promise<OriginSignals> }>();

function getOriginSignals(origin: string, url: string, scrapingApiKey: string): Promise<OriginSignals> {
  const now = Date.now();
  const hit = originCache.get(origin);
  if (hit && now - hit.at < ORIGIN_CACHE_TTL_MS) return hit.value;

  const value = Promise.all([
    fetchTextFile(`${origin}/robots.txt`, scrapingApiKey),
    fetchTextFile(`${origin}/llms.txt`, scrapingApiKey),
    detectBotProtection(url),
  ]) as Promise<OriginSignals>;

  originCache.set(origin, { at: now, value });
  value.catch(() => originCache.delete(origin)); // never cache a failure

  if (originCache.size > 200) {
    for (const [key, entry] of originCache) {
      if (now - entry.at >= ORIGIN_CACHE_TTL_MS) originCache.delete(key);
    }
  }
  return value;
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────

export async function scrapeWebsite(url: string, scrapingApiKey: string): Promise<ScrapedData> {
  // SSRF guard: throws UnsafeUrlError for localhost / private IPs / odd ports / credentials.
  const parsedUrl = await assertPublicHttpUrl(url);
  const origin = `${parsedUrl.protocol}//${parsedUrl.host}`;

  const [robotsRes, llmsRes, botProtection] = await getOriginSignals(origin, url, scrapingApiKey);

  const { content: robotsRawContent, status: robotsFetchStatus } = robotsRes;
  const { content: llmsRawContent } = llmsRes;
  const llmsTxtStatus: "Present" | "Missing" = llmsRawContent.trim().length > 0 ? "Present" : "Missing";

  let robotsStatus: "Valid" | "Missing" | "Blocking AI" | "Error";
  let aiBotsStatus: BotStatus;

  if (robotsFetchStatus === 404) {
    robotsStatus = "Missing";
    aiBotsStatus = makeBotStatus();
  } else if (robotsFetchStatus === -1 || !robotsRawContent.trim()) {
    robotsStatus = "Error";
    aiBotsStatus = makeBotStatus();
  } else {
    const parsed = parseRobotsTxt(robotsRawContent);
    aiBotsStatus = parsed.aiBotsStatus;
    robotsStatus = parsed.robotsStatus;
  }

  const { html, javascriptDependency, challenge } = await fetchMainHtml(url, scrapingApiKey);

  // Even the proxy only received a challenge page => crawlers will not get through either.
  const cloudflare: CloudflareResult = challenge
    ? { detected: true, severity: "Hard", confirmedBlock: true, inconclusive: false }
    : botProtection;
  const aiAccessibility = buildAIAccessibility(aiBotsStatus, cloudflare);

  const $ = cheerio.load(html);

  // ── basic signals ──
  const title = $("title").first().text().trim().substring(0, 150) || "No title found";
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim().substring(0, 300) || "No meta description";
  const h1 = $("h1").first().text().trim().substring(0, 150) || "No H1 Found";
  const h2Count = $("h2").length;

  // ── main content (navigation, header, footer, forms and widgets removed) ──
  const $root = $("main").length === 1 ? $("main").first().clone() : $("body").clone();
  $root
    .find(
      "script, style, noscript, template, svg, nav, header, footer, aside, form, [role='navigation'], [role='banner'], [role='contentinfo'], [aria-hidden='true']"
    )
    .remove();

  const fullText = $root.text().replace(/\s+/g, " ").trim();
  const wordCount = fullText ? fullText.split(" ").filter(Boolean).length : 0;

  // Lists only count when they are real content (>= 3 items) outside navigation.
  const hasTablesOrLists =
    $root.find("table").length > 0 ||
    $root.find("ul, ol").filter((_, el) => $(el).children("li").length >= 3).length > 0;

  let bodyText = $root
    .find("h1, h2, h3, h4, p, li, tr, blockquote, dt, dd")
    .filter((_, el) => $(el).find("p, li, tr, blockquote").length === 0) // leaf blocks only, no duplicates
    .map((_, el) => $(el).text().trim())
    .get()
    .join(" ")
    .replace(/\s+/g, " ");
  if (bodyText.length < 300) bodyText = fullText; // div/span based sites
  bodyText = bodyText.substring(0, 5000);

  // ── semantic layout ──
  const allH1s = $("h1");
  const semanticLayoutMap: SemanticLayoutMap = {
    hasMainTag: $("main").length === 1,
    hasArticleTag: $("article").length > 0,
    hasHeadingLeap: false,
    hasSingleH1: allH1s.length === 1,
    totalImages: 0,
    missingAltCount: 0,
    hasAriaLabels: false,
  };

  // Accessible names: do interactive controls expose a name to an agent reading the accessibility tree?
  let totalControls = 0;
  let namedControls = 0;
  $("button, a[href], input:not([type='hidden']), select, textarea, [role='button']").each((_, el) => {
    const $el = $(el);
    totalControls++;
    const type = ($el.attr("type") || "").toLowerCase();
    const id = $el.attr("id");
    const hasName =
      Boolean($el.attr("aria-label")?.trim()) ||
      Boolean($el.attr("aria-labelledby")) ||
      Boolean($el.attr("title")?.trim()) ||
      $el.text().trim().length > 0 ||
      (["submit", "button", "reset"].includes(type) && Boolean($el.attr("value")?.trim())) ||
      ($el.is("input, select, textarea") &&
        (Boolean($el.attr("placeholder")) ||
          $el.closest("label").length > 0 ||
          (id ? $(`label[for="${id.replace(/"/g, '\\"')}"]`).length > 0 : false))) ||
      $el.find("img[alt]:not([alt=''])").length > 0 ||
      $el.find("svg title").length > 0;
    if (hasName) namedControls++;
  });
  semanticLayoutMap.hasAriaLabels = totalControls === 0 || namedControls / totalControls >= 0.9;

  $("img").each((_, el) => {
    const $img = $(el);
    const role = ($img.attr("role") || "").toLowerCase();
    const w = Number($img.attr("width"));
    const h = Number($img.attr("height"));
    const decorative =
      role === "presentation" ||
      role === "none" ||
      $img.attr("aria-hidden") === "true" ||
      (Number.isFinite(w) && w > 0 && w <= 2) ||
      (Number.isFinite(h) && h > 0 && h <= 2);
    if (decorative) return;

    semanticLayoutMap.totalImages++;
    if (!$img.attr("alt")?.trim()) semanticLayoutMap.missingAltCount++;
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

  // ── structured data ──
  const schemaSet = new Set<string>();
  const sameAsUrls = new Set<string>();
  const schemaBrandNames: string[] = [];
  let faqSchemaCount = 0;
  let hasDeepLocalBusinessSchema = false;
  let hasDeepProductSchema = false;

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
          const types = (Array.isArray(t) ? t : [t]).filter((v): v is string => typeof v === "string");
          types.forEach((v) => schemaSet.add(v));
          const has = (...names: string[]) => types.some((v) => names.includes(v));

          if (has("LocalBusiness", "Store", "Restaurant", "AutomotiveBusiness", "MedicalBusiness")) {
            if (
              (!!o["telephone"] && !!o["address"]) ||
              (!!o["address"] && (!!o["openingHours"] || !!o["openingHoursSpecification"]))
            ) {
              hasDeepLocalBusinessSchema = true;
            }
          }

          if (has("Product") && !!o["offers"] && (!!o["brand"] || !!o["aggregateRating"] || !!o["review"])) {
            hasDeepProductSchema = true;
          }

          if (has("Organization", "LocalBusiness", "Brand", "WebSite", "Corporation", "OnlineStore")) {
            for (const key of ["name", "alternateName"]) {
              const v = o[key];
              if (typeof v === "string" && v.trim().length > 0 && v.length < 60) schemaBrandNames.push(v.trim());
            }
            const sameAs = o["sameAs"];
            const list = Array.isArray(sameAs) ? sameAs : typeof sameAs === "string" ? [sameAs] : [];
            list.forEach((u) => {
              if (typeof u === "string") sameAsUrls.add(u);
            });
          }

          if (has("FAQPage")) {
            const main = o["mainEntity"];
            faqSchemaCount += Array.isArray(main) ? main.length : main ? 1 : 0;
          }
        }

        for (const val of Object.values(o)) {
          if (val && typeof val === "object") deepParse(val);
        }
      };

      deepParse(parsed);
    } catch {
      // malformed JSON-LD
    }
  });

  // Microdata (itemtype="https://schema.org/Product") is still common on older CMS themes.
  $("[itemtype]").each((_, el) => {
    const m = ($(el).attr("itemtype") || "").match(/schema\.org\/([A-Za-z]+)/i);
    if (m?.[1]) schemaSet.add(m[1]);
  });

  const detectedSchemas = Array.from(schemaSet);

  // ── entity trust ──
  const entityTrustMap: EntityTrustMap = {
    hasWikidataOrWikipedia: false,
    hasLinkedIn: false,
    hasXAccount: false,
    hasFacebookAccount: false,
    hasPhysicalSignals: false,
    brandDisambiguationStatus: "Optimal",
    detectedBrandVariants: [],
    hasDeepLocalBusinessSchema,
    hasDeepProductSchema,
    hasSameAsWikidata: false,
    sameAsCount: sameAsUrls.size,
  };

  const applyKind = (kind: ExternalKind, fromSameAs: boolean) => {
    if (kind === "wikipedia") {
      entityTrustMap.hasWikidataOrWikipedia = true;
      if (fromSameAs) entityTrustMap.hasSameAsWikidata = true;
    } else if (kind === "linkedin") entityTrustMap.hasLinkedIn = true;
    else if (kind === "x") entityTrustMap.hasXAccount = true;
    else if (kind === "facebook") entityTrustMap.hasFacebookAccount = true;
  };

  sameAsUrls.forEach((u) => applyKind(classifyExternalLink(u, url), true));
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim();
    if (href) applyKind(classifyExternalLink(href, url), false);
  });

  const bodyLower = $("body").text().toLowerCase();
  const hasPhone =
    $('a[href^="tel:"]').length > 0 ||
    /(\+\d{1,3}[\s.-]?)?(\(\d{2,4}\)|\d{2,4})[\s.-]\d{3}[\s.-]\d{3,4}/.test(bodyLower);
  const hasAddressWord = /\b(suite|floor|street|st\.|avenue|ave\.|road|rd\.|zip|postal|ulica|ul\.)\b/i.test(bodyLower);
  if ((hasPhone && hasAddressWord) || $("address").length > 0 || detectedSchemas.includes("PostalAddress") || detectedSchemas.includes("LocalBusiness")) {
    entityTrustMap.hasPhysicalSignals = true;
  }

  // brand consistency
  const footerSource = $("footer").text() || $("body").text().slice(-1500);
  const copyrightHolder = extractCopyrightHolder(footerSource);
  const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim();
  const applicationName = $('meta[name="application-name"]').attr("content")?.trim();

  const strongBrandNames = [
    ...(ogSiteName ? [ogSiteName] : []),
    ...(applicationName ? [applicationName] : []),
    ...schemaBrandNames,
    ...(copyrightHolder ? [copyrightHolder] : []),
  ];
  const brand = computeBrand(strongBrandNames, title, parsedUrl.hostname);
  entityTrustMap.detectedBrandVariants = brand.variants;
  entityTrustMap.brandDisambiguationStatus = brand.status;

  // ── Q&A ──
  // FAQPage markup and visible Q&A are the same content in two forms, so take the larger count.
  const qaBlocksCount = Math.max(faqSchemaCount, countQaBlocks($));

  const hasVideoElements =
    $("video").length > 0 ||
    $("iframe[src*='youtube.com']").length > 0 ||
    $("iframe[src*='youtube-nocookie.com']").length > 0 ||
    $("iframe[src*='youtu.be']").length > 0 ||
    $("iframe[src*='vimeo.com']").length > 0;

  const pageType = detectPageType(parsedUrl.pathname, detectedSchemas, $("article").length > 0);

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
    llmsTxtStatus,
    hasOpenGraph: Boolean($('meta[property="og:title"]').attr("content")?.trim()),
    aiBotsStatus,
    entityTrustMap,
    semanticLayoutMap,
    pageType,
    aiAccessibility,
  };
}
