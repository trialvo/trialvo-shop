import { api } from "@/lib/api/client";
import type { ApiError } from "@/lib/api/auth/types";

export type DealDiscountType = 0 | 1;

export type BulkRule = {
  id: number;
  name: string | null;
  product_sku_id: number;
  min_qty: number;
  discount_type: DealDiscountType;
  discount_value: number;
  free_delivery: 0 | 1 | boolean;
  sku: string | null;
  selling_price: number;
  stock: number | null;
  product_id: number;
  product_name: string;
  product_slug: string;
  color_name: string | null;
  variant_name: string | null;
  product_image: string | null;
};

export type ComboTierItem = {
  product_sku_id: number;
  required_qty: number;
  sku: string | null;
  selling_price: number;
  stock: number | null;
  product_id: number;
  product_name: string;
  product_slug: string;
  color_name: string | null;
  variant_name: string | null;
  product_image: string | null;
};

export type ComboTier = {
  id: number;
  serial: number;
  discount_type: DealDiscountType;
  discount_value: number;
  items: ComboTierItem[];
};

export type ComboRule = {
  id: number;
  name: string;
  description: string | null;
  free_delivery: 0 | 1 | boolean;
  tiers: ComboTier[];
};

export type DealsResponse = {
  bulkRules: BulkRule[];
  comboRules: ComboRule[];
};

type ApiListResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
};

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as { response?: { data?: ApiError }; message?: string };

  return (
    e?.response?.data?.error ||
    e?.response?.data?.message ||
    e?.message ||
    fallback
  );
};

const pickArrayData = <T>(response: ApiListResponse<T[]>): T[] =>
  Array.isArray(response.data) ? response.data : [];

const assertSuccessfulResponse = <T>(
  response: ApiListResponse<T>,
  fallback: string,
) => {
  if (response.error || response.success === false) {
    throw new Error(response.error || response.message || fallback);
  }
};

class DealService {
  async getBulkRules(): Promise<BulkRule[]> {
    try {
      const response = await api.get<ApiListResponse<BulkRule[]>>(
        "/user/bulk-rules",
      );
      assertSuccessfulResponse(response.data, "Failed to load bulk offers");
      return pickArrayData(response.data);
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to load bulk offers"));
    }
  }

  async getComboRules(): Promise<ComboRule[]> {
    try {
      const response = await api.get<ApiListResponse<ComboRule[]>>(
        "/user/combo-rules",
      );
      assertSuccessfulResponse(response.data, "Failed to load combo deals");
      return pickArrayData(response.data);
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to load combo deals"));
    }
  }

  async getDeals(): Promise<DealsResponse> {
    const [bulkRules, comboRules] = await Promise.all([
      this.getBulkRules(),
      this.getComboRules(),
    ]);

    return { bulkRules, comboRules };
  }
}

export const dealService = new DealService();
