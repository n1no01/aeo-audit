export function formatUrl(rawUrl: string): string {
  let cleaned = rawUrl.trim();
  if (!cleaned) return "";
  
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = "https://" + cleaned;
  }
  
  return cleaned;
}