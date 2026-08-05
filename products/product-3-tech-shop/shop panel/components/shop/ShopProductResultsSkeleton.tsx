"use client";

import type { ReactElement } from "react";
import { ProductCardsSkeleton } from "@/components/product/ProductCardsSkeleton";
import { ProductListCardSkeleton } from "@/components/product/ProductListCardSkeleton";

export type ShopProductResultsSkeletonProps = Readonly<{
  viewMode?: "grid" | "list";
  count?: number;
}>;

/**
 * Initial loading placeholders for shop catalog results.
 * Reuses shared product card / list skeletons.
 */
export function ShopProductResultsSkeleton({
  viewMode = "grid",
  count = 8,
}: ShopProductResultsSkeletonProps): ReactElement {
  if (viewMode === "list") {
    const listCount = Math.min(Math.max(1, count), 6);
    return (
      <div
        className="flex flex-col gap-3"
        aria-busy
        aria-label="Loading products"
      >
        {Array.from({ length: listCount }, (_, index) => (
          <ProductListCardSkeleton key={`shop-list-skeleton-${index}`} />
        ))}
      </div>
    );
  }

  return (
    <ProductCardsSkeleton
      count={count}
      className="gap-3 sm:gap-4 xl:grid-cols-3 md:grid-cols-2"
      label="Loading products"
    />
  );
}
