"use client";

import { useDebounce } from "@/hooks/useDebounce";
import {
  DEFAULT_CATALOG_PRICE,
  isDefaultCatalogPrice,
} from "@/redux/slices/catalogFilterSlice";
import React from "react";

export type PriceFilterValue = {
  min?: number;
  max?: number;
};

export function useDebouncedPrice(
  price: PriceFilterValue,
  debounceMs: number = 1000
): PriceFilterValue {
  const normalized = React.useMemo(
    () => ({
      min: typeof price.min === "number" ? price.min : DEFAULT_CATALOG_PRICE.min,
      max: typeof price.max === "number" ? price.max : DEFAULT_CATALOG_PRICE.max,
    }),
    [price.min, price.max],
  );

  const debouncedMin = useDebounce(normalized.min, debounceMs);
  const debouncedMax = useDebounce(normalized.max, debounceMs);

  // Reset immediately when cleared back to defaults
  if (isDefaultCatalogPrice(normalized)) {
    return normalized;
  }

  return {
    min: debouncedMin,
    max: debouncedMax,
  };
}
