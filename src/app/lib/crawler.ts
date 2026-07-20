import { parseStringPromise } from "xml2js";

interface XmlLocEntry {
  loc?: string[];
}

interface XmlUrlset {
  urlset?: {
    url?: XmlLocEntry[];
  };
}

interface XmlSitemapIndex {
  sitemapindex?: {
    sitemap?: XmlLocEntry[];
  };
}

type ParsedSitemap = XmlUrlset & XmlSitemapIndex;

export async function getUrlsFromSitemap(baseUrl: string, maxPages = 15): Promise<string[]> {
  try {
    const parsedBaseUrl = new URL(baseUrl);
    const origin = parsedBaseUrl.origin;

    const possibleSitemapUrls = [
      `${origin}/sitemap.xml`,
      `${origin}/sitemap_index.xml`,
      `${origin}/sitemap-index.xml`,
    ];

    let xmlText = "";

    // 1. Pokušaj pronaći sitemap
    for (const sitemapUrl of possibleSitemapUrls) {
      try {
        const res = await fetch(sitemapUrl, {
          headers: {
            "User-Agent": "AEO-Audit-Pro-Crawler/1.0 (+https://aeoaudit-pro.com)",
          },
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
          const text = await res.text();
          if (text.includes("<urlset") || text.includes("<sitemapindex")) {
            xmlText = text;
            break;
          }
        }
      } catch {
        continue;
      }
    }

    // 2. FALLBACK: Ako nema sitemap-a, izvuci unutrašnje linkove direktno iz HTML-a početne stranice
    if (!xmlText) {
      return await extractLinksFromHomepage(origin, maxPages);
    }

    const parsedXml = (await parseStringPromise(xmlText, { explicitArray: true })) as ParsedSitemap;
    let discoveredUrls: string[] = [];

    if (parsedXml.urlset?.url) {
      discoveredUrls = parsedXml.urlset.url
        .map((entry: XmlLocEntry) => entry.loc?.[0]?.trim() ?? "")
        .filter((loc: string) => Boolean(loc) && isValidUrl(loc));
    } else if (parsedXml.sitemapindex?.sitemap) {
      const subSitemapUrls: string[] = parsedXml.sitemapindex.sitemap
        .map((entry: XmlLocEntry) => entry.loc?.[0]?.trim() ?? "")
        .filter((loc: string) => Boolean(loc) && isValidUrl(loc));

      for (const subUrl of subSitemapUrls.slice(0, 3)) {
        try {
          const subRes = await fetch(subUrl, {
            headers: { "User-Agent": "AEO-Audit-Pro-Crawler/1.0" },
            signal: AbortSignal.timeout(4000),
          });
          if (subRes.ok) {
            const subXml = await subRes.text();
            const subParsed = (await parseStringPromise(subXml, { explicitArray: true })) as ParsedSitemap;
            if (subParsed.urlset?.url) {
              const subUrls = subParsed.urlset.url
                .map((entry: XmlLocEntry) => entry.loc?.[0]?.trim() ?? "")
                .filter((loc: string) => Boolean(loc) && isValidUrl(loc));
              discoveredUrls.push(...subUrls);
            }
          }
        } catch {
          continue;
        }
      }
    }

    if (discoveredUrls.length === 0) {
      return await extractLinksFromHomepage(origin, maxPages);
    }

    const uniqueUrls = Array.from(new Set(discoveredUrls));
    const filteredUrls = uniqueUrls.filter((u) => u !== origin && u !== `${origin}/`);
    
    return [origin, ...filteredUrls.slice(0, maxPages - 1)];
  } catch (error) {
    console.warn(`[Crawler] Failed to parse sitemap for ${baseUrl}:`, error);
    return [baseUrl];
  }
}

/**
 * Pomoćna funkcija koja skine HTML početne stranice i izvuče sve unutrašnje linkove (<a href="...">)
 */
async function extractLinksFromHomepage(origin: string, maxPages: number): Promise<string[]> {
  try {
    const res = await fetch(origin, {
      headers: { "User-Agent": "AEO-Audit-Pro-Crawler/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return [origin];

    const html = await res.text();
    // Regex za pronalaženje svih href vrijednosti
    const hrefRegex = /href=["']([^"']+)["']/gi;
    const extractedUrls = new Set<string>();
    let match;

    while ((match = hrefRegex.exec(html)) !== null) {
      const href = match[1];
      if (!href) continue;

      try {
        // Pretvaranje relativnih linkova (/about) u apsolutne (https://primjer.com/about)
        const absoluteUrl = new URL(href, origin);
        
        // Uzmi samo linkove koji pripadaju istoj domeni i preskoči sidra (#), slike, pdf-ove
        if (
          absoluteUrl.origin === origin &&
          !absoluteUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|pdf|css|js)$/i) &&
          absoluteUrl.pathname !== "/"
        ) {
          extractedUrls.add(absoluteUrl.toString());
        }
      } catch {
        continue;
      }
    }

    const pageArray = Array.from(extractedUrls);
    return [origin, ...pageArray.slice(0, maxPages - 1)];
  } catch {
    return [origin];
  }
}

function isValidUrl(urlString: string): boolean {
  try {
    const u = new URL(urlString);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}