import * as cheerio from "cheerio";
import { assertPublicHttpUrl, safeGet } from "./urlSafety";

const CRAWLER_UA = "AEO-Audit-Pro-Crawler/1.0 (+https://aeoaudit-pro.com)";
const SITEMAP_TIMEOUT_MS = 6000;
const MAX_CHILD_SITEMAPS = 5;

const SKIP_EXTENSIONS = /\.(jpg|jpeg|png|gif|svg|webp|avif|ico|pdf|zip|mp4|mp3|css|js|json|xml|txt|woff2?)$/i;
const SKIP_PATH_PARTS = [
  "/login", "/signin", "/sign-in", "/signup", "/sign-up", "/register", "/cart", "/checkout",
  "/account", "/my-account", "/wp-admin", "/wp-login", "/wp-json", "/feed", "/cdn-cgi/", "/tag/", "/author/",
  "/cookie", "/privacy", "/terms",
];

function decodeXmlEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function sameSite(candidateHost: string, originHost: string): boolean {
  const strip = (h: string) => h.toLowerCase().replace(/^www\./, "");
  return strip(candidateHost) === strip(originHost);
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await safeGet(url, { timeout: SITEMAP_TIMEOUT_MS, headers: { "User-Agent": CRAWLER_UA } });
    return res.status >= 200 && res.status < 300 && typeof res.data === "string" ? res.data : null;
  } catch {
    return null;
  }
}

function extractLocs(xml: string): string[] {
  const out: string[] = [];
  const locRegex = /<loc>([\s\S]*?)<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(xml)) !== null) {
    const loc = decodeXmlEntities(match[1] ?? "").trim();
    if (loc) out.push(loc);
  }
  return out;
}

function isCrawlableUrl(candidate: string, originHost: string): boolean {
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (!sameSite(u.hostname, originHost)) return false; // never leave the audited site
    if (SKIP_EXTENSIONS.test(u.pathname)) return false;
    const lowerPath = u.pathname.toLowerCase();
    return !SKIP_PATH_PARTS.some((p) => lowerPath.includes(p));
  } catch {
    return false;
  }
}

/**
 * Picks pages round-robin across the first path segment (/blog, /pricing, /products ...) so the sample
 * covers different site sections instead of the first N URLs of the sitemap (often all blog posts).
 */
function sampleAcrossSections(urls: string[], limit: number): string[] {
  const buckets = new Map<string, string[]>();
  for (const u of urls) {
    const first = new URL(u).pathname.split("/").filter(Boolean)[0]?.toLowerCase() ?? "";
    const list = buckets.get(first) ?? [];
    list.push(u);
    buckets.set(first, list);
  }

  const queues = Array.from(buckets.values());
  const picked: string[] = [];
  let index = 0;
  while (picked.length < limit && queues.some((q) => q.length > 0)) {
    const queue = queues[index % queues.length];
    const next = queue.shift();
    if (next) picked.push(next);
    index++;
  }
  return picked;
}

function finalize(origin: string, urls: string[], maxPages: number): string[] {
  const rootCandidates = new Set([origin, `${origin}/`]);
  const unique = Array.from(new Set(urls.map((u) => u.split("#")[0]))).filter((u) => !rootCandidates.has(u));
  return [origin, ...sampleAcrossSections(unique, Math.max(0, maxPages - 1))];
}

async function sitemapUrlsFromRobots(origin: string): Promise<string[]> {
  const robots = await fetchText(`${origin}/robots.txt`);
  if (!robots) return [];
  return robots
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^sitemap:/i.test(l))
    .map((l) => l.replace(/^sitemap:\s*/i, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function getUrlsFromSitemap(baseUrl: string, maxPages = 15): Promise<string[]> {
  try {
    const parsedBaseUrl = await assertPublicHttpUrl(baseUrl);
    const origin = parsedBaseUrl.origin;
    const originHost = parsedBaseUrl.hostname;

    const candidates = [
      ...(await sitemapUrlsFromRobots(origin)),
      `${origin}/sitemap.xml`,
      `${origin}/sitemap_index.xml`,
      `${origin}/sitemap-index.xml`,
      `${origin}/sitemap/0.xml`, // Next.js App Router sitemap
    ];

    let rootXml = "";
    for (const candidate of Array.from(new Set(candidates))) {
      const text = await fetchText(candidate);
      if (text && (text.includes("<urlset") || text.includes("<sitemapindex") || text.includes("<loc>"))) {
        rootXml = text;
        break;
      }
    }

    if (!rootXml) {
      console.warn(`[Crawler] Sitemap not found for ${origin}. Falling back to homepage links.`);
      return await extractLinksFromHomepage(origin, originHost, maxPages);
    }

    let locs = extractLocs(rootXml);

    // sitemap index: follow a few child sitemaps (previously they were skipped, leaving 0 pages)
    if (rootXml.includes("<sitemapindex")) {
      const childUrls = locs.filter((l) => /\.xml(\.gz)?(\?.*)?$/i.test(l) && isCrawlableUrlIgnoringExt(l, originHost));
      // Prefer page/post/product sitemaps over image/video ones.
      const ranked = childUrls.sort((a, b) => sitemapPriority(a) - sitemapPriority(b)).slice(0, MAX_CHILD_SITEMAPS);
      const childXml = await Promise.all(ranked.map((u) => fetchText(u)));
      locs = childXml.flatMap((xml) => (xml ? extractLocs(xml) : []));
    }

    const pages = locs.filter((l) => !/\.xml(\.gz)?(\?.*)?$/i.test(l) && isCrawlableUrl(l, originHost));
    if (pages.length === 0) return await extractLinksFromHomepage(origin, originHost, maxPages);

    return finalize(origin, pages, maxPages);
  } catch (error) {
    console.warn(`[Crawler] Failed to read sitemap for ${baseUrl}:`, error);
    return [baseUrl];
  }
}

function isCrawlableUrlIgnoringExt(candidate: string, originHost: string): boolean {
  try {
    const u = new URL(candidate);
    return (u.protocol === "http:" || u.protocol === "https:") && sameSite(u.hostname, originHost);
  } catch {
    return false;
  }
}

function sitemapPriority(url: string): number {
  const l = url.toLowerCase();
  if (/(image|video|news|author|tag|category-sitemap)/.test(l)) return 3;
  if (/(page|product|service|post|article|blog)/.test(l)) return 0;
  return 1;
}

async function extractLinksFromHomepage(origin: string, originHost: string, maxPages: number): Promise<string[]> {
  try {
    const res = await safeGet(origin, { timeout: 8000, headers: { "User-Agent": CRAWLER_UA } });
    if (res.status < 200 || res.status >= 300 || typeof res.data !== "string") return [origin];

    const $ = cheerio.load(res.data);
    const found: string[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      try {
        const abs = new URL(href, origin);
        if (abs.pathname === "/" || !isCrawlableUrl(abs.toString(), originHost)) return;
        abs.hash = "";
        found.push(abs.toString());
      } catch {
        // ignore malformed href
      }
    });

    return finalize(origin, found, maxPages);
  } catch {
    return [origin];
  }
}
