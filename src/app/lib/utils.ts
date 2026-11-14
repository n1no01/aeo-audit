/**
 * Normalises user input into an absolute http(s) URL.
 * Returns "" when the input cannot be a valid public web address
 * (empty, other schemes such as javascript:/file:, malformed, no hostname).
 *
 * NOTE: this only validates *syntax*. Server-side code that actually fetches the URL
 * must additionally call `assertPublicHttpUrl` from ./urlSafety (SSRF protection).
 */
export function formatUrl(rawUrl: string): string {
  let cleaned = (rawUrl ?? "").trim();
  if (!cleaned || cleaned.length > 2048 || /\s/.test(cleaned)) return "";

  if (!/^https?:\/\//i.test(cleaned)) {
    // "localhost:3000" / "example.com:8080" look like a scheme, but are host:port.
    const looksLikeScheme = /^[a-z][a-z0-9+.-]*:/i.test(cleaned);
    const looksLikeHostPort = /^[^/]*:\d+(\/|$)/.test(cleaned);
    if (looksLikeScheme && !looksLikeHostPort) return "";
    cleaned = "https://" + cleaned;
  }

  try {
    const parsed = new URL(cleaned);
    if (!parsed.hostname) return "";
  } catch {
    return "";
  }

  return cleaned;
}
