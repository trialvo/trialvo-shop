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
  // Clear immediately so "Clear all filters" does not wait on debounce
  const effectiveSizes = sizes.size === 0 ? sizes : debouncedSizes;

  React.useEffect(() => {
    if (!effectiveSizes?.size) {
      setVariantIds("");
      return;
    }

    if (!variants.length) {
      setVariantIds("");
      return;
    }

    const selectedVariantIds = Array.from(effectiveSizes)
      .map((sizeName) => {
        const found = variants.find((v) => norm(v?.name) === norm(sizeName));
        return toId(found?.id);
      })
      .filter((id) => id > 0);

    setVariantIds(selectedVariantIds.join(","));
  }, [effectiveSizes, variants]);

  return variantIds;
}