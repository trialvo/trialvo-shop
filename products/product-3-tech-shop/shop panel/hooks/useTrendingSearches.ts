"use client";

import { useMainCategories } from "@/hooks/useMainCategories";
import { useProducts } from "@/hooks/useProducts";
import { sanitizeSearchQuery } from "@/lib/security/search";
import { useMemo } from "react";

/**
 * Builds trending search chips from live catalog signals:
 * featured product keywords + featured category names.
 * No dedicated trending API exists — this keeps results data-driven.
 */
export const useTrendingSearches = (limit = 8) => {
  const { products, productsLoading } = useProducts({
    featured: true,
    limit: 12,
    status: true,
  });
  const { mainCategories, mainCategoriesLoading } = useMainCategories();

  const trending = useMemo(() => {
    const terms: string[] = [];
    const seen = new Set<string>();

    const push = (raw: string) => {
      const cleaned = sanitizeSearchQuery(raw);
      if (!cleaned || cleaned.length < 2) return;
      const key = cleaned.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      terms.push(cleaned);
    };

    for (const main of mainCategories) {
      if (!main.status) continue;
      push(main.name);
      for (const sub of main.sub_categories ?? []) {
        if (sub.status && sub.featured) push(sub.name);
      }
    }

    for (const product of products) {
      // First 2 meaningful words from product name as a search chip
      const words = product.name
        .replace(/[–—|-].*$/, "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .join(" ");
      push(words);
      if (terms.length >= limit) break;
    }

    return terms.slice(0, limit);
  }, [mainCategories, products, limit]);

  return {
    trending,
    trendingLoading: productsLoading || mainCategoriesLoading,
  };
};
