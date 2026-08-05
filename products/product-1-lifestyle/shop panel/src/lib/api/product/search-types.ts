/**
 * search-types.ts — Strict domain types for the search feature.
 *
 * Kept separate from the generic ProductListItem types so that search
 * components only depend on the minimal shape they actually need.
 *
 * Provides:
 *  - Branded ID types for compile-time safety
 *  - Runtime validation guards for API response integrity
 *  - Structured error types for typed error handling
 *  - Sort/pagination types for full search pages
 */

// ── Branded ID Types ────────────────────────────────────────────────────────

/**
 * Nominal brand helper — creates distinct types from primitives so that
 * e.g. a `ProductId` can never be accidentally assigned to a `VariationId`.
 */
type Brand<T, B extends string> = T & { readonly __brand: B };

/** A product ID as returned by the search API. */
export type ProductId = Brand<number, "ProductId">;

/** Type guard to check if a value is a valid ProductId at runtime. */
export function isProductId(value: unknown): value is ProductId {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

// ── Search Error Types ──────────────────────────────────────────────────────

/** Enumeration of known search error conditions. */
export const SearchErrorCode = {
  NETWORK: "SEARCH_NETWORK_ERROR",
  TIMEOUT: "SEARCH_TIMEOUT",
  ABORT: "SEARCH_ABORTED",
  INVALID_RESPONSE: "SEARCH_INVALID_RESPONSE",
  RATE_LIMITED: "SEARCH_RATE_LIMITED",
  SERVER_ERROR: "SEARCH_SERVER_ERROR",
  CIRCUIT_OPEN: "SEARCH_CIRCUIT_OPEN",
} as const;

export type SearchErrorCode = (typeof SearchErrorCode)[keyof typeof SearchErrorCode];

/**
 * Structured error for search operations — carries machine-readable `code`,
 * HTTP `statusCode`, and a `retryable` flag so callers can decide whether
 * to retry or show a terminal error.
 */
export class SearchApiError extends Error {
  readonly code: SearchErrorCode;
  readonly statusCode: number | null;
  readonly retryable: boolean;

  constructor(
    message: string,
    code: SearchErrorCode,
    options?: { statusCode?: number; retryable?: boolean; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = "SearchApiError";
    this.code = code;
    this.statusCode = options?.statusCode ?? null;
    this.retryable = options?.retryable ?? false;
  }
}

// ── Request Types ───────────────────────────────────────────────────────────

/** Parameters accepted by `SearchService.searchProducts()`. */
export interface SearchParams {
  /** The sanitized search query string. */
  readonly query: string;
  /** Maximum number of results to return (default: 6 for suggestions, 24 for full search). */
  readonly limit?: number;
  /** Offset for pagination. */
  readonly offset?: number;
  /** AbortSignal for request cancellation on rapid re-queries. */
  readonly signal?: AbortSignal;
}

/** Parameters for fetching trending/featured products. */
export interface TrendingParams {
  readonly limit?: number;
  readonly signal?: AbortSignal;
}

/** Sort options available for full search result pages. */
export type SearchSort =
  | "relevance"
  | "newest"
  | "oldest"
  | "price-asc"
  | "price-desc"
  | "az"
  | "za";

// ── Response Types ──────────────────────────────────────────────────────────

/**
 * A single search suggestion item — the minimal product shape needed by
 * the SearchOverlay and HeaderSearchBar dropdown UIs.
 */
export interface SearchSuggestion {
  readonly id: ProductId;
  readonly name: string;
  readonly slug: string;
  readonly thumbnail: string | null;
  readonly images: ReadonlyArray<{ path: string }>;
  readonly price_range: {
    readonly min: number;
    readonly max: number;
    readonly has_discount: boolean;
  } | null;
}

/** Typed response from `SearchService.searchProducts()`. */
export interface SearchResult {
  /** Matching products mapped to the suggestion shape. */
  readonly products: SearchSuggestion[];
  /** Total number of matching products (for pagination). */
  readonly total: number;
  /** The sanitized query that was actually sent to the API. */
  readonly query: string;
}

/** Typed response from `SearchService.getTrending()`. */
export interface TrendingResult {
  readonly products: SearchSuggestion[];
}

// ── Raw API Response ────────────────────────────────────────────────────────

/**
 * Shape of the raw JSON envelope returned by `GET /api/v1/user/products`.
 * Used at the service layer to validate before mapping to domain types.
 * Decoupled from internal `ProductListData` to make the boundary explicit.
 */
export interface RawSearchApiResponse {
  readonly products?: unknown[];
  readonly total?: number;
  readonly count?: number;
  readonly has_more?: boolean;
}

// ── Runtime Validators ──────────────────────────────────────────────────────

/**
 * Runtime type guard that validates the shape of a single search suggestion
 * from the API response. Protects against malformed data silently breaking
 * the UI. Only checks structural invariants — not business rules.
 */
export function isValidSearchSuggestion(value: unknown): value is SearchSuggestion {
  if (value === null || typeof value !== "object") return false;

  const obj = value as Record<string, unknown>;

  return (
    isProductId(obj.id) &&
    typeof obj.name === "string" &&
    obj.name.length > 0 &&
    typeof obj.slug === "string" &&
    obj.slug.length > 0
  );
}

/**
 * Validate and narrow a raw API response to the `RawSearchApiResponse` shape.
 */
export function isValidSearchResponse(value: unknown): value is RawSearchApiResponse {
  if (value === null || typeof value !== "object") return false;

  const obj = value as Record<string, unknown>;

  // `products` must be an array if present
  if ("products" in obj && !Array.isArray(obj.products)) return false;

  return true;
}
