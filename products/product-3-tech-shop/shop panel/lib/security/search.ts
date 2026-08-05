/**
 * Sanitizes free-text search input before navigation or API calls.
 * Limits length and strips characters that are useless for product search
 * but commonly used in XSS / injection probes.
 */
export function sanitizeSearchQuery(raw: string, maxLength = 100): string {
  if (!raw || typeof raw !== "string") return "";

  return raw
    .normalize("NFKC")
    .replace(/[<>`]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function buildShopSearchHref(query: string): string {
  const q = sanitizeSearchQuery(query);
  if (!q) return "/shop";
  return `/shop?q=${encodeURIComponent(q)}`;
}
