"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { useFavorite } from "@/hooks/useFavorite";
import type { ProductDetail } from "@/lib/api/product/service";

type FavoriteClickInput = Pick<ProductDetail, "id" | "is_favourite">;

export const useHandleFavoriteClick = (): ((p: FavoriteClickInput) => void) => {
  const router = useRouter();
  const { addFavorite, toggleFavorite, isAuthenticated } = useFavorite();

  return React.useCallback(
    (p: FavoriteClickInput) => {
      if (!isAuthenticated) {
        router.push("/sign-in/");
        return;
      }

      const productId = Number(p.id);
      if (!Number.isFinite(productId) || productId <= 0) return;

      if (p.is_favourite === true) {
        toggleFavorite.mutate(productId);
        return;
      }

      addFavorite.mutate(productId);
    },
    [addFavorite, isAuthenticated, router, toggleFavorite],
  );
};
