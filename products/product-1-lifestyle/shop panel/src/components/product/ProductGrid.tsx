"use client";

import { AnimatePresence } from "framer-motion";
import { PackageSearch, X } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types";
import { useEffect, useRef } from "react";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  gridCols: 2 | 3;
  wishlistedIds: Set<number>;
  cartProductIds?: Set<number>;
  onToggleWishlist: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onClearFilters: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
}

export function ProductGrid({
  products,
  isLoading,
  gridCols,
  wishlistedIds,
  cartProductIds,
  onToggleWishlist,
  onQuickView,
  onAddToCart,
  onClearFilters,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
}: ProductGridProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const gridClass =
    gridCols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-2 lg:grid-cols-3";

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore || isFetchingMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, onLoadMore]);

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className={`grid gap-4 lg:gap-5 ${gridClass}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-secondary rounded-2xl mb-3" />
            <div className="h-2.5 bg-secondary rounded w-1/3 mb-2" />
            <div className="h-3.5 bg-secondary rounded w-3/4 mb-2" />
            <div className="h-3 bg-secondary rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  /* ── Empty state ── */
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-5">
          <PackageSearch size={28} className="text-muted-foreground/50" />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground mb-2">
          No products found
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Try adjusting or clearing your filters to discover more products.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-accent/30 text-accent hover:bg-accent/8 text-[12px] font-semibold tracking-wide transition-all cursor-pointer"
        >
          <X size={12} /> Clear all filters
        </button>
      </div>
    );
  }

  /* ── Grid ── */
  return (
    <>
      <div className={`grid gap-4 lg:gap-5 ${gridClass}`}>
        <AnimatePresence mode="popLayout">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistedIds.has(product.id)}
              isInCart={cartProductIds?.has(product.id)}
              onToggleWishlist={() => onToggleWishlist(product)}
              onQuickView={() => onQuickView(product)}
              onAddToCart={() => onAddToCart(product)}
            />
          ))}
        </AnimatePresence>
      </div>

      <div ref={loadMoreRef} className="h-1" />

      {isFetchingMore && (
        <div className={`grid gap-4 lg:gap-5 ${gridClass} mt-4`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-secondary rounded-2xl mb-3" />
              <div className="h-2.5 bg-secondary rounded w-1/3 mb-2" />
              <div className="h-3.5 bg-secondary rounded w-3/4 mb-2" />
              <div className="h-3 bg-secondary rounded w-1/2" />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
