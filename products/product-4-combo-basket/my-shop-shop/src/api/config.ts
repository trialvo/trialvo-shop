import { useQuery } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

import { ShopConfig } from "@/config/shopConfig";

export interface ShopConfigResponse {
  success: boolean;
  config: ShopConfig;
}

// ─── Transformer ──────────────────────────────────────────────────────────────

/** Convert API config to frontend context shape, coercing numeric fields. */
export function apiConfigToContext(cfg: any): ShopConfig {
  const parseMode = (m: any) => ({
    isActive: m?.isActive !== false,
    discountAmount: Number(m?.discountAmount) || 0,
    discountType: m?.discountType || "percent",
    minAmountForDiscount: Number(m?.minAmountForDiscount) || 0,
    minAmountForFreeDelivery: Number(m?.minAmountForFreeDelivery) || 0,
    deliveryCharge: Number(m?.deliveryCharge) || 0,
    deliveryConfig: m?.deliveryConfig || {},
  });

  return {
    combo: parseMode(cfg?.combo),
    single: parseMode(cfg?.single),
    "combo-bundle": parseMode(cfg?.["combo-bundle"] ?? cfg?.combo_bundle),
    delivery_zones: cfg?.delivery_zones || [],
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useShopConfigApi() {
  return useQuery<ShopConfigResponse>({
    queryKey: ["shop-config"],
    queryFn: async () => {
      const { data } = await apiClient.get("/config");
      return data;
    },
    staleTime: 5 * 60_000,
  });
}
