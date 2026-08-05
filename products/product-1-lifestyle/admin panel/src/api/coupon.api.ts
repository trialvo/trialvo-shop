// src/api/coupon.api.ts
import { api } from "./client";

/** ---------- Types (API layer) ---------- */
export type ApiCouponScope = "all" | "specified";
export type ApiDiscountType = 0 | 1; // 0 = flat, 1 = percentage

export type ApiCouponListItem = {
  id: number;
  title: string;
  code: string;
  discount: number;
  discount_type: ApiDiscountType;
  min_purchase_amount: number;
  max_discount_amount?: number | null;
  limit_per_user: number;
  product_scope: ApiCouponScope;
  customer_scope: ApiCouponScope;
  start_date: string; // ISO string from backend
  expire_date: string; // ISO string from backend
  status: 0 | 1 | boolean;
  product_count?: number;
  customer_count?: number;
};

export type ApiCouponListResponse = {
  success: boolean;
  total: number;
  data: ApiCouponListItem[];
};

export type ApiCouponSingleResponse = {
  success: boolean;
  data: {
    id: number;
    title: string;
    code: string;
    discount: number;
    discount_type: ApiDiscountType;
    min_purchase_amount: number;
    max_discount_amount?: number | null;
    limit_per_user: number;
    product_scope: ApiCouponScope;
    customer_scope: ApiCouponScope;
    start_date: string;
    expire_date: string;
    status: 0 | 1 | boolean;

    product_variations?: Array<{
      product_variation_id: number;
      sku: string;
      name: string;
    }>;

    customers?: Array<{
      id: number;
      first_name: string;
      last_name: string;
      default_phone: string | null;
    }>;
  };
};

/**
 * POST /coupon returns the created coupon object (NOT wrapped in {success:true})
 * Example:
 * { id: 23, title: "...", ... }
 */
export type ApiCouponCreateResponse = {
  id: number;
  title: string;
  code: string;
  discount: number;
  discount_type: ApiDiscountType;
  min_purchase_amount: number;
  max_discount_amount: number;
  limit_per_user: number;
  product_scope: ApiCouponScope;
  customer_scope: ApiCouponScope;
  start_date: string;
  expire_date: string;
  status: boolean;
  product_variation_ids: number[];
  customer_ids: number[];
};

export type ApiCouponPayload = {
  title?: string;
  code?: string;
  discount?: number;
  discount_type?: ApiDiscountType;
  min_purchase_amount?: number;
  max_discount_amount?: number;
  limit_per_user?: number;

  product_scope?: ApiCouponScope;
  product_variation_ids?: number[];

  customer_scope?: ApiCouponScope;
  customer_ids?: number[];

  start_date?: string; // YYYY-MM-DD
  expire_date?: string; // YYYY-MM-DD
  status?: boolean;
};

export type CouponListQuery = {
  search?: string;

  product_scope?: ApiCouponScope;
  customer_scope?: ApiCouponScope;

  discount_type?: ApiDiscountType;
  status?: boolean;

  limit?: number;
  offset?: number;
};

/** usersScope status must be: active|inactive|suspended */
export type UserAccountStatus = "active" | "inactive" | "suspended";

export type UsersScopeQuery = {
  search?: string;
  phone?: string;
  status?: UserAccountStatus;
  limit?: number;
  offset?: number;
};

export type ApiUserScopeItem = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  verified_phones: string[];
};

export type ApiUsersScopeResponse = {
  success: boolean;
  total: number;
  data: ApiUserScopeItem[];
};

export type ProductScopeQuery = {
  search?: string;
  product_id?: number;
  status?: boolean;
  limit?: number;
  offset?: number;
};

export type ApiProductScopeItem = {
  variation_id: number;
  sku: string;

  product_id: number;
  product_name: string;

  color_name: string | null;
  variant_name: string | null;

  status: number;
};

export type ApiProductScopeResponse = {
  success: boolean;
  total: number;
  data: ApiProductScopeItem[];
};

/** ---------- Helpers ---------- */
function buildQueryString(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;

    if (typeof v === "boolean") {
      sp.set(k, v ? "true" : "false");
      return;
    }

    sp.set(k, String(v));
  });

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/** ---------- API calls ---------- */
export async function getCoupons(query?: CouponListQuery): Promise<ApiCouponListResponse> {
  const qs = buildQueryString({
    search: query?.search,
    product_scope: query?.product_scope,
    customer_scope: query?.customer_scope,
    discount_type: query?.discount_type,
    status: query?.status,
    limit: query?.limit ?? 10,
    offset: query?.offset ?? 0,
  });

  const res = await api.get(`/coupons${qs}`);
  return res.data;
}

export async function getCouponById(id: number): Promise<ApiCouponSingleResponse> {
  const res = await api.get(`/coupon/${id}`);
  return res.data;
}

export async function createCoupon(payload: ApiCouponPayload): Promise<ApiCouponCreateResponse> {
  const res = await api.post(`/coupon`, payload);
  return res.data;
}

/**
 * PUT /coupon/:id may return {success:true} or may return the updated object depending on backend.
 * We'll keep it as unknown in UI and interpret safely.
 */
export async function updateCoupon(id: number, payload: ApiCouponPayload) {
  const res = await api.put(`/coupon/${id}`, payload);
  return res.data;
}

export async function deleteCoupon(id: number) {
  const res = await api.delete(`/coupon/${id}`);
  return res.data;
}

export async function getUsersScope(query?: UsersScopeQuery): Promise<ApiUsersScopeResponse> {
  const qs = buildQueryString({
    search: query?.search,
    phone: query?.phone,
    status: query?.status, // active | inactive | suspended
    limit: query?.limit ?? 20,
    offset: query?.offset ?? 0,
  });

  const res = await api.get(`/usersScope${qs}`);
  return res.data;
}

export async function getProductScope(query?: ProductScopeQuery): Promise<ApiProductScopeResponse> {
  const qs = buildQueryString({
    search: query?.search,
    product_id: query?.product_id,
    status: query?.status,
    limit: query?.limit ?? 20,
    offset: query?.offset ?? 0,
  });

  const res = await api.get(`/productScope${qs}`);
  return res.data;
}
