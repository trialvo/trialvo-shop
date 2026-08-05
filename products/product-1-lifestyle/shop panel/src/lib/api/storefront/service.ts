import { api } from "../client";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Global mega-sale settings (backward-compatible + new fields) */
export type StorefrontVisibilityData = {
  show_megasale: boolean;
  megasale_campaign_end_at: string | null;
  megasale_product_ids: number[];
  megasale_product_limit: number;
  megasale_product_timers: Record<string, string>;
};

/** A single product returned by the new paginated API */
export type MegaSaleProductItem = {
  id: number | string;               // product_id
  product_sku_id: number | string;
  mega_sale_entry_id: number | string;
  name: string;
  name_bd: string | null;
  slug: string;
  thumbnail: string | null;
  selling_price: number | string | null;
  final_price: number | string | null;
  has_discount: boolean | number;
  discount_percent: number | string | null;
  stock: number | string | null;
  color_name: string | null;
  variant_name: string | null;
  product_end_at: string | null;
  created_at: string | null;
  serial: number | string;
};

export type MegaSaleProductSort = "serial" | "price_asc" | "price_desc";
export type MegaSaleStockFilter = "all" | "in_stock" | "discounted" | "new_arrivals";

export type FilterCounts = {
  all: number;
  in_stock: number;
  discounted: number;
  new_arrivals: number;
};

export type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

/** Full response from GET /user/storefront-visibility */
export type MegaSaleApiResponse = {
  success: boolean;
  data: StorefrontVisibilityData & {
    products: MegaSaleProductItem[];
    filter_counts: FilterCounts;
    pagination: PaginationInfo;
  };
};

export type StorefrontVisibilityResponse = {
  success?: boolean;
  data?: Partial<StorefrontVisibilityData>;
  message?: string;
  error?: string;
};

export const storefrontVisibilityKeys = {
  all: ["storefrontVisibility"] as const,
  detail: () => [...storefrontVisibilityKeys.all, "detail"] as const,
  products: (params?: Record<string, string | number>) =>
    [...storefrontVisibilityKeys.all, "products", params ?? {}] as const,
};

// ─── Service ──────────────────────────────────────────────────────────────────

class StorefrontVisibilityService {
  private normalizeDateTime(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeProductIds(value: unknown): number[] {
    if (Array.isArray(value)) {
      return value
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
        .map((id) => Math.trunc(id));
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => Number.isFinite(id) && id > 0);
    }

    return [];
  }

  private normalizeProductTimers(value: unknown): Record<string, string> {
    const timers: Record<string, string> = {};

    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, rawDate] of Object.entries(value as Record<string, unknown>)) {
        const productId = Number.parseInt(key, 10);
        if (!Number.isFinite(productId) || productId <= 0) continue;
        const normalizedDate = this.normalizeDateTime(rawDate);
        if (!normalizedDate) continue;
        timers[String(productId)] = normalizedDate;
      }
      return timers;
    }

    if (typeof value !== "string") return timers;

    const entries = value
      .split(/[\n,;]+/)
      .map((part) => part.trim())
      .filter(Boolean);

    for (const entry of entries) {
      let pair = entry.split("=");
      if (pair.length < 2) pair = entry.split("|");
      if (pair.length < 2) continue;
      const productId = Number.parseInt((pair[0] || "").trim(), 10);
      if (!Number.isFinite(productId) || productId <= 0) continue;
      const dateRaw = pair.slice(1).join("=").trim();
      const normalizedDate = this.normalizeDateTime(dateRaw);
      if (!normalizedDate) continue;
      timers[String(productId)] = normalizedDate;
    }

    return timers;
  }

  private normalizeLimit(value: unknown, fallback = 50): number {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(Math.trunc(parsed), 100);
  }

  /** Fetch global settings only (no products) */
  async getVisibility(): Promise<StorefrontVisibilityData> {
    try {
      const response = await api.get<StorefrontVisibilityResponse>(
        "/user/storefront-visibility",
        { params: { limit: 0 } },
      );
      return {
        show_megasale: response?.data?.data?.show_megasale === true,
        megasale_campaign_end_at: this.normalizeDateTime(response?.data?.data?.megasale_campaign_end_at),
        megasale_product_ids: this.normalizeProductIds(response?.data?.data?.megasale_product_ids),
        megasale_product_limit: this.normalizeLimit(response?.data?.data?.megasale_product_limit),
        megasale_product_timers: this.normalizeProductTimers(response?.data?.data?.megasale_product_timers),
      };
    } catch {
      return {
        show_megasale: false,
        megasale_campaign_end_at: null,
        megasale_product_ids: [],
        megasale_product_limit: 50,
        megasale_product_timers: {},
      };
    }
  }

  /** Fetch paginated mega-sale products with server-side filtering and sorting */
  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    stock_filter?: MegaSaleStockFilter;
    sort_by?: MegaSaleProductSort;
  }): Promise<{
    products: MegaSaleProductItem[];
    filter_counts: FilterCounts;
    pagination: PaginationInfo;
    show_megasale: boolean;
    megasale_campaign_end_at: string | null;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page && params.page > 0) queryParams.set("page", String(params.page));
      if (params.limit && params.limit > 0) queryParams.set("limit", String(params.limit));
      if (params.search) queryParams.set("search", params.search);
      if (params.stock_filter && params.stock_filter !== "all") {
        queryParams.set("stock_filter", params.stock_filter);
      }
      if (params.sort_by) queryParams.set("sort_by", params.sort_by);

      const response = await api.get<MegaSaleApiResponse>(
        `/user/storefront-visibility${queryParams.size > 0 ? `?${queryParams.toString()}` : ""}`,
      );
      const data = response?.data?.data;

      return {
        products: Array.isArray(data?.products) ? data.products : [],
        filter_counts: data?.filter_counts ?? { all: 0, in_stock: 0, discounted: 0, new_arrivals: 0 },
        pagination: data?.pagination ?? { page: 1, limit: 20, total: 0, total_pages: 0 },
        show_megasale: data?.show_megasale ?? false,
        megasale_campaign_end_at: this.normalizeDateTime(data?.megasale_campaign_end_at),
      };
    } catch {
      return {
        products: [],
        filter_counts: { all: 0, in_stock: 0, discounted: 0, new_arrivals: 0 },
        pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
        show_megasale: false,
        megasale_campaign_end_at: null,
      };
    }
  }
}

export const storefrontVisibilityService = new StorefrontVisibilityService();
