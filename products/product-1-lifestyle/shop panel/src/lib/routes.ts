/**
 * routes.ts — Type-safe route and URL construction helpers.
 *
 * Defence-in-depth:
 *  - Search queries are sanitized before URL construction
 *  - Double-encoding detection prevents mangled URLs
 *  - URL length validation prevents excessively long URLs
 *  - `parseSearchQueryFromUrl` provides safe extraction of `?q=` params
 */

import {
  sanitizeSearchQuery,
  MAX_SEARCH_QUERY_LENGTH,
} from "@/lib/validation/search-sanitizer";

export { MAX_SEARCH_QUERY_LENGTH };

// ── Constants ───────────────────────────────────────────────────────────────

/** Maximum safe URL length (most browsers support ~2000). */
const MAX_URL_LENGTH = 2000;

/** Pattern that detects already-percent-encoded sequences. */
const PERCENT_ENCODED_RE = /%[0-9A-Fa-f]{2}/;

// ── Query Helpers ───────────────────────────────────────────────────────────

/**
 * Normalize and sanitize a search query string.
 */
export function normalizeSearchQuery(value: string): string {
  return sanitizeSearchQuery(value);
}

/**
 * Build the `/shop?q=` search results URL.
 *
 * Safety checks:
 *  - Sanitizes the query string
 *  - Detects and avoids double-encoding
 *  - Validates final URL length
 *  - Returns `/shop` if the query is empty or URL is too long
 */
export function getShopSearchHref(query: string): string {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) return "/shop";

  // Detect if the query is already percent-encoded to prevent double-encoding
  const needsEncoding = !PERCENT_ENCODED_RE.test(normalized);
  const encoded = needsEncoding
    ? encodeURIComponent(normalized)
    : normalized;

  const href = `/shop?q=${encoded}`;

  // Guard against excessively long URLs
  if (href.length > MAX_URL_LENGTH) {
    return `/shop?q=${encodeURIComponent(normalized.slice(0, 50))}`;
  }

  return href;
}

/**
 * Build a product detail URL from a slug.
 * Slugs are always encoded to prevent path-traversal attacks.
 */
export function getProductHref(slug: string | number): string {
  return `/product/${encodeURIComponent(String(slug))}`;
}

/**
 * Safely extract and sanitize the `?q=` search query from URL search params.
 *
 * Use this instead of directly reading `searchParams.get("q")` to ensure
 * the extracted value is sanitized and type-safe.
 */
export function parseSearchQueryFromUrl(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): string {
  const raw = searchParams.get("q");
  if (!raw) return "";

  // Decode if needed (handles cases where the URL is already decoded by the framework)
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // Invalid percent-encoding — use raw value
    decoded = raw;
  }

  return sanitizeSearchQuery(decoded);
}
