"use client";

import { useProducts } from "@/hooks/useProducts";
import { toUIProduct } from "@/lib/adapters/product";
import { sanitizeSearchQuery } from "@/lib/security/search";
import type { Product } from "@/data/products";
import { useDeferredValue, useMemo } from "react";

type UseProductSearchOptions = {
  limit?: number;
  /** Minimum characters before hitting the API */
  minLength?: number;
  enabled?: boolean;
};

export const useProductSearch = (
  rawQuery: string,
  options?: UseProductSearchOptions,
) => {
  const limit = options?.limit ?? 6;
  const minLength = options?.minLength ?? 2;
  const enabledOption = options?.enabled ?? true;

  const query = sanitizeSearchQuery(rawQuery);
  const deferredQuery = useDeferredValue(query);
  const canSearch = enabledOption && deferredQuery.length >= minLength;

  const { products, productsLoading, productsError } = useProducts(
    { search: deferredQuery, limit, status: true },
    { enabled: canSearch },
  );

  const suggestions: Product[] = useMemo(() => {
    if (!canSearch) return [];
    return products.map((p) => toUIProduct(p)).slice(0, limit);
  }, [canSearch, products, limit]);

  return {
    query,
    deferredQuery,
    suggestions,
    isSearching: canSearch && productsLoading,
    searchError: productsError,
    canSearch,
  };
};
