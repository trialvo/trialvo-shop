/**
 * search-service.ts — Dedicated search API service.
 *
 * Follows the singleton-class pattern used across the codebase.
 * Wraps the existing BFF-proxied `/user/products` endpoint with
 * search-specific logic:
 *
 *  - Input sanitization (defence-in-depth)
 *  - AbortSignal forwarding for request cancellation
 *  - Runtime response validation (never trust API shape blindly)
 *  - Request deduplication (same query → share the same promise)
 *  - Circuit breaker (fail-fast after repeated failures)
 *  - Typed, structured error handling via SearchApiError
 */

import { api } from "../client";
import { sanitizeSearchQuery } from "@/lib/validation/search-sanitizer";
import {
  SearchApiError,
  SearchErrorCode,
  isProductId,
  isValidSearchSuggestion,
  type ProductId,
  type SearchParams,
  type SearchResult,
  type SearchSuggestion,
  type TrendingParams,
  type TrendingResult,
} from "./search-types";
import type { ProductListData, ProductListItem } from "./service";

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_SUGGESTION_LIMIT = 6;
const DEFAULT_TRENDING_LIMIT = 6;

/** Circuit breaker thresholds. */
const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_RESET_TIMEOUT_MS = 30_000;

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map a full `ProductListItem` to the slim `SearchSuggestion` shape.
 * This keeps search components decoupled from the full product type.
 * Performs runtime validation to ensure data integrity.
 */
function toSearchSuggestion(product: ProductListItem): SearchSuggestion | null {
  // Validate critical fields at runtime — don't blindly trust API shape
  if (!isProductId(product.id)) return null;
  if (typeof product.name !== "string" || product.name.length === 0) return null;
  if (typeof product.slug !== "string" || product.slug.length === 0) return null;

  return {
    id: product.id as ProductId,
    name: product.name,
    slug: product.slug,
    thumbnail: product.thumbnail || null,
    images: product.images ?? [],
    price_range: product.price_range
      ? {
          min: product.price_range.min,
          max: product.price_range.max,
          has_discount: product.price_range.has_discount,
        }
      : null,
  };
}

/**
 * Extract a human-readable error message from an unknown error,
 * checking for Axios-style response shapes.
 */
function extractErrorMessage(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { error?: string; message?: string }; status?: number };
    message?: string;
  };
  return (
    e?.response?.data?.error ??
    e?.response?.data?.message ??
    e?.message ??
    fallback
  );
}

/**
 * Extract HTTP status code from an Axios-style error.
 */
function extractStatusCode(err: unknown): number | undefined {
  const e = err as { response?: { status?: number } };
  return e?.response?.status;
}

// ── Circuit Breaker ─────────────────────────────────────────────────────────

/**
 * Lightweight circuit breaker to prevent cascading failures.
 *
 * States:
 *  - CLOSED: requests flow normally
 *  - OPEN: requests fail-fast immediately (after threshold failures)
 *  - HALF_OPEN: one probe request allowed to test recovery
 */
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";

  private readonly threshold: number;
  private readonly resetTimeoutMs: number;

  constructor(threshold: number, resetTimeoutMs: number) {
    this.threshold = threshold;
    this.resetTimeoutMs = resetTimeoutMs;
  }

  /** Check if the circuit allows a request through. */
  canExecute(): boolean {
    if (this.state === "CLOSED") return true;

    if (this.state === "OPEN") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        return true;
      }
      return false;
    }

    // HALF_OPEN: allow one probe
    return true;
  }

  /** Record a successful request — reset the circuit. */
  onSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  /** Record a failed request — open the circuit if threshold reached. */
  onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.threshold) {
      this.state = "OPEN";
    }
  }

  /** Returns true if the circuit is currently open (blocking requests). */
  get isOpen(): boolean {
    return this.state === "OPEN";
  }
}

// ── Request Deduplication ───────────────────────────────────────────────────

/**
 * In-flight request cache for deduplication. If the same query fires
 * twice before the first resolves, we return the existing promise instead
 * of creating a duplicate network request.
 */
const inflightRequests = new Map<string, Promise<SearchResult>>();

function getDeduplicationKey(query: string, limit: number, offset: number): string {
  return `search:${query}:${limit}:${offset}`;
}

// ── Service ─────────────────────────────────────────────────────────────────

class SearchService {
  private readonly searchCircuit = new CircuitBreaker(
    CIRCUIT_FAILURE_THRESHOLD,
    CIRCUIT_RESET_TIMEOUT_MS,
  );

  /**
   * Search products by query string.
   *
   * The query is sanitized before being sent to the API (defence-in-depth;
   * callers should also sanitize at the input boundary).
   *
   * Features:
   *  - Runtime response validation (filters out malformed items)
   *  - Request deduplication (prevents redundant network calls)
   *  - Circuit breaker (fails fast after repeated failures)
   *  - Typed errors via SearchApiError
   */
  async searchProducts(params: SearchParams): Promise<SearchResult> {
    const sanitized = sanitizeSearchQuery(params.query);
    const limit = params.limit ?? DEFAULT_SUGGESTION_LIMIT;
    const offset = params.offset ?? 0;

    if (sanitized.length < 2) {
      return { products: [], total: 0, query: sanitized };
    }

    // Circuit breaker check
    if (!this.searchCircuit.canExecute()) {
      throw new SearchApiError(
        "Search service temporarily unavailable",
        SearchErrorCode.CIRCUIT_OPEN,
        { retryable: true },
      );
    }

    // Request deduplication — return existing promise if in-flight
    const dedupeKey = getDeduplicationKey(sanitized, limit, offset);
    const existing = inflightRequests.get(dedupeKey);
    if (existing) return existing;

    const promise = this.executeSearch(sanitized, limit, offset, params.signal);

    inflightRequests.set(dedupeKey, promise);

    try {
      return await promise;
    } finally {
      inflightRequests.delete(dedupeKey);
    }
  }

  /**
   * Internal: execute the actual search request.
   */
  private async executeSearch(
    query: string,
    limit: number,
    offset: number,
    signal?: AbortSignal,
  ): Promise<SearchResult> {
    try {
      const response = await api.get<ProductListData>("/user/products", {
        params: {
          search: query,
          limit,
          offset,
          status: true,
        },
        signal,
      });

      const data = response.data;

      // Runtime response validation
      if (!data || !Array.isArray(data.products)) {
        this.searchCircuit.onFailure();
        return { products: [], total: 0, query };
      }

      // Map and filter — drop malformed items instead of crashing
      const products = data.products
        .map(toSearchSuggestion)
        .filter((item): item is SearchSuggestion => item !== null);

      this.searchCircuit.onSuccess();

      return {
        products,
        total: data.total ?? products.length,
        query,
      };
    } catch (err: unknown) {
      // Don't throw on abort — it's expected when the user types quickly
      if (err instanceof DOMException && err.name === "AbortError") {
        return { products: [], total: 0, query };
      }

      // Record failure for circuit breaker
      this.searchCircuit.onFailure();

      const statusCode = extractStatusCode(err);
      const message = extractErrorMessage(err, "Search request failed");

      // Rate limited
      if (statusCode === 429) {
        throw new SearchApiError(message, SearchErrorCode.RATE_LIMITED, {
          statusCode,
          retryable: true,
          cause: err,
        });
      }

      // Server error (5xx)
      if (statusCode && statusCode >= 500) {
        throw new SearchApiError(message, SearchErrorCode.SERVER_ERROR, {
          statusCode,
          retryable: true,
          cause: err,
        });
      }

      // Network / timeout
      throw new SearchApiError(message, SearchErrorCode.NETWORK, {
        statusCode,
        retryable: true,
        cause: err,
      });
    }
  }

  /**
   * Fetch trending / featured products to display as search suggestions
   * when the search input is empty. Falls back to an empty array on error.
   */
  async getTrending(params?: TrendingParams): Promise<TrendingResult> {
    try {
      const response = await api.get<ProductListData>("/user/products", {
        params: {
          featured: true,
          sort_by: "created_at",
          sort_order: "desc",
          limit: params?.limit ?? DEFAULT_TRENDING_LIMIT,
          status: true,
        },
        signal: params?.signal,
      });

      const data = response.data;

      if (!data || !Array.isArray(data.products)) {
        return { products: [] };
      }

      // Runtime validation on trending results too
      const products = data.products
        .map(toSearchSuggestion)
        .filter((item): item is SearchSuggestion => item !== null);

      return { products };
    } catch {
      // Trending is non-critical — silently return empty on failure
      return { products: [] };
    }
  }
}

export const searchService = new SearchService();
