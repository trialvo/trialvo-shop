"use client";

import {
    favoriteService,
    type FavoriteAddResponse,
    type FavoriteToggleResponse,
} from "@/lib/api/favorite/service";
import AuthCookies from "@/lib/auth/cookies";
import { useAppDispatch } from "@/redux/hooks";
import { setError, setSuccess } from "@/redux/slices/uiSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "./useProduct";

export const favoriteKeys = {
  all: ["favorite"] as const,
  isFavorite: (productId: number) => [...favoriteKeys.all, "isFavorite", productId] as const,
  count: () => [...favoriteKeys.all, "count"] as const,
};

const getErrMsg = (err: unknown, fallback: string) => {
  const e = err as { message?: string; response?: { data?: { message?: string; error?: string } } };
  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

export const useFavorite = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const isAuthenticated = AuthCookies.isAuthenticated();

  const addFavorite = useMutation({
    mutationFn: async (productId: number): Promise<FavoriteAddResponse> => {
      return favoriteService.addFavorite(productId);
    },
    onSuccess: (res, productId) => {
      queryClient.setQueryData(favoriteKeys.isFavorite(productId), true);
      queryClient.invalidateQueries({ queryKey: productKeys.all });

      if (res?.data?.favorites_count != null) {
        queryClient.setQueryData(favoriteKeys.count(), res.data.favorites_count);
      }

      dispatch(setSuccess(res?.message?.trim() || "Added to favorites."));
    },
    onError: (err) => {
      dispatch(setError(getErrMsg(err, "Couldn’t add to favorites. Please try again.")));
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async (productId: number): Promise<FavoriteToggleResponse> => {
      return favoriteService.toggleFavorite(productId);
    },

    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all });

      const prev = queryClient.getQueryData<boolean>(favoriteKeys.isFavorite(productId));
      const next = typeof prev === "boolean" ? !prev : true;

      queryClient.setQueryData(favoriteKeys.isFavorite(productId), next);

      return { productId, prev };
    },

    onError: (err, _productId, ctx) => {
      if (ctx) {
        queryClient.setQueryData(favoriteKeys.isFavorite(ctx.productId), ctx.prev ?? false);
      }
      dispatch(setError(getErrMsg(err, "Couldn’t update favorites. Please try again.")));
    },

    onSuccess: (res, productId) => {
      const payload = res?.data;

      if (payload) {
        queryClient.setQueryData(favoriteKeys.isFavorite(productId), payload.is_favorite);
        queryClient.invalidateQueries({ queryKey: productKeys.all });

        if (payload.favorites_count != null) {
          queryClient.setQueryData(favoriteKeys.count(), payload.favorites_count);
        }

        const msg =
          res?.message?.trim() ||
          (payload.action === "removed" ? "Removed from favorites." : "Added to favorites.");

        dispatch(setSuccess(msg));
      } else {
        dispatch(setSuccess(res?.message?.trim() || "Favorites updated."));
      }
    },
  });

  return {
    isAuthenticated,
    addFavorite,
    toggleFavorite,
  };
};
