"use client";

import type { ReactElement } from "react";
import { AppButton } from "@/components/shared/AppButton";
import { WishlistEmpty } from "@/components/account/wishlist/WishlistEmpty";
import { WishlistGrid } from "@/components/account/wishlist/WishlistGrid";
import { WishlistSkeleton } from "@/components/account/wishlist/WishlistSkeleton";
import { useWishlistProducts } from "@/hooks/useWishlistProducts";

/**
 * Account → Wishlist tab.
 * Skeleton / empty / error + grid with Remove & Add to cart.
 */
export function WishlistTab(): ReactElement {
  const { products, count, isLoading, error, refetch } = useWishlistProducts({
    limit: 50,
  });

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-heading text-lg font-bold">My Wishlist</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {isLoading
              ? "Loading your saved products…"
              : count === 0
                ? "No saved products yet"
                : `${count} saved product${count === 1 ? "" : "s"}`}
          </p>
        </div>
      </header>

      {error ? (
        <div
          className="bg-card rounded-sm border border-border px-5 py-10 text-center space-y-3"
          role="alert"
        >
          <p className="text-sm text-destructive">
            Failed to load wishlist: {error.message}
          </p>
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            Try again
          </AppButton>
        </div>
      ) : isLoading ? (
        <WishlistSkeleton />
      ) : count === 0 ? (
        <WishlistEmpty />
      ) : (
        <WishlistGrid products={products} />
      )}
    </div>
  );
}

export default WishlistTab;
