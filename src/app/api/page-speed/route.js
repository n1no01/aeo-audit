import { NextResponse } from 'next/server';
import { formatUrl } from '../../lib/utils';
import { isPublicHttpUrl } from '../../lib/urlSafety';
import { rateLimit, clientIp } from '../../lib/rateLimit';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const strategy = searchParams.get('strategy') === 'mobile' ? 'mobile' : 'desktop';

  if (!rawUrl) {
    return NextResponse.json({ error: 'URL je obavezan' }, { status: 400 });
  }

  // Protects the paid Google quota and rejects junk/internal URLs.
  if (!rateLimit(`pagespeed:${clientIp(request.headers)}`, 6, 60_000).ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const targetUrl = formatUrl(rawUrl);
  if (!targetUrl || !(await isPublicHttpUrl(targetUrl))) {
    return NextResponse.json({ error: 'Invalid or non-public URL' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const googleEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${apiKey}&strategy=${strategy}&category=performance&category=seo&category=accessibility`;

  try {
    const res = await fetch(googleEndpoint);
    if (!res.ok) throw new Error('Google API greška pri dohvaćanju podataka');
    
    const data = await res.json();
    
    const perfScore = data.lighthouseResult?.categories?.performance?.score;
    const seoScore = data.lighthouseResult?.categories?.seo?.score;
    const accScore = data.lighthouseResult?.categories?.accessibility?.score;

    const auditResult = {
      performanceScore: perfScore !== undefined && perfScore !== null ? perfScore * 100 : 0,
      seoScore: seoScore !== undefined && seoScore !== null ? seoScore * 100 : 0,
      accessibilityScore: accScore !== undefined && accScore !== null ? accScore * 100 : 0,
      
      metrics: {
        // 1. LCP (Largest Contentful Paint)
        // ŠTO RADI: Mjeri vrijeme potrebno da se potpuno učita najveći tekstualni ili vizualni blok na stranici (npr. glavni članak).
        // ZAŠTO JE VAŽNO ZA AEO: Ako se glavni tekst učitava presporo, AI scraperi i LLM klijenti mogu uhvatiti prazan DOM snapshot zbog strogih timeout limita.
        lcp: data.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue || "N/A",
        
        // 2. CLS (Cumulative Layout Shift)
        // ŠTO RADI: Mjeri vizualnu stabilnost stranice. Prati koliko se elementi (tekst, gumbi) "trzaju" i skaču po ekranu dok se učitavaju reklame ili slike.
        // ZAŠTO JE VAŽNO ZA AEO: Ako se layout previše pomiče, multimodalni AI modeli (koji analiziraju izgled stranice) mogu pogrešno povezati naslove s krivim odlomcima teksta.
        cls: data.lighthouseResult?.audits?.['cumulative-layout-shift']?.displayValue || "N/A",
        
        // 3. FCP (First Contentful Paint)
        // ŠTO RADI: Označava trenutak kada preglednik (ili crawler) uspije renderirati bilo koji prvi dio sadržaja na ekranu (bilo tekst, logo ili pozadinu).
        // ZAŠTO JE VAŽNO ZA AEO: To je prvi signal AI botu da je stranica živa i aktivna, sprječavajući rano prekidanje veze od strane agresivnih crawlera.
        fcp: data.lighthouseResult?.audits?.['first-contentful-paint']?.displayValue || "N/A",
        
        // 4. TTFB / Server Response Time (Time to First Byte)
        // ŠTO RADI: Mjeri brzinu odziva tvog servera, odnosno vrijeme od slanja zahtjeva do trenutka kad server pošalje prvi bajt podataka natrag.
        // ZAŠTO JE VAŽNO ZA AEO: Ključni obrambeni mehanizam protiv AI timeouta. Ako serveru treba predugo da odgovori, AI agenti (SearchGPT, Perplexity) odmah prekidaju crawl.
        ttfb: (() => {
          const audit = data.lighthouseResult?.audits?.['server-response-time'] || 
                        data.lighthouseResult?.audits?.['experimental-time-to-first-byte'];
          
          if (!audit) return "N/A";
          if (audit.displayValue) return audit.displayValue; // Vraća formatirano (npr. "0.3 s")
          
          // Fallback: Ako displayValue nedostaje, ručno pretvaramo milisekunde u sekunde
          if (audit.numericValue !== undefined) {
            return `${(audit.numericValue / 1000).toFixed(2)} s`;
          }
          return "N/A";
        })()
      },

      opportunities: [
        {
          id: "render-blocking",
          title: "Eliminate render-blocking resources",
          passed: (data.lighthouseResult?.audits?.['render-blocking-resources']?.score ?? 1) >= 0.9
        },
        {
          id: "server-time",
          title: "Optimize Initial Server Response Time (TTFB)",
          passed: (data.lighthouseResult?.audits?.['server-response-time']?.score ?? 1) >= 0.9
        },
        {
          id: "structured-data",
          title: "Structured Data Validation Check",
          passed: (data.lighthouseResult?.audits?.['structured-data']?.score ?? 1) >= 0.9
        }
      ]
    };

    return NextResponse.json(auditResult);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}