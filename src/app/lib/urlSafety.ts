import { lookup } from "node:dns/promises";
import net from "node:net";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * SSRF protection for every server-side fetch of a user supplied URL.
 *
 * - only http/https on the default ports (80/443)
 * - no embedded credentials
 * - hostname must resolve ONLY to public IP addresses
 * - redirects are followed manually and every hop is validated again
 *
 * Known limitation: a DNS-rebinding attacker could still change the answer between
 * our lookup and the socket connect. Running the scraper in an egress-restricted
 * environment (no access to internal networks / metadata endpoints) closes that gap.
 */

export class UnsafeUrlError extends Error {
  constructor(message = "This URL is not allowed.") {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata",
  "metadata.google.internal",
]);

const BLOCKED_SUFFIXES = [".localhost", ".local", ".internal", ".intranet", ".lan", ".home", ".corp", ".private"];

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true;
  const [a, b, c] = parts;

  if (a === 0 || a === 10 || a === 127) return true; // this-network, private, loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 169 && b === 254) return true; // link-local / cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true; // IETF protocol / TEST-NET-1
  if (a === 192 && b === 168) return true; // private
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast + reserved + broadcast
  return false;
}

function isPrivateIPv6(rawIp: string): boolean {
  const ip = rawIp.toLowerCase().split("%")[0];
  if (ip === "::" || ip === "::1") return true;

  // IPv4-mapped (::ffff:a.b.c.d or ::ffff:7f00:1)
  const mapped = ip.match(/^(?:0{0,4}:){0,5}ffff:(.+)$/);
  if (mapped) {
    const tail = mapped[1];
    if (tail.includes(".")) return isPrivateIPv4(tail);
    const groups = tail.split(":");
    if (groups.length === 2) {
      const hi = parseInt(groups[0], 16);
      const lo = parseInt(groups[1], 16);
      if (!Number.isNaN(hi) && !Number.isNaN(lo)) {
        return isPrivateIPv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
      }
    }
    return true;
  }

  if (/^f[cd]/.test(ip)) return true; // fc00::/7 unique local
  if (/^fe[89ab]/.test(ip)) return true; // fe80::/10 link-local
  if (ip.startsWith("ff")) return true; // multicast
  if (ip.startsWith("2001:db8")) return true; // documentation
  if (ip.startsWith("2002:")) return true; // 6to4 (can embed private v4)
  if (ip.startsWith("64:ff9b:")) return true; // NAT64
  return false;
}

export function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isPrivateIPv4(ip);
  if (family === 6) return isPrivateIPv6(ip);
  return true;
}

/**
 * Throws UnsafeUrlError unless `rawUrl` is a public http(s) URL.
 * Returns the parsed URL on success.
 */
export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError("Invalid URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs can be audited.");
  }
  if (parsed.username || parsed.password) {
    throw new UnsafeUrlError("URLs with embedded credentials are not allowed.");
  }
  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
    throw new UnsafeUrlError("Only standard web ports (80/443) can be audited.");
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new UnsafeUrlError("Private or reserved IP addresses cannot be audited.");
    return parsed;
  }

  if (BLOCKED_HOSTNAMES.has(host) || BLOCKED_SUFFIXES.some((s) => host.endsWith(s)) || !host.includes(".")) {
    throw new UnsafeUrlError("Internal hostnames cannot be audited.");
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError("This domain could not be resolved.");
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new UnsafeUrlError("This domain resolves to a private or reserved address.");
  }

  return parsed;
}

export async function isPublicHttpUrl(rawUrl: string): Promise<boolean> {
  try {
    await assertPublicHttpUrl(rawUrl);
    return true;
  } catch {
    return false;
  }
}

/**
 * GET that never throws on HTTP status codes and never follows a redirect to a
 * non-public destination. Response body is always returned as text (max 5 MB).
 */
export async function safeGet(
  url: string,
  config: AxiosRequestConfig = {},
  maxRedirects = 3
): Promise<AxiosResponse<string>> {
  let current = url;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    await assertPublicHttpUrl(current);

    const res = await axios.get<string>(current, {
      ...config,
      maxRedirects: 0,
      validateStatus: () => true,
      responseType: "text",
      transformResponse: [(data: unknown) => data],
      maxContentLength: 5_000_000,
      maxBodyLength: 5_000_000,
    });

    const location = res.headers?.location;
    if (res.status >= 300 && res.status < 400 && typeof location === "string" && location) {
      current = new URL(location, current).toString();
      continue;
    }
    return res;
  }

  throw new Error("Too many redirects.");
}
