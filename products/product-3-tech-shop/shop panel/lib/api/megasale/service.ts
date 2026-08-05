import type { ApiError } from "@/lib/api/auth/service";
import { api } from "@/lib/api/client";

export type MegaSaleProductDto = {
  id: number;
  product_sku_id: number;
  mega_sale_entry_id: number;
  name: string;
  name_bd: string | null;
  slug: string;
  thumbnail: string | null;
  selling_price: number;
  final_price: number;
  has_discount: boolean;
  discount_percent: number;
  stock: number;
  color_name: string | null;
  variant_name: string | null;
  product_end_at: string | null;
  created_at: string | null;
  serial: number;
};

export type MegaSaleVisibilityData = {
  show_megasale: boolean;
  megasale_campaign_end_at: string | null;
  megasale_product_ids: number[];
  megasale_product_limit: number;
  megasale_product_timers: Record<string, string>;
  products: MegaSaleProductDto[];
  filter_counts?: {
    all: number;
    in_stock: number;
    discounted: number;
    new_arrivals: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type MegaSaleVisibilityResponse = {
  success: boolean;
  data: MegaSaleVisibilityData;
  error?: string;
  message?: string;
};

export type MegaSaleListParams = {
  page?: number;
  limit?: number;
  search?: string;
  stock_filter?: "in_stock" | "discounted" | "new_arrivals" | string;
  sort_by?:
    | "serial"
    | "price_asc"
    | "price_desc"
    | "date_desc"
    | "date_asc"
    | "name_asc"
    | "name_desc"
    | string;
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

class MegaSaleService {
  /**
   * Public mega-sale feed used by the storefront hot-deals section.
   * GET /user/storefront-visibility
   */
  async getVisibility(
    params?: MegaSaleListParams,
  ): Promise<MegaSaleVisibilityData> {
    try {
      const response = await api.get<MegaSaleVisibilityResponse>(
        "/user/storefront-visibility",
        {
          params: {
            page: params?.page ?? 1,
            limit: Math.min(Math.max(params?.limit ?? 12, 1), 50),
            search: params?.search,
            stock_filter: params?.stock_filter,
            sort_by: params?.sort_by ?? "serial",
          },
        },
      );

      const payload = response.data;
      if (!payload?.success || !payload.data) {
        throw new Error(
          payload?.error || payload?.message || "Failed to load mega sale",
        );
      }

      return {
        show_megasale: Boolean(payload.data.show_megasale),
        megasale_campaign_end_at: payload.data.megasale_campaign_end_at ?? null,
        megasale_product_ids: Array.isArray(payload.data.megasale_product_ids)
          ? payload.data.megasale_product_ids
          : [],
        megasale_product_limit:
          typeof payload.data.megasale_product_limit === "number"
            ? payload.data.megasale_product_limit
            : 50,
        megasale_product_timers:
          payload.data.megasale_product_timers &&
          typeof payload.data.megasale_product_timers === "object"
            ? payload.data.megasale_product_timers
            : {},
        products: Array.isArray(payload.data.products)
          ? payload.data.products
          : [],
        filter_counts: payload.data.filter_counts,
        pagination: payload.data.pagination,
      };
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to load mega sale"));
    }
  }
}

export const megaSaleService = new MegaSaleService();
