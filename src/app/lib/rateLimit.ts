/**
 * Small in-memory sliding-window limiter. It is per server instance (serverless instances do not share memory),
 * so it is a cheap first line of defence against bursts, not a hard global quota.
 * Hard quotas are enforced by the credit RPCs in the database.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const fresh = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (fresh.length >= limit) {
    buckets.set(key, fresh);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - fresh[0])) / 1000)) };
  }

  fresh.push(now);
  buckets.set(key, fresh);

  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
