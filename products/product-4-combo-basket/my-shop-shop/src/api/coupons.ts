import { useMutation } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidateCouponPayload {
  code: string;
  order_total: number;
  order_mode: string;
}

export interface ValidateCouponResponse {
  success: boolean;
  discount: number;
  type: "percent" | "fixed";
  value: number;
  message?: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useValidateCoupon() {
  return useMutation<ValidateCouponResponse, Error, ValidateCouponPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/coupons/validate", payload);
      return data;
    },
  });
}
