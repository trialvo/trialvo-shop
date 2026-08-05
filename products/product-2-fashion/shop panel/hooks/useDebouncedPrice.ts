"use client";

import { useDebounce } from "@/hooks/useDebounce";
import React from "react";

export type PriceFilterValue = {
  min?: number;
  max?: number;
};

export function useDebouncedPrice(
  price: PriceFilterValue,
  debounceMs: number = 1000
): PriceFilterValue {
  const [debouncedPrice, setDebouncedPrice] = React.useState<PriceFilterValue>(price);
  
  const debouncedMin = useDebounce(price.min, debounceMs);
  const debouncedMax = useDebounce(price.max, debounceMs);
  
  React.useEffect(() => {
    setDebouncedPrice({
      min: debouncedMin,
      max: debouncedMax
    });
  }, [debouncedMin, debouncedMax]);

  return debouncedPrice;
}