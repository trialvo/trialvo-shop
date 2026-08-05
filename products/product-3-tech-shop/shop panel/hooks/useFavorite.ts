"use client";

import { favoriteService, type FavoriteToggleResponse } from "@/lib/api/favorite/service";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export const useFavorite = () => {
  const { isAuthenticated } = useAuth();

  const toggleMutation = useMutation({
    mutationFn: (productId: number) => favoriteService.toggleFavorite(productId),
  });

  const toggleFavorite = async (productId: number): Promise<FavoriteToggleResponse | null> => {
    if (!isAuthenticated) return null;
    return toggleMutation.mutateAsync(productId);
  };

  return {
    toggleFavorite,
    isToggling: toggleMutation.isPending,
  };
};
