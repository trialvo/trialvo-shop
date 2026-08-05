/**
 * Lightweight HTML sanitizer for trusted-ish CMS product descriptions.
 * Strips scripts, handlers, and dangerous URLs — enough for shop content
 * without adding a heavy dependency.
 */
const BLOCKED_TAGS =
  /<\/?(?:script|iframe|object|embed|form|link|meta|base|svg|math)[^>]*>/gi;

const EVENT_HANDLERS = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

const DANGEROUS_URLS =
  /(?:href|src|xlink:href)\s*=\s*(?:"\s*(?:javascript|vbscript|data):[^"]*"|'\s*(?:javascript|vbscript|data):[^']*'|(?:javascript|vbscript|data):[^\s>]*)/gi;

export function sanitizeProductHtml(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "";

  return raw
    .replace(BLOCKED_TAGS, "")
    .replace(EVENT_HANDLERS, "")
    .replace(DANGEROUS_URLS, 'href="#"')
    .trim();
}

/** Plain-text fallback when HTML is not desired */
export function htmlToPlainText(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "";
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
