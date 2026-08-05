"use client";

import { api } from "@/lib/api/client";

export type ApiError = {
  flag?: number;
  error?: string;
  message?: string;
};

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

export type CouponOrderItem = {
  product_variation_id: number;
  quantity: number;
};

export type ValidateCouponBody = {
  customer_id?: number;
  coupon: string;
  order_items: CouponOrderItem[];
};

export type CouponAppliedItem = {
  product_variation_id: number;
  product_name: string;
  discount_applied: number;
};

export type CouponTotals = {
  total_selling_price: number;
  total_sku_discount: number;
  total_coupon_discount: number;
  total_discount: number;
  final_payable_amount: number;
};

export type ValidateCouponData = {
  coupon_title: string;
  applied_items: CouponAppliedItem[];
  totals: CouponTotals;
};

export type ValidateCouponResponse = {
  success: boolean;
  data?: ValidateCouponData;
  error?: string;
  message?: string;
  flag?: number;
};

export const couponKeys = {
  all: ["coupon"] as const,
  validate: (payload?: ValidateCouponBody) => [
    ...couponKeys.all, 
    "validate", 
    payload?.coupon, 
    payload?.order_items.map(item => `${item.product_variation_id}-${item.quantity}`).join(",")
  ] as const,
};

class CouponService {
  async validateCoupon(body: ValidateCouponBody): Promise<ValidateCouponResponse> {
    try {
      const res = await api.post<ValidateCouponResponse>("/validateCoupon", body);
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to validate coupon"));
    }
  }
}

export const couponService = new CouponService();
