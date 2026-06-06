import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Standardizacija URL-a (dodavanje https:// ako fali)
    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    const chromeAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const aiBotAgent = 'PerplexityBot/1.0'; // Možeš koristiti i 'GPTBot/1.0' ili kombinovati

    // 1. KORAK: Slanje zahteva kao običan pretraživač (Kontrolni zahtev)
    let userResponseStatus = 0;
    let userResponseHeaders: Headers = new Headers();
    let siteDown = false;

    try {
      const resUser = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': chromeAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      userResponseStatus = resUser.status;
      userResponseHeaders = resUser.headers;
    } catch (error) {
      siteDown = true;
    }

    if (siteDown || userResponseStatus >= 500) {
      return NextResponse.json({
        accessible: false,
        status: 'OFFLINE',
        reason: 'Sajt je trenutno nedostupan ili odbija konekcije.',
        details: { robotsTxtClean: null, firewallBlocked: null, cloudflareDetected: false }
      });
    }

    // 2. KORAK: Slanje zahteva predstavljajući se kao AI Bot
    let botResponseStatus = 0;
    let botResponseHeaders: Headers = new Headers();

    try {
      const resBot = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': aiBotAgent,
          'Accept': '*/*',
        },
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      botResponseStatus = resBot.status;
      botResponseHeaders = resBot.headers;
    } catch (error) {
      // Ako request pukne samo za bota, to je već znak blokade na mrežnom nivou
      botResponseStatus = 403; 
    }

    // Provera da li je server Cloudflare
    const serverHeader = botResponseHeaders.get('server') || userResponseHeaders.get('server') || '';
    const isCloudflare = serverHeader.toLowerCase().includes('cloudflare');

    // 3. KORAK: Uporedna analiza i donošenje odluke
    
    // Ako regularan korisnik prolazi (200), a AI bot dobija grešku (401, 403, 503)
    const isFirewallBlocked = userResponseStatus === 200 && (botResponseStatus === 403 || botResponseStatus === 401 || botResponseStatus === 503);

    let status = 'ACCESSIBLE';
    let reason = 'AI botovi mogu uspešno pristupiti i čitati sadržaj sajta.';

    if (isFirewallBlocked) {
      status = 'BLOCKED';
      reason = isCloudflare 
        ? 'Detektovana je aktivna blokada na nivou Cloudflare WAF-a (Bot Management).'
        : 'Sajt aktivno blokira AI kraulere na nivou server firewall-a.';
    }

    return NextResponse.json({
      accessible: !isFirewallBlocked,
      status,
      reason,
      details: {
        isCloudflare,
        userStatus: userResponseStatus,
        botStatus: botResponseStatus,
        server: serverHeader
      }
    });

  } catch (globalError) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
