"use client";

import { useMemo } from "react";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { toUIProduct } from "@/lib/adapters/product";
import type { Product } from "@/data/products";

type UseWishlistProductsOptions = {
  /** Max products to request from the API */
  limit?: number;
};

/**
 * Resolves wishlist product cards:
 * - Authenticated → server filter `is_favourite=true`
 * - Guest → local IDs matched against a product list fetch
 */
export function useWishlistProducts(options?: UseWishlistProductsOptions) {
  const limit = options?.limit ?? 50;
  const { wishlist, isReady } = useWishlist();
  const { isAuthenticated } = useAuth();

  const authQuery = useProducts(
    { is_favourite: true, limit, status: true },
    { enabled: isReady && isAuthenticated },
  );

  const guestQuery = useProducts(
    { limit: Math.min(Math.max(limit, wishlist.length), 50), status: true },
    { enabled: isReady && !isAuthenticated && wishlist.length > 0 },
  );

  const products: Product[] = useMemo(() => {
    if (!isReady) return [];

    if (isAuthenticated) {
      return (authQuery.products ?? []).map((p) => toUIProduct(p));
    }

    if (wishlist.length === 0) return [];

    const idSet = new Set(wishlist);
    return (guestQuery.products ?? [])
      .map((p) => toUIProduct(p))
      .filter((p) => idSet.has(p.id));
  }, [
    isReady,
    isAuthenticated,
    authQuery.products,
    guestQuery.products,
    wishlist,
  ]);

  const isLoading =
    !isReady ||
    (isAuthenticated ? authQuery.productsLoading : guestQuery.productsLoading);

  const error = isAuthenticated
    ? authQuery.productsError
    : guestQuery.productsError;

  return {
    products,
    count: products.length,
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    isAuthenticated,
    wishlistIds: wishlist,
    refetch: isAuthenticated
      ? authQuery.productsRefetch
      : guestQuery.productsRefetch,
  };
}
