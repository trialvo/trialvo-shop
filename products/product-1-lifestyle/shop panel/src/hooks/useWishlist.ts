"use client";

import { favoriteService } from "@/lib/api/favorite/service";
import type { ProductListItem } from "@/lib/api/product/service";
import {
  normalizeWishlistProducts,
  type WishlistProduct,
} from "@/lib/wishlist/normalizers";
import { useAppDispatch } from "@/store";
import {
  removeFromWishlist,
  setWishlistIds,
} from "@/store/slices/wishlistSlice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

type WishlistUserKey = number | string | null | undefined;

interface WishlistQueryOptions {
  enabled: boolean;
  userKey?: WishlistUserKey;
}

export const wishlistKeys = {
  all: ["wishlist"] as const,
  products: (userKey?: WishlistUserKey) =>
    [...wishlistKeys.all, "products", userKey ?? "anonymous"] as const,
};

const getWishlistProducts = async (): Promise<ProductListItem[]> =>
  favoriteService.getAllFavoriteProducts({
    sort_by: "created_at",
    sort_order: "DESC",
  });

const useWishlistProductsQuery = ({ enabled, userKey }: WishlistQueryOptions) =>
  useQuery({
    queryKey: wishlistKeys.products(userKey),
    enabled,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    queryFn: getWishlistProducts,
  });

export function useWishlistSync(options: WishlistQueryOptions) {
  const dispatch = useAppDispatch();
  const wishlistQuery = useWishlistProductsQuery(options);
  const rawProducts = useMemo(
    () => wishlistQuery.data ?? [],
    [wishlistQuery.data],
  );

  useEffect(() => {
    if (!wishlistQuery.isSuccess) return;
    const favoriteIds = rawProducts
      .filter((product) => product.is_favourite === true)
      .map((product) => product.id);
    dispatch(setWishlistIds(favoriteIds));
  }, [dispatch, rawProducts, wishlistQuery.isSuccess]);

  return wishlistQuery;
}

export function useWishlist(options: WishlistQueryOptions) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const wishlistQuery = useWishlistProductsQuery(options);
  const wishlistQueryKey = wishlistKeys.products(options.userKey);

  const products = useMemo<WishlistProduct[]>(
    () => normalizeWishlistProducts(wishlistQuery.data ?? []),
    [wishlistQuery.data],
  );

  useEffect(() => {
    if (!wishlistQuery.isSuccess) return;
    dispatch(setWishlistIds(products.map((product) => product.id)));
  }, [dispatch, products, wishlistQuery.isSuccess]);

  const removeFavoriteMutation = useMutation({
    mutationFn: async (productId: number) => {
      const response = await favoriteService.toggleFavorite(productId);
      if (response.error || response.success === false) {
        throw new Error(response.error || response.message || "Failed to remove favorite");
      }
      return response;
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: wishlistQueryKey });
      const previousProducts =
        queryClient.getQueryData<ProductListItem[]>(wishlistQueryKey) ?? [];
      const nextProducts = previousProducts.filter((product) => product.id !== productId);

      queryClient.setQueryData<ProductListItem[]>(wishlistQueryKey, nextProducts);
      dispatch(removeFromWishlist(productId));

      return { previousProducts };
    },
    onError: (_error, _productId, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData<ProductListItem[]>(
          wishlistQueryKey,
          context.previousProducts,
        );
        const favoriteIds = context.previousProducts
          .filter((product) => product.is_favourite === true)
          .map((product) => product.id);
        dispatch(setWishlistIds(favoriteIds));
      }
    },
    onSuccess: (response, productId) => {
      const isStillFavorite = response.data?.is_favorite === true;
      if (isStillFavorite) {
        void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
        return;
      }

      dispatch(removeFromWishlist(productId));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });

  return {
    products,
    isLoading: wishlistQuery.isLoading,
    isError: wishlistQuery.isError,
    error: wishlistQuery.error,
    refetch: wishlistQuery.refetch,
    removeFavorite: removeFavoriteMutation.mutateAsync,
    isRemoving: removeFavoriteMutation.isPending,
  };
}
