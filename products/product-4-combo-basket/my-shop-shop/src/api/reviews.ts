import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  title?: string;
  body?: string;
  comment?: string; // legacy alias
  created_at: string;
  user?: { id: number; name: string; avatar?: string | null };
  product?: { id: number; name: string; slug: string };
}

export interface ReviewListResponse {
  success: boolean;
  reviews: Review[];
  total: number;
}

export interface SubmitReviewPayload {
  product_id: number;
  rating: number;
  title?: string;
  body: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProductReviews(productId: number | null | undefined) {
  return useQuery<ReviewListResponse>({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/${productId}/reviews`);
      return data;
    },
    enabled: Boolean(productId),
  });
}

export function useAllReviews(limit = 20) {
  return useQuery<ReviewListResponse>({
    queryKey: ["reviews", "all", limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/reviews?limit=${limit}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; review: Review },
    Error,
    SubmitReviewPayload
  >({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post(
        `/products/${payload.product_id}/reviews`,
        payload,
      );
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate reviews cache for this product
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.product_id],
      });
    },
  });
}
