/**
 * search-sanitizer.ts — Centralized search input sanitization & validation.
 *
 * Defence-in-depth: used by both the service layer (before API calls)
 * and the route helpers (before URL construction).
 *
 * Security layers applied in order:
 *  1. Unicode NFC normalization (prevents homoglyph bypass)
 *  2. Control character stripping (U+0000–U+001F, U+007F)
 *  3. Injection marker removal (SQL, NoSQL, regex metacharacters)
 *  4. Whitespace collapse & trimming
 *  5. Length enforcement
 */

/** Maximum allowed length for a search query string. */
export const MAX_SEARCH_QUERY_LENGTH = 100;

/** Minimum characters required before a search query is considered valid. */
export const MIN_SEARCH_QUERY_LENGTH = 2;

// ── Internal helpers ────────────────────────────────────────────────────────

/**
 * Strip ASCII control characters (U+0000–U+001F, U+007F) that have no
 * legitimate use in search input and could be used for injection attacks.
 */
const CONTROL_CHAR_RE = /[\x00-\x1f\x7f]/g;

/**
 * Collapse runs of whitespace (spaces, tabs, non-breaking-spaces, etc.)
 * into a single regular space.
 */
const WHITESPACE_COLLAPSE_RE = /\s+/g;

/**
 * Regex metacharacters that could be used for ReDoS or regex injection
 * when the backend uses user input in regex-based search.
 * We escape these rather than strip, so "C++" still works as "C\\+\\+".
 */
const REGEX_META_RE = /[.*+?^${}()|[\]\\]/g;

/**
 * Common SQL / NoSQL injection markers. These patterns have no legitimate
 * use in product search queries. We strip them entirely.
 */
const INJECTION_MARKERS_RE =
  /(?:--|;|'|"|`|\\|\/\*|\*\/|\b(?:DROP|DELETE|UPDATE|INSERT|UNION|SELECT|ALTER|EXEC)\b|\$(?:gt|lt|ne|eq|regex|where|or|and)\b|\{|\})/gi;

/**
 * HTML-sensitive characters replaced with their entity equivalents to
 * prevent reflected-XSS when the query is echoed in the DOM.
 */
const HTML_ENTITY_MAP: Readonly<Record<string, string>> = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
});

const HTML_SPECIAL_RE = /[&<>"']/g;

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Sanitize a raw search query string for safe use in API calls and DOM rendering.
 *
 * Steps:
 *  1. Trim leading/trailing whitespace
 *  2. Normalize Unicode to NFC form (prevents homoglyph bypasses)
 *  3. Strip control characters
 *  4. Remove injection markers (SQL, NoSQL keywords)
 *  5. Collapse internal whitespace runs
 *  6. Enforce maximum length
 *
 * This does **not** HTML-escape — use `escapeSearchQueryForDisplay` when
 * rendering user input in JSX text content (React auto-escapes, so this is
 * only needed for `dangerouslySetInnerHTML` or non-React contexts).
 */
export function sanitizeSearchQuery(raw: string): string {
  if (!raw) return "";

  return raw
    .trim()
    .normalize("NFC")
    .replace(CONTROL_CHAR_RE, "")
    .replace(INJECTION_MARKERS_RE, "")
    .replace(WHITESPACE_COLLAPSE_RE, " ")
    .trim()
    .slice(0, MAX_SEARCH_QUERY_LENGTH);
}

/**
 * Escape regex metacharacters in a search query so it can be safely used
 * in regex-based search on the backend without ReDoS risk.
 *
 * This is applied at the service layer before sending to the API — not
 * at the input boundary — so the UI can still display the original query.
 */
export function escapeRegexMetacharacters(query: string): string {
  return query.replace(REGEX_META_RE, "\\$&");
}

/**
 * HTML-escape a search query for safe insertion in contexts that bypass
 * React's auto-escaping (e.g. `dangerouslySetInnerHTML`, `<title>` tags).
 */
export function escapeSearchQueryForDisplay(query: string): string {
  return query.replace(HTML_SPECIAL_RE, (ch) => HTML_ENTITY_MAP[ch] ?? ch);
}

/**
 * Returns `true` when the (already-sanitized) query meets the minimum
 * requirements for triggering an API search request.
 */
export function isValidSearchQuery(query: string): boolean {
  const sanitized = sanitizeSearchQuery(query);
  return sanitized.length >= MIN_SEARCH_QUERY_LENGTH;
}

/**
 * Validate that a search query doesn't contain obvious injection attempts.
 * Returns `true` if the query is considered safe. Unlike `sanitizeSearchQuery`,
 * this does not modify the input — it's a pure check.
 */
export function isCleanSearchQuery(query: string): boolean {
  return !INJECTION_MARKERS_RE.test(query);
}
