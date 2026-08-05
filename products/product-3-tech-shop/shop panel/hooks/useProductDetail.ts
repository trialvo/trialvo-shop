"use client";

import { useQuery } from "@tanstack/react-query";
import {
  productService,
  type ProductDetail,
} from "@/lib/api/product/service";
import { reviewService } from "@/lib/api/review/service";
import { sanitizeProductSlug } from "@/lib/security/slug";
import { productKeys } from "@/hooks/useProducts";

export const productDetailKeys = {
  bySlug: (slug: string) => [...productKeys.all, "detail-by-slug", slug] as const,
  reviews: (productId: number) =>
    [...productKeys.all, "reviews", productId] as const,
};

type UseProductDetailOptions = {
  /** When false, skip the detail request (e.g. Quick View closed). */
  enabled?: boolean;
  /** Quick View does not need reviews — keeps the dialog light. */
  includeReviews?: boolean;
};

export function useProductDetail(
  rawSlug: string,
  options: UseProductDetailOptions = {},
) {
  const { enabled = true, includeReviews = true } = options;
  const slug = sanitizeProductSlug(rawSlug);

  const detailQuery = useQuery({
    queryKey: productDetailKeys.bySlug(slug),
    enabled: enabled && slug.length > 0,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (count, err) => {
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("not found")) return false;
      return count < 2;
    },
    queryFn: async (): Promise<ProductDetail> => {
      return productService.getProductBySlug(slug);
    },
  });

  const productId = detailQuery.data?.id ?? 0;

  const reviewsQuery = useQuery({
    queryKey: productDetailKeys.reviews(productId),
    enabled: includeReviews && productId > 0,
    staleTime: 60 * 1000,
    queryFn: async () => {
      try {
        return await reviewService.getProductReviews(productId, {
          limit: 10,
          offset: 0,
        });
      } catch {
        // Reviews endpoint may be unavailable — keep PDP usable
        return null;
      }
    },
  });

  const notFoundError =
    detailQuery.isError &&
    (detailQuery.error instanceof Error
      ? detailQuery.error.message.toLowerCase().includes("not found")
      : false);

  const isNotFound =
    slug.length === 0 ||
    (enabled &&
      !detailQuery.isLoading &&
      !detailQuery.isFetching &&
      (notFoundError || (!detailQuery.isError && !detailQuery.data)));

  return {
    slug,
    product: detailQuery.data ?? null,
    isLoading: detailQuery.isLoading || (detailQuery.isFetching && !detailQuery.data),
    isError: detailQuery.isError && !notFoundError,
    error: detailQuery.error,
    isNotFound,
    refetch: detailQuery.refetch,
    reviews: reviewsQuery.data?.reviews ?? [],
    reviewSummary: {
      count:
        reviewsQuery.data?.total_reviews ??
        reviewsQuery.data?.total ??
        reviewsQuery.data?.reviews?.length ??
        0,
      average: reviewsQuery.data?.avg_rating ?? 0,
    },
    reviewsLoading: reviewsQuery.isLoading,
  };
}
