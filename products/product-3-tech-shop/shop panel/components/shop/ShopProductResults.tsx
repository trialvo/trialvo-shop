"use client";

import { useEffect, useRef, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { PackageSearch } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton";
import ProductListCard from "@/components/product/ProductListCard";
import { ProductListCardSkeleton } from "@/components/product/ProductListCardSkeleton";
import { ShopProductResultsSkeleton } from "@/components/shop/ShopProductResultsSkeleton";
import { AppButton } from "@/components/shared/AppButton";
import type { Product } from "@/data/products";

export type ShopViewMode = "grid" | "list";

/** Placeholders shown at the end of the grid while the next page loads. */
const FETCH_MORE_SKELETON_COUNT = 6;

type ShopProductResultsProps = Readonly<{
  products: Product[];
  viewMode: ShopViewMode;
  isLoading?: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onResetFilters?: () => void;
}>;

/**
 * Shop catalog results with intersection-observer infinite pagination.
 * Presentational — data/fetch stays in the parent + `useInfiniteProducts`.
 */
export function ShopProductResults({
  products,
  viewMode,
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
  onLoadMore,
  onResetFilters,
}: ShopProductResultsProps): ReactElement {
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    if (!hasMore || isFetchingMore || isLoading) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMore?.();
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isLoading, onLoadMore]);

  if (isLoading) {
    return <ShopProductResultsSkeleton viewMode={viewMode} />;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-secondary/20 px-6 py-16 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-sm bg-secondary text-muted-foreground">
          <PackageSearch className="h-6 w-6" aria-hidden />
        </span>
        <p className="font-heading text-base font-semibold text-foreground">
          No products found
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Try resetting filters or browsing the full catalog.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {onResetFilters ? (
            <AppButton variant="outline" size="sm" onClick={onResetFilters}>
              Reset filters
            </AppButton>
          ) : null}
          <AppButton size="sm" onClick={() => router.push("/shop")}>
            Browse all
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {viewMode === "grid" ? (
        <div
          className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3"
          aria-busy={isFetchingMore || undefined}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {isFetchingMore
            ? Array.from({ length: FETCH_MORE_SKELETON_COUNT }, (_, index) => (
                <ProductCardSkeleton
                  key={`shop-fetch-more-card-${index}`}
                />
              ))
            : null}
        </div>
      ) : (
        <div
          className="flex flex-col gap-3"
          aria-busy={isFetchingMore || undefined}
        >
          {products.map((product) => (
            <ProductListCard key={product.id} product={product} />
          ))}
          {isFetchingMore
            ? Array.from(
                { length: Math.min(FETCH_MORE_SKELETON_COUNT, 3) },
                (_, index) => (
                  <ProductListCardSkeleton
                    key={`shop-fetch-more-list-${index}`}
                  />
                ),
              )
            : null}
        </div>
      )}

      <div ref={loadMoreRef} className="h-1" aria-hidden />

      {hasMore && !isFetchingMore ? (
        <div className="flex justify-center pt-1">
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onLoadMore?.()}
          >
            Load more products
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}
