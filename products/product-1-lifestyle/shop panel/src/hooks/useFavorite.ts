"use client";

import {
  favoriteService,
  type FavoriteToggleResponse,
} from "@/lib/api/favorite/service";
import { useAuth } from "@/hooks/useAuth";
import { useAppDispatch } from "@/store";
import {
  addToWishlist,
  removeFromWishlist,
} from "@/store/slices/wishlistSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

type ToggleFavoriteInput = {
  productId: number;
  isFavorite?: boolean;
};

type ToggleFavoriteContext = {
  previousFavorite?: boolean;
};

const WISHLIST_QUERY_KEY = ["wishlist"] as const;
const PRODUCT_QUERY_KEY = ["product"] as const;

const assertValidProductId = (productId: number): number => {
  const normalized = Math.trunc(productId);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error("Invalid product");
  }
  return normalized;
};

const getFavoriteErrorMessage = (response: FavoriteToggleResponse): string | null => {
  if (response.error || response.success === false) {
    return response.error || response.message || "Failed to update wishlist";
  }
  return null;
};

export function useFavorite() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const applyFavoriteState = useCallback(
    (productId: number, isFavorite: boolean) => {
      if (isFavorite) {
        dispatch(addToWishlist(productId));
        return;
      }

      dispatch(removeFromWishlist(productId));
    },
    [dispatch],
  );

  const toggleFavoriteMutation = useMutation<
    FavoriteToggleResponse,
    Error,
    ToggleFavoriteInput,
    ToggleFavoriteContext
  >({
    mutationFn: async ({ productId }) => {
      const validProductId = assertValidProductId(productId);
      const response = await favoriteService.toggleFavorite(validProductId);
      const error = getFavoriteErrorMessage(response);
      if (error) throw new Error(error);
      return response;
    },
    onMutate: ({ productId, isFavorite }) => {
      const validProductId = assertValidProductId(productId);
      const nextFavorite = typeof isFavorite === "boolean" ? !isFavorite : true;
      applyFavoriteState(validProductId, nextFavorite);
      return { previousFavorite: isFavorite };
    },
    onError: (_error, { productId }, context) => {
      const validProductId = assertValidProductId(productId);
      if (typeof context?.previousFavorite === "boolean") {
        applyFavoriteState(validProductId, context.previousFavorite);
        return;
      }

      dispatch(removeFromWishlist(validProductId));
    },
    onSuccess: (response, { productId }) => {
      const validProductId = assertValidProductId(productId);
      const confirmedFavorite = response.data?.is_favorite;

      if (typeof confirmedFavorite === "boolean") {
        applyFavoriteState(validProductId, confirmedFavorite);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEY });
    },
  });

  const toggleFavorite = useCallback(
    async (productId: number, isFavorite?: boolean) => {
      if (!isAuthenticated) {
        router.push("/auth");
        throw new Error("Please sign in to use wishlist");
      }

      return toggleFavoriteMutation.mutateAsync({ productId, isFavorite });
    },
    [isAuthenticated, router, toggleFavoriteMutation],
  );

  return {
    isAuthenticated,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    toggleFavorite,
    toggleFavoriteMutation,
  };
}
