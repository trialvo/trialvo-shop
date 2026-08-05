/**
 * Sanitizes product URL slugs from route params before API lookup.
 * Keeps only URL-safe slug characters and caps length.
 */
export function sanitizeProductSlug(raw: string | null | undefined, maxLength = 200): string {
  if (!raw || typeof raw !== "string") return "";

  return raw
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[<>`"']/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, maxLength);
}
