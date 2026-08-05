"use client";

import { useColorIds } from "@/hooks/useColorIds";
import { useVariantIds } from "@/hooks/useVariantIds";

export type FilterState = {
  sizes: ReadonlySet<string>;
  colors: ReadonlySet<string>;
};

export function useMultiFilterIds(
  filters: FilterState,
  debounceMs: number = 1000
) {
  const variantIds = useVariantIds(filters.sizes, debounceMs);
  const colorIds = useColorIds(filters.colors, debounceMs);
  
  return { variantIds, colorIds };
}