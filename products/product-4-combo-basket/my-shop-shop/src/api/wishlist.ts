import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    original_price?: number;
    image: string;
    rating: number;
    review_count: number;
    in_stock: boolean;
    category?: { name: string; slug: string };
  };
}

export interface WishlistResponse {
  success: boolean;
  wishlist: WishlistItem[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useWishlist() {
  return useQuery<WishlistResponse>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data } = await apiClient.get("/wishlist");
      return data;
    },
    enabled:
      typeof window !== "undefined" && !!localStorage.getItem("shop_token"),
    staleTime: 60_000,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: async (productId) => {
      const { data } = await apiClient.post(`/wishlist/${productId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: async (productId) => {
      const { data } = await apiClient.delete(`/wishlist/${productId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });
}
