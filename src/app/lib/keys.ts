import { randomBytes } from "crypto";

/** Cryptographically secure token (Math.random() keys are guessable). */
export function generateKey(prefix: string): string {
  return `${prefix}_${randomBytes(24).toString("base64url")}`;
}

/** Secret key: full audit access, spends credits. Never put it in a public embed. */
export const generateApiKey = () => generateKey("aeo_live");

/** Public key: safe to embed in a website widget, can only run rate-limited lead-gen scans. */
export const generateWidgetKey = () => generateKey("aeo_wgt");
