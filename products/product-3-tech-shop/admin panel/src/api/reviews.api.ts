// src/api/reviews.api.ts — V2-050
import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────── //

export type ReviewImage = {
  id: number;
  image_path: string;
  serial: number;
};

export type ReviewReplyItem = {
  id: number;
  reply_text: string;
  admin_name: string;
  created_at: string;
};

export type AdminReviewListItem = {
  id: number;
  product_id: number;
  user_id: number;
  order_item_id: number | null;
  rating: number | null;
  review_text: string | null;
  is_pinned: boolean;
  is_hidden: boolean;
  mentions_seller: boolean;
  is_verified_buyer: boolean;
  reply_count: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  product_name: string;
  product_slug: string;
  product_image: string | null;
};

export type AdminReviewDetail = {
  id: number;
  product_id: number;
  user_id: number;
  order_item_id: number | null;
  rating: number | null;
  review_text: string | null;
  is_pinned: boolean;
  is_hidden: boolean;
  mentions_seller: boolean;
  is_verified_buyer: boolean;
  created_at: string;
  updated_at: string;
  // joined user
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  // joined product
  product_name: string;
  product_slug: string;
  product_image: string | null;
  // order item
  purchased_product_name: string;
  purchased_color: string | null;
  purchased_variant: string | null;
  // children
  images: ReviewImage[];
  replies: ReviewReplyItem[];
};

export type GetReviewsParams = {
  product_id?: number;
  user_id?: number;
  rating?: number;
  is_hidden?: "true" | "false" | "all";
  is_pinned?: "true" | "false" | "all";
  mentions_seller?: "true" | "false" | "all";
  search?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
  offset?: number;
  limit?: number;
};

export type GetReviewsResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  reviews: AdminReviewListItem[];
};

export type ReviewSummaryResponse = {
  success: boolean;
  product_id: number;
  avg_rating: number;
  total_reviews: number;
  visible_reviews: number;
  hidden_reviews: number;
  pinned_reviews: number;
  seller_mentions: number;
  star_breakdown: Record<string, number>;
};

// ─── API Functions ────────────────────────────────────────────────────────── //

export async function adminListReviews(params: GetReviewsParams): Promise<GetReviewsResponse> {
  const cleanParams: Record<string, string | number> = {};
  if (params.product_id) cleanParams.product_id = params.product_id;
  if (params.user_id) cleanParams.user_id = params.user_id;
  if (params.rating) cleanParams.rating = params.rating;
  if (params.is_hidden && params.is_hidden !== "all") cleanParams.is_hidden = params.is_hidden;
  if (params.is_pinned && params.is_pinned !== "all") cleanParams.is_pinned = params.is_pinned;
  if (params.mentions_seller && params.mentions_seller !== "all") cleanParams.mentions_seller = params.mentions_seller;
  if (params.search?.trim()) cleanParams.search = params.search.trim();
  if (params.sort_by) cleanParams.sort_by = params.sort_by;
  if (params.sort_order) cleanParams.sort_order = params.sort_order;
  if (params.offset !== undefined) cleanParams.offset = params.offset;
  if (params.limit !== undefined) cleanParams.limit = params.limit;
  const { data } = await api.get("/admin/reviews", { params: cleanParams });
  return data;
}

export async function adminGetReview(id: number): Promise<{ success: boolean; review: AdminReviewDetail }> {
  const { data } = await api.get(`/admin/reviews/${id}`);
  return data;
}

export async function adminReplyReview(
  id: number,
  body: { reply_text: string }
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post(`/admin/reviews/${id}/reply`, body);
  return data;
}

export async function adminTogglePin(id: number): Promise<{ success: boolean; message: string; is_pinned: boolean }> {
  const { data } = await api.patch(`/admin/reviews/${id}/pin`);
  return data;
}

export async function adminToggleHide(id: number): Promise<{ success: boolean; message: string; is_hidden: boolean }> {
  const { data } = await api.patch(`/admin/reviews/${id}/hide`);
  return data;
}

export async function adminDeleteReview(id: number): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete(`/admin/reviews/${id}`);
  return data;
}

export async function adminProductReviewSummary(productId: number): Promise<ReviewSummaryResponse> {
  const { data } = await api.get(`/admin/reviews/product/${productId}/summary`);
  return data;
}
