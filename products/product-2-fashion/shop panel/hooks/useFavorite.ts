"use client";

import {
  favoriteService,
  normalizeFavoritesCount,
  type FavoriteAddResponse,
  type FavoriteToggleResponse,
} from "@/lib/api/favorite/service";
import AuthCookies from "@/lib/auth/cookies";
import { useAppDispatch } from "@/redux/hooks";
import { setError, setSuccess } from "@/redux/slices/uiSlice";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productKeys } from "./useProduct";

export const favoriteKeys = {
  all: ["favorite"] as const,
  list: () => [...favoriteKeys.all, "list"] as const,
  isFavorite: (productId: number) => [...favoriteKeys.all, "isFavorite", productId] as const,
  count: () => [...favoriteKeys.all, "count"] as const,
};

const getErrMsg = (err: unknown, fallback: string) => {
  const e = err as { message?: string; response?: { data?: { message?: string; error?: string } } };
  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

const setFavoritesCount = (
  queryClient: ReturnType<typeof useQueryClient>,
  value: unknown,
) => {
  const next = normalizeFavoritesCount(value);
  if (next == null) return;
  queryClient.setQueryData(favoriteKeys.count(), next);
};

/** Refresh list + count from the same favourite-product source of truth */
const refreshFavoritesCaches = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  void queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
  void queryClient.invalidateQueries({ queryKey: favoriteKeys.count() });
};

export const useFavorite = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const isAuthenticated = AuthCookies.isAuthenticated();

  const favoritesCountQuery = useQuery({
    queryKey: favoriteKeys.count(),
    queryFn: () => favoriteService.getFavoritesCount(),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const addFavorite = useMutation({
    mutationFn: async (productId: number): Promise<FavoriteAddResponse> => {
      return favoriteService.addFavorite(productId);
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.isFavorite(productId) });
      const prevFav = queryClient.getQueryData<boolean>(favoriteKeys.isFavorite(productId));
      const prevCount = queryClient.getQueryData<number>(favoriteKeys.count());

      queryClient.setQueryData(favoriteKeys.isFavorite(productId), true);
      if (typeof prevCount === "number" && prevFav !== true) {
        queryClient.setQueryData(favoriteKeys.count(), prevCount + 1);
      }

      return { productId, prevFav, prevCount };
    },
    onSuccess: (res, productId) => {
      queryClient.setQueryData(favoriteKeys.isFavorite(productId), true);
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      // Prefer API count immediately, then refetch so orphans cannot inflate the header
      setFavoritesCount(queryClient, res?.data?.favorites_count);
      refreshFavoritesCaches(queryClient);
      dispatch(setSuccess(res?.message?.trim() || "Added to favorites."));
    },
    onError: (err, _productId, ctx) => {
      if (ctx) {
        queryClient.setQueryData(favoriteKeys.isFavorite(ctx.productId), ctx.prevFav ?? false);
        if (typeof ctx.prevCount === "number") {
          queryClient.setQueryData(favoriteKeys.count(), ctx.prevCount);
        }
      }
      dispatch(setError(getErrMsg(err, "Couldn’t add to favorites. Please try again.")));
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async (productId: number): Promise<FavoriteToggleResponse> => {
      return favoriteService.toggleFavorite(productId);
    },

    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.isFavorite(productId) });

      const prev = queryClient.getQueryData<boolean>(favoriteKeys.isFavorite(productId));
      const prevCount = queryClient.getQueryData<number>(favoriteKeys.count());
      const next = typeof prev === "boolean" ? !prev : true;

      queryClient.setQueryData(favoriteKeys.isFavorite(productId), next);
      if (typeof prev === "boolean" && typeof prevCount === "number") {
        queryClient.setQueryData(
          favoriteKeys.count(),
          Math.max(0, prevCount + (next ? 1 : -1)),
        );
      }

      return { productId, prev, prevCount };
    },

    onError: (err, _productId, ctx) => {
      if (ctx) {
        queryClient.setQueryData(favoriteKeys.isFavorite(ctx.productId), ctx.prev ?? false);
        if (typeof ctx.prevCount === "number") {
          queryClient.setQueryData(favoriteKeys.count(), ctx.prevCount);
        }
      }
      dispatch(setError(getErrMsg(err, "Couldn’t update favorites. Please try again.")));
    },

    onSuccess: (res, productId) => {
      const payload = res?.data;

      if (payload) {
        queryClient.setQueryData(favoriteKeys.isFavorite(productId), payload.is_favorite);
        queryClient.invalidateQueries({ queryKey: productKeys.all });
        setFavoritesCount(queryClient, payload.favorites_count);
        refreshFavoritesCaches(queryClient);

        const msg =
          res?.message?.trim() ||
          (payload.action === "removed" ? "Removed from favorites." : "Added to favorites.");

        dispatch(setSuccess(msg));
      } else {
        refreshFavoritesCaches(queryClient);
        dispatch(setSuccess(res?.message?.trim() || "Favorites updated."));
      }
    },
  });

  return {
    isAuthenticated,
    addFavorite,
    toggleFavorite,
    favoritesCount: isAuthenticated ? (favoritesCountQuery.data ?? 0) : 0,
    favoritesCountLoading: favoritesCountQuery.isLoading,
    refetchFavoritesCount: favoritesCountQuery.refetch,
  };
};
