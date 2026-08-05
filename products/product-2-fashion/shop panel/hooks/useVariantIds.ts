"use client";

import { useDebounce } from "@/hooks/useDebounce";
import { useVariant } from "@/hooks/useVariant";
import React from "react";

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

function toId(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return 0;
  const i = Math.trunc(n);
  return i > 0 ? i : 0;
}

export function useVariantIds(
  sizes: ReadonlySet<string>, 
  debounceMs: number = 1000
): string {
  const { variants = [] } = useVariant({ status: true });
  const [variantIds, setVariantIds] = React.useState<string>("");
  
  const debouncedSizes = useDebounce(sizes, debounceMs);
  
  React.useEffect(() => {
    if (!debouncedSizes?.size) {
      setVariantIds("");
      return;
    }

    if (!variants.length) {
      setVariantIds("");
      return;
    }

    const selectedVariantIds = Array.from(debouncedSizes)
      .map((sizeName) => {
        const found = variants.find((v) => norm(v?.name) === norm(sizeName));
        return toId(found?.id);
      })
      .filter((id) => id > 0);

    setVariantIds(selectedVariantIds.join(","));
  }, [debouncedSizes, variants]);

  return variantIds;
}