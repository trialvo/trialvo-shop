// src/hooks/useReviews.ts — V2-050
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminListReviews,
  adminGetReview,
  adminReplyReview,
  adminTogglePin,
  adminToggleHide,
  adminDeleteReview,
  adminProductReviewSummary,
  type GetReviewsParams,
} from "@/api/reviews.api";

// ─── Query keys ───────────────────────────────────────────────────────────── //

export const reviewKeys = {
  all:     ["reviews"] as const,
  list:    (p: GetReviewsParams) => ["reviews", "list", p] as const,
  detail:  (id: number) => ["reviews", "detail", id] as const,
  summary: (productId: number) => ["reviews", "summary", productId] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────── //

export function useAdminReviews(params: GetReviewsParams) {
  return useQuery({
    queryKey: reviewKeys.list(params),
    queryFn:  () => adminListReviews(params),
    staleTime: 15_000,
  });
}

export function useAdminReview(id: number | null) {
  return useQuery({
    queryKey: id ? reviewKeys.detail(id) : ["reviews", "detail", null],
    queryFn:  () => adminGetReview(id!),
    enabled:  id !== null,
  });
}

export function useAdminReviewSummary(productId: number | null) {
  return useQuery({
    queryKey: productId ? reviewKeys.summary(productId) : ["reviews", "summary", null],
    queryFn:  () => adminProductReviewSummary(productId!),
    enabled:  productId !== null,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────── //

export function useAdminReplyReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply_text }: { id: number; reply_text: string }) =>
      adminReplyReview(id, { reply_text }),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: reviewKeys.detail(id) });
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

export function useAdminTogglePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminTogglePin,
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: reviewKeys.detail(id) });
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

export function useAdminToggleHide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminToggleHide,
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: reviewKeys.detail(id) });
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}

export function useAdminDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminDeleteReview,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
