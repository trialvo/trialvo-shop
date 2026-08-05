// lib/api/review/service.ts — V2-050
import { api } from "../client";

// ─── Types ────────────────────────────────────────────────────────────────── //

export type ReviewImage = {
  id: number;
  image_path: string;
  serial: number;
};

export type ReviewReply = {
  id: number;
  reply_text: string;
  admin_name: string;
  created_at: string;
};

export type Review = {
  id: number;
  rating: number | null;
  review_text: string | null;
  is_pinned: boolean;
  mentions_seller: boolean;
  is_verified_buyer: boolean;
  created_at: string;
  updated_at: string;
  user_id: number;
  user_name: string;
  user_avatar: string | null;
  purchased_product_name: string | null;
  purchased_color: string | null;
  purchased_variant: string | null;
  images: ReviewImage[];
  replies: ReviewReply[];
};

export type StarBreakdown = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export type ProductReviewsResponse = {
  success: boolean;
  product_id: number;
  avg_rating: number;
  total_reviews: number;
  star_breakdown: StarBreakdown;
  total: number;
  limit: number;
  offset: number;
  reviews: Review[];
};

export type EligibleItem = {
  order_item_id: number;
  order_id: number;
  delivered_at: string;
  product_name: string;
  color_name: string | null;
  variant_name: string | null;
  can_review: boolean;
  existing_review_id: number | null;
};

export type ReviewEligibilityResponse = {
  success: boolean;
  eligible_items: EligibleItem[];
};

export type SubmitReviewPayload = {
  product_id: number;
  order_item_id?: number;
  rating?: number;
  review_text?: string;
  images?: File[];
};

export type SubmitReviewResponse = {
  success: boolean;
  message: string;
  review_id: number;
};

export type EditReviewPayload = {
  rating?: number;
  review_text?: string;
};

export type EditReviewResponse = {
  success: boolean;
  message: string;
};

export type DeleteReviewResponse = {
  success: boolean;
  message: string;
};

export type MyReview = {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  rating: number;
  review_text: string | null;
  is_pinned: boolean;
  is_hidden: boolean;
  reply_count: number;
  created_at: string;
};

export type MyReviewsResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  reviews: MyReview[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────── //

function getServerErrorMessage(err: unknown, fallback: string): string {
  const e = err as {
    response?: { data?: { error?: string; message?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.error ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
}

// ─── Service ──────────────────────────────────────────────────────────────── //

class ReviewService {
  async getProductReviews(
    productId: number,
    params?: { rating?: number; limit?: number; offset?: number; sort_by?: string; sort_order?: string }
  ): Promise<ProductReviewsResponse> {
    try {
      const res = await api.get<ProductReviewsResponse>(
        `/user/product/${productId}/reviews`,
        { params }
      );
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to load reviews"));
    }
  }

  async getReviewEligibility(productId: number): Promise<ReviewEligibilityResponse> {
    try {
      const res = await api.get<ReviewEligibilityResponse>(
        `/user/product/${productId}/review-eligibility`
      );
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to check review eligibility"));
    }
  }

  async submitReview(payload: SubmitReviewPayload): Promise<SubmitReviewResponse> {
    try {
      const fd = new FormData();
      fd.append("product_id", String(payload.product_id));
      if (payload.order_item_id) fd.append("order_item_id", String(payload.order_item_id));
      if (payload.rating) fd.append("rating", String(payload.rating));
      if (payload.review_text) fd.append("review_text", payload.review_text);
      if (payload.images) {
        payload.images.forEach((file) => fd.append("review_images", file));
      }

      const res = await api.post<SubmitReviewResponse>("/user/review", fd, {
        headers: { "Content-Type": undefined },
      });
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to submit review"));
    }
  }

  async editReview(reviewId: number, payload: EditReviewPayload): Promise<EditReviewResponse> {
    try {
      const res = await api.put<EditReviewResponse>(`/user/review/${reviewId}`, payload);
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to edit review"));
    }
  }

  async deleteReview(reviewId: number): Promise<DeleteReviewResponse> {
    try {
      const res = await api.delete<DeleteReviewResponse>(`/user/review/${reviewId}`);
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to delete review"));
    }
  }

  async getMyReviews(
    params?: { limit?: number; offset?: number }
  ): Promise<MyReviewsResponse> {
    try {
      const res = await api.get<MyReviewsResponse>("/user/my-reviews", { params });
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to load your reviews"));
    }
  }
}

export const reviewService = new ReviewService();
