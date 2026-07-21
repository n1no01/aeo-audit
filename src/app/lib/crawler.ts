export async function getUrlsFromSitemap(baseUrl: string, maxPages = 15): Promise<string[]> {
  try {
    const parsedBaseUrl = new URL(baseUrl);
    const origin = parsedBaseUrl.origin;

    const possibleSitemapUrls = [
      `${origin}/sitemap.xml`,
      `${origin}/sitemap/0.xml`, // Next.js App Router specifični sitemap
      `${origin}/sitemap_index.xml`,
      `${origin}/sitemap-index.xml`,
    ];

    let xmlText = "";

    // 1. Pokušaj pronaći sitemap (8s timeout da Vercel stigne izgenerisati sitemap.ts)
    for (const sitemapUrl of possibleSitemapUrls) {
      try {
        const res = await fetch(sitemapUrl, {
          headers: {
            "User-Agent": "AEO-Audit-Pro-Crawler/1.0 (+https://aeoaudit-pro.com)",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (res.ok) {
          const text = await res.text();
          if (text.includes("<urlset") || text.includes("<sitemapindex") || text.includes("<loc>")) {
            xmlText = text;
            break;
          }
        }
      } catch {
        continue;
      }
    }

    // 2. FALLBACK: Ako nema sitemap-a ili je isteklo vrijeme, izvuci linkove iz HTML-a
    if (!xmlText) {
      console.warn(`[Crawler] Sitemap not found or timed out for ${origin}. Falling back to homepage links.`);
      return await extractLinksFromHomepage(origin, maxPages);
    }

    // 🚀 POBOLJŠANI REGEX: [\s\S]*? omogućava hvatanje URL-ova čak i ako sadrže newlines/razmake
    const locRegex = /<loc>([\s\S]*?)<\/loc>/gi;
    const discoveredUrls: string[] = [];
    let match;

    while ((match = locRegex.exec(xmlText)) !== null) {
      const urlCandidate = match[1]?.trim();
      if (urlCandidate && isValidUrl(urlCandidate)) {
        // Preskačemo sitemapindex .xml linkove
        if (!urlCandidate.endsWith(".xml")) {
          discoveredUrls.push(urlCandidate);
        }
      }
    }

    if (discoveredUrls.length === 0) {
      return await extractLinksFromHomepage(origin, maxPages);
    }

    const uniqueUrls = Array.from(new Set(discoveredUrls));
    
    // Root URL uvijek stavljamo na prvo mjesto
    const filteredUrls = uniqueUrls.filter((u) => u !== origin && u !== `${origin}/`);
    
    return [origin, ...filteredUrls.slice(0, maxPages - 1)];
  } catch (error) {
    console.warn(`[Crawler] Failed to parse sitemap for ${baseUrl}:`, error);
    return [baseUrl];
  }
}

/**
 * Pomoćna funkcija koja skine HTML početne stranice i izvuče unutrašnje linkove (<a href="...">)
 */
async function extractLinksFromHomepage(origin: string, maxPages: number): Promise<string[]> {
  try {
    const res = await fetch(origin, {
      headers: { "User-Agent": "AEO-Audit-Pro-Crawler/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [origin];

    const html = await res.text();
    const hrefRegex = /href=["']([^"']+)["']/gi;
    const extractedUrls = new Set<string>();
    let match;

    while ((match = hrefRegex.exec(html)) !== null) {
      const href = match[1];
      if (!href) continue;

      try {
        const absoluteUrl = new URL(href, origin);
        
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