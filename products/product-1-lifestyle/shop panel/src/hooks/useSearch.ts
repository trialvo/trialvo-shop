"use client";

/**
 * useSearch.ts — Search-specific React hooks.
 *
 * Provides dedicated hooks for search functionality instead of piggybacking
 * on the generic `useProduct` hook. Each hook encapsulates one concern:
 *
 *  - `useSearchProducts`    — live search results with abort support
 *  - `useTrendingSearches`  — API-driven trending suggestions with fallback
 *  - `useRecentSearches`    — localStorage-backed recent search history
 *  - `useSearchState`       — shared state management (query, debounce, highlight)
 *
 * Design decisions:
 *  - `useSearchState` extracts duplicate logic from SearchOverlay & HeaderSearchBar
 *  - Recent searches are validated and deduplicated on both read and write
 *  - Search analytics fires only on explicit user actions (Enter / View All)
 */

import { searchService } from "@/lib/api/product/search-service";
import { SearchApiError } from "@/lib/api/product/search-types";
import type { SearchSuggestion } from "@/lib/api/product/search-types";
import {
  sanitizeSearchQuery,
  isValidSearchQuery,
  MAX_SEARCH_QUERY_LENGTH,
} from "@/lib/validation/search-sanitizer";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

// ── Query Keys ──────────────────────────────────────────────────────────────

export const searchKeys = {
  all: ["search"] as const,

  products: (query: string, limit?: number) =>
    [...searchKeys.all, "products", query, limit ?? 6] as const,

  trending: (limit?: number) =>
    [...searchKeys.all, "trending", limit ?? 6] as const,
} as const;

// ── useSearchProducts ───────────────────────────────────────────────────────

export interface UseSearchProductsOptions {
  /** Maximum results to fetch (default: 6). */
  limit?: number;
  /** Override the automatic enabled gate (query.length >= 2). */
  enabled?: boolean;
}

export interface UseSearchProductsReturn {
  results: SearchSuggestion[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

/**
 * Fetch live search results for a debounced query string.
 *
 * The caller is responsible for debouncing — this hook just accepts the
 * current debounced value and manages the react-query lifecycle.
 *
 * Requests are automatically cancelled via AbortSignal when the query
 * changes before the previous request completes.
 */
export function useSearchProducts(
  debouncedQuery: string,
  options?: UseSearchProductsOptions,
): UseSearchProductsReturn {
  const sanitized = sanitizeSearchQuery(debouncedQuery);
  const limit = options?.limit ?? 6;
  const isEnabled = options?.enabled ?? isValidSearchQuery(sanitized);

  const query = useQuery({
    queryKey: searchKeys.products(sanitized, limit),
    enabled: isEnabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on circuit-open or abort
      if (error instanceof SearchApiError) {
        if (!error.retryable) return false;
      }
      return failureCount < 2;
    },
    retryDelay: 500,
    queryFn: async ({ signal }) => {
      return searchService.searchProducts({
        query: sanitized,
        limit,
        signal,
      });
    },
  });

  return {
    results: query.data?.products ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading && isEnabled,
    isError: query.isError,
    error: query.error,
  };
}

// ── useTrendingSearches ─────────────────────────────────────────────────────

/** Hardcoded fallback in case the API is unavailable. */
const TRENDING_FALLBACK: readonly string[] = [
  "Summer Collection",
  "Panjabi",
  "Fragrance",
  "Thobe",
  "Abaya",
  "Premium Shoes",
];

export interface UseTrendingSearchesReturn {
  trending: SearchSuggestion[];
  trendingNames: readonly string[];
  isLoading: boolean;
}

/**
 * Fetch trending/featured products to display as suggestions when the
 * search input is empty. Falls back to hardcoded names on error.
 */
export function useTrendingSearches(
  limit?: number,
): UseTrendingSearchesReturn {
  const query = useQuery({
    queryKey: searchKeys.trending(limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    queryFn: async ({ signal }) => {
      return searchService.getTrending({ limit, signal });
    },
  });

  const trending = query.data?.products ?? [];
  const trendingNames: readonly string[] =
    trending.length > 0
      ? trending.map((p) => p.name)
      : TRENDING_FALLBACK;

  return {
    trending,
    trendingNames,
    isLoading: query.isLoading,
  };
}

// ── useRecentSearches ───────────────────────────────────────────────────────

const RECENT_KEY = "ls_recent_searches";
const MAX_RECENT = 5;
const MAX_RECENT_ITEM_LENGTH = 100;

/**
 * Read recent searches from localStorage with full error handling.
 * Returns an empty array on SSR or storage access errors.
 * Validates and deduplicates entries on read.
 */
function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    const results: string[] = [];

    for (const value of parsed) {
      if (typeof value !== "string") continue;

      const sanitized = sanitizeSearchQuery(value);
      if (!sanitized) continue;
      if (sanitized.length > MAX_RECENT_ITEM_LENGTH) continue;

      // Deduplicate on read (case-insensitive)
      const normalizedKey = sanitized.toLowerCase();
      if (seen.has(normalizedKey)) continue;
      seen.add(normalizedKey);

      results.push(sanitized);
      if (results.length >= MAX_RECENT) break;
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Write a new search query to the front of the recent searches list.
 * Deduplicates case-insensitively and enforces max length.
 */
function writeRecentSearch(query: string): string[] {
  if (typeof window === "undefined") return [];

  const sanitized = sanitizeSearchQuery(query);
  if (!sanitized || sanitized.length > MAX_RECENT_ITEM_LENGTH) {
    return readRecentSearches();
  }

  try {
    const prev = readRecentSearches().filter(
      (q) => q.toLowerCase() !== sanitized.toLowerCase(),
    );
    const next = [sanitized, ...prev].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    return next;
  } catch {
    // Ignore storage quota / private-mode errors.
    return readRecentSearches();
  }
}

/**
 * Remove all recent searches from localStorage.
 */
function clearRecentSearchStorage(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // Ignore storage access errors.
  }
}

export interface UseRecentSearchesReturn {
  recent: string[];
  saveRecent: (query: string) => void;
  clearRecent: () => void;
}

/**
 * Manage recent search history via localStorage with React state sync.
 * Hydrates on mount (client-only) and exposes save/clear callbacks.
 */
export function useRecentSearches(): UseRecentSearchesReturn {
  const [recent, setRecent] = useState<string[]>([]);

  // Hydrate on mount (client-only).
  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

  const saveRecent = useCallback((query: string) => {
    const next = writeRecentSearch(query);
    setRecent(next);
  }, []);

  const clearRecent = useCallback(() => {
    clearRecentSearchStorage();
    setRecent([]);
  }, []);

  return { recent, saveRecent, clearRecent };
}

// ── useSearchState ──────────────────────────────────────────────────────────

/**
 * Configuration options for the shared search state hook.
 */
export interface UseSearchStateOptions {
  /** Debounce delay in ms (default: 300). */
  debounceMs?: number;
  /** Maximum results for suggestions (default: 6). */
  suggestionLimit?: number;
}

/**
 * The complete state and handlers returned by `useSearchState`.
 * Consumed by both SearchOverlay and HeaderSearchBar to eliminate
 * duplicated query/debounce/highlight logic.
 */
export interface UseSearchStateReturn {
  /** Current raw query string (un-debounced). */
  query: string;
  /** Debounced and sanitized query string. */
  debouncedQuery: string;
  /** Currently highlighted result index (-1 = none). */
  highlightIndex: number;

  /** Live search results for the debounced query. */
  results: SearchSuggestion[];
  /** Whether results are currently loading. */
  isLoading: boolean;
  /** Whether the search request errored. */
  isError: boolean;
  /** The error object if isError is true. */
  error: Error | null;
  /** Whether to show the fetching spinner. */
  isFetching: boolean;

  /** Trending product names (fallback to hardcoded). */
  trendingNames: readonly string[];
  /** Recent search strings from localStorage. */
  recent: string[];

  /** Update the raw query (sanitizes input). */
  handleQueryChange: (value: string) => void;
  /** Clear query and reset state. */
  handleClear: () => void;
  /** Save a term to recent searches. */
  saveRecent: (query: string) => void;
  /** Clear all recent searches. */
  clearRecent: () => void;
  /** Set the highlight index directly. */
  setHighlightIndex: React.Dispatch<React.SetStateAction<number>>;

  /** Ref for the search input element. */
  inputRef: React.RefObject<HTMLInputElement | null>;

  /** Computed: whether we have results to show. */
  showResults: boolean;
  /** Computed: whether to show "no results" state. */
  showEmpty: boolean;
}

/**
 * Shared search state hook — DRY extraction of the state management logic
 * that was duplicated across SearchOverlay and HeaderSearchBar.
 *
 * Manages: query input, debouncing, sanitization, search API calls,
 * trending/recent data, and keyboard highlight index.
 */
export function useSearchState(
  options?: UseSearchStateOptions,
): UseSearchStateReturn {
  const debounceMs = options?.debounceMs ?? 300;
  const suggestionLimit = options?.suggestionLimit ?? 6;

  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Search hooks ──
  const {
    results,
    isLoading,
    isError,
    error,
  } = useSearchProducts(debouncedQuery, { limit: suggestionLimit });

  const { trendingNames } = useTrendingSearches();
  const { recent, saveRecent, clearRecent } = useRecentSearches();

  // ── Debounce ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // ── Handlers ──
  const handleQueryChange = useCallback((value: string) => {
    setQuery(sanitizeSearchQuery(value));
    setHighlightIndex(-1);
  }, []);

  const handleClear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setHighlightIndex(-1);
    inputRef.current?.focus();
  }, []);

  // ── Computed flags ──
  const showResults =
    debouncedQuery.length >= 2 && results.length > 0;
  const showEmpty =
    debouncedQuery.length >= 2 && !isLoading && results.length === 0;
  const isFetching = isLoading;

  return {
    query,
    debouncedQuery,
    highlightIndex,
    results,
    isLoading,
    isError,
    error,
    isFetching,
    trendingNames,
    recent,
    handleQueryChange,
    handleClear,
    saveRecent,
    clearRecent,
    setHighlightIndex,
    inputRef,
    showResults,
    showEmpty,
  };
}

// Re-export sanitizer utilities so search components import from one place.
export { sanitizeSearchQuery, isValidSearchQuery, MAX_SEARCH_QUERY_LENGTH };
