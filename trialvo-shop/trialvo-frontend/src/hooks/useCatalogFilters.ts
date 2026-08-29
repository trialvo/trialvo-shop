"use client";

import { useCallback } from "react";
import { useQueryString } from "./useQueryString";

/**
 * Catalog filter state, held in the URL so a filtered view stays shareable.
 * Shared by the search bar and the product grid, which sit behind separate
 * Suspense boundaries and therefore cannot pass state between them.
 */
export function useCatalogFilters() {
  const { searchParams, setSearchParams } = useQueryString();

  const selectedCategory = searchParams.get("category") || "";
  const query = (searchParams.get("q") || "").trim();

  const patch = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutate(next);
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const selectCategory = useCallback(
    (slug: string) => {
      patch((next) => {
        if (!slug || slug === selectedCategory) next.delete("category");
        else next.set("category", slug);
      });
    },
    [patch, selectedCategory],
  );

  const setQuery = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      patch((next) => {
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
      });
    },
    [patch],
  );

  const clearSearch = useCallback(() => setQuery(""), [setQuery]);

  const clearFilters = useCallback(
    () => setSearchParams({}),
    [setSearchParams],
  );

  return {
    selectedCategory,
    query,
    selectCategory,
    setQuery,
    clearSearch,
    clearFilters,
  };
}
