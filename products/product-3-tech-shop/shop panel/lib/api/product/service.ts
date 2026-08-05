import type { ApiError } from "@/lib/api/auth/service";
import { api } from "../client";

// ── Compare API types ──────────────────────────────────────────────────────
export interface BulkRule {
  min_qty: number;
  discount_value: number;
  discount_type: 0 | 1;
  discount_label: string;
  effective_price: number;
}

export interface CompareVariation {
  id: number;
  sku: string;
  color: { id: number; name: string; name_bd: string | null; hex: string | null };
  variant: { id: number; name: string; name_bd: string | null };
  selling_price: number;
  discount: number;
  discount_type: 0 | 1;
  final_price: number;
  item_discount_amount: number;
  stock: number;
  in_stock: boolean;
  weight_kg: number | null;
  bulk_rules: BulkRule[];
}

export interface CompareProductDetail {
  id: number;
  name: string;
  name_bd: string | null;
  slug: string;
  short_description: string | null;
  brand: { id: number; name: string } | null;
  main_category: { id: number; name: string };
  sub_category: { id: number; name: string } | null;
  child_category: { id: number; name: string } | null;
  free_delivery: boolean;
  featured: boolean;
  best_deal: boolean;
  sell_count: number;
  view_count: number;
  images: { id: number; path: string; position: number; product_sku_id: number | null }[];
  variations: CompareVariation[];
  summary: {
    total_variations: number;
    total_in_stock: number;
    total_stock: number;
    min_price: number | null;
    max_price: number | null;
  };
}

export interface CompareResponse {
  success: boolean;
  data: CompareProductDetail[];
  count: number;
}

export interface CategoryAllocation {
  child_category_id: number;
  qty: number;
}

export interface BudgetPlanParams {
  budget: number;
  coupon?: string;
  search?: string;
  main_category_id?: number;
  sub_category_id?: number;
  child_category_id?: number;
  limit?: number;
  customer_id?: number;
  merge_skus?: boolean;
  category_allocations?: CategoryAllocation[];
}

export interface MergedVariants {
  total_variants: number;
  colors: string[];
  sizes: string[];
  price_range: { min: number; max: number };
}

export interface BudgetPlanItem {
  product_id: number;
  product_name: string;
  product_slug: string;
  sku_id: number;
  sku: string;
  thumbnail: string | null;
  color_name: string | null;
  color_hex: string | null;
  variant_name: string | null;
  category_name: string | null;
  free_delivery: boolean;
  stock: number;
  child_category_id?: number;
  merged_variants?: MergedVariants;
  pricing: {
    original_price: number;
    item_discount: number;
    price_after_item_discount: number;
    coupon_discount_per_unit: number;
    bulk_discount_applied: { min_qty: number; discount_label: string } | null;
    effective_price_per_unit: number;
  };
  bulk_rules: BulkRule[];
  affordability: {
    qty_affordable: number;
    total_spend: number;
    total_saved: number;
    change: number;
  };
}

export interface AllocationSuggestion {
  product_id: number;
  product_name: string;
  product_slug: string;
  sku_id: number;
  sku: string;
  thumbnail: string | null;
  color_name: string | null;
  color_hex: string | null;
  variant_name: string | null;
  category_name: string | null;
  free_delivery: boolean;
  stock: number;
  child_category_id?: number;
  merged_variants?: MergedVariants;
  pricing: {
    original_price: number;
    item_discount: number;
    price_after_item_discount: number;
    coupon_discount_per_unit: number;
    bulk_discount_applied: { min_qty: number; discount_label: string } | null;
    effective_price_per_unit: number;
  };
  bulk_rules: BulkRule[];
  total_for_qty: number;
}

export interface AllocationGroup {
  child_category_id: number;
  child_category_name: string | null;
  requested_qty: number;
  suggestions: AllocationSuggestion[];
}

export interface AllocationResponse {
  allocations: AllocationGroup[];
}

export interface BudgetPlanMeta {
  budget: number;
  coupon_applied: boolean;
  coupon_title: string | null;
  coupon_error: string | null;
  total_matches?: number;
  returned?: number;
  merged?: boolean;
  total_allocations?: number;
  total_items?: number;
}

export interface BudgetPlanResponse {
  success: boolean;
  data: BudgetPlanItem[] | AllocationResponse;
  meta: BudgetPlanMeta;
}

// File: lib/api/product/service.ts
export type ProductListParams = {
  // Pagination
  limit?: number;
  offset?: number;
  page?: number;

  // Category (backend filters by ID — resolve slug → ID in the shop UI)
  main_category_id?: number;
  child_category_id?: number;
  sub_category_id?: number;

  // Filters
  variant_id?: string;
  color_id?: string;
  variant_ids?: string;
  color_ids?: string;

  // Price
  min_price?: number;
  max_price?: number;

  // Search
  search?: string;
  q?: string;

  // Sorting
  sort_by?: "name" | "price" | "created_at" | string;
  sort_order?: "ASC" | "DESC" | "asc" | "desc";
  sort?: string;

  // Other
  status?: boolean;
  featured?: boolean;
  best_deal?: boolean;
  in_stock?: boolean;

  // Direct filter strings
  sizes?: string;
  colors?: string;
  brands?: string;
  /** Comma-separated brand IDs — matches GET /user/products?brand_id= */
  brand_id?: string;

  /** Product-level flags */
  free_delivery?: boolean;

  /** Authenticated-only: filter products that are in the user's favorites */
  is_favourite?: boolean;

  // For infinite scroll
  cursor?: string;
};

export type ProductListData = {
  products: ProductListItem[];
  total: number;
  count: number;
  has_more: boolean;
  next_page?: number | null;
  previous_page?: number | null;
  current_page?: number;
  total_pages?: number;
};

// ---------- Shared ----------
export type ProductImage = {
  id: number;
  path: string;
  priority?: number;
  serial?: number;
  sku_id?: number | null;        // null = shared (all SKUs)
  sku_color_id?: number | null;  // derived from product_skus.color_id
  sku_variant_id?: number | null;// derived from product_skus.variant_id
};

// ---------- Variation (LIST item) ----------
export type ProductVariationListItem = {
  id: number;

  color_id: number;
  variant_id: number;
  has_discount?: boolean;

  buying_price: number;
  selling_price: number;
  final_price?: number;

  discount: number;
  discount_type: 0 | 1 | null;

  stock: number;
  sku: string;
};

// ---------- Variation (DETAIL item) ----------
export type ProductColor = {
  id: number;
  name: string;
  name_bd?: string | null;
  hex?: string;
  priority?: number;
  status?: boolean;
};

export type PriceRange = {
  min: number;
  max: number;
  has_discount: boolean;
};

export type ProductAttributeRef = {
  id: number;
  name: string;
  priority?: number;
};

export type ProductVariantRef = {
  id: number;
  name: string;
  name_bd?: string | null;
  priority?: number;
  status?: boolean;
  attribute?: ProductAttributeRef;
};

export type ProductVariationDetail = {
  id: number;

  color: ProductColor | null;
  variant: ProductVariantRef | null;

  buying_price?: number;
  selling_price: number;

  discount: number;
  discount_type: 0 | 1 | null;

  final_price: number;

  stock: number;
  sku: string;

  weight_kg?: number | null;
  free_delivery?: boolean | null;

  status?: boolean;
  in_stock: boolean;
};

// ---------- Shared refs (used by list + detail) ----------
export type CategoryRef = { id: number; name: string; name_bd?: string | null };
export type BrandRef = { id: number; name: string; image?: string | null };
export type AttributeRef = { id: number; name: string };

// ---------- Product LIST item ----------
export type ProductListItem = {
  id: number;
  name: string;
  name_bd?: string | null;
  slug: string;

  main_category_id?: number;
  sub_category_id?: number;
  child_category_id?: number;
  is_favourite: boolean;

  brand_id?: number;
  brand?: BrandRef | null;
  main_category?: CategoryRef | null;
  sub_category?: CategoryRef | null;
  child_category?: CategoryRef | null;

  status: boolean;
  featured: boolean;
  best_deal: boolean;
  /** Present when the catalog API exposes free delivery on list items */
  free_delivery?: boolean;

  avg_rating: number;
  review_count: number;

  created_at?: string;
  updated_at?: string;
  price_range: PriceRange;

  images: ProductImage[];
  thumbnail: string;
  variations: ProductVariationListItem[];
};

// ---------- Product DETAIL ----------

export type RelatedProductVariation = {
  id: number;
  selling_price: number;
  discount: number;
  discount_type: 0 | 1 | null;
  final_price: number;
  stock: number;
  sku: string;
  in_stock: boolean;
};

export type RelatedProduct = {
  id: number;
  name: string;
  name_bd?: string | null;
  slug: string;
  image: string | null;
  featured: boolean;
  min_price: number;
  is_favourite: boolean;
  keyword_match_count: number;
  variations: RelatedProductVariation[];
};

export type ProductDetail = {
  id: number;
  name: string;
  name_bd?: string | null;
  slug: string;

  main_category: CategoryRef | null;
  sub_category: CategoryRef | null;
  child_category: CategoryRef | null;

  brand: BrandRef | null;
  attribute: AttributeRef | null;

  video_path: string | null;
  short_description: string | null;
  is_favourite: boolean;
  long_description: string | null;

  status: boolean;
  featured: boolean;
  free_delivery: boolean;
  best_deal: boolean;

  view_count: number;
  sell_count: number;

  meta_title: string | null;
  canonical_url: string | null;
  meta_description: string | null;
  meta_keywords: string | null;

  og_title: string | null;
  og_description: string | null;

  robots: string | null;

  created_at: string;
  updated_at: string;

  images: ProductImage[];
  variations: ProductVariationDetail[];

  available_colors: Array<{
    id: number;
    name: string;
    name_bd?: string | null;
    hex?: string;
    priority?: number;
  }>;

  available_variants: Array<{
    id: number;
    name: string;
    name_bd?: string | null;
    attribute_id: number;
    attribute_name: string;
  }>;

  related_products: RelatedProduct[];

  summary?: {
    total_variations: number;
    total_in_stock: number;
    total_out_of_stock: number;
    min_price: number;
    max_price: number;
    total_stock: number;
  } | null;
};

export type SyncCartItemResponse = {
  id: string;
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
  weight_kg: number;
  free_delivery: boolean;
};

// ---------- Responses ----------
export type ProductDetailResponse = {
  success: boolean;
  product: ProductDetail;
  message?: string;
  error?: string;
  flag?: number;
};

export type ProductVariationsResponse = {
  success: boolean;
  data: ProductVariationListItem[];
  message?: string;
  error?: string;
  flag?: number;
};

export type ProductVariationDetailResponse = {
  success: boolean;
  data: ProductVariationDetail;
  message?: string;
  error?: string;
  flag?: number;
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

class ProductService {
  async getProducts(params?: ProductListParams): Promise<ProductListData> {
    try {
      const response = await api.get<{
        success?: boolean;
        products?: ProductListData["products"];
        total?: number;
        limit?: number;
        offset?: number;
        count?: number;
        has_more?: boolean;
      }>("/user/products", {
        params: {
          limit: params?.limit ?? 40,
          main_category_id: params?.main_category_id,
          child_category_id: params?.child_category_id,
          sub_category_id: params?.sub_category_id,
          search: params?.search ?? params?.q,
          max_price: params?.max_price,
          min_price: params?.min_price,
          variant_id: params?.variant_id,
          color_id: params?.color_id,
          offset: params?.offset ?? 0,
          sort_by: params?.sort_by,
          sort_order: params?.sort_order,
          featured: params?.featured,
          best_deal: params?.best_deal,
          free_delivery: params?.free_delivery,
          in_stock: params?.in_stock,
          brand_id: params?.brand_id,
          brands: params?.brands,
          is_favourite: params?.is_favourite,
          status: params?.status ?? true,
        },
      });

      const data = response.data;
      const products = Array.isArray(data?.products) ? data.products : [];
      const total = typeof data?.total === "number" ? data.total : products.length;
      const offset = typeof data?.offset === "number" ? data.offset : params?.offset ?? 0;

      return {
        products,
        total,
        count: typeof data?.count === "number" ? data.count : products.length,
        has_more:
          typeof data?.has_more === "boolean"
            ? data.has_more
            : offset + products.length < total,
      };
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get products"));
    }
  }

  async getProductById(id: number): Promise<ProductDetailResponse> {
    try {
      const response = await api.get<ProductDetailResponse>(
        `/user/product/${id}`,
      );
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get product"));
    }
  }

  /**
   * Resolves a public product slug → full detail.
   * Uses list search then exact slug match (API has no slug route).
   */
  async getProductBySlug(slug: string): Promise<ProductDetail> {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) {
      throw new Error("Product not found");
    }

    const list = await this.getProducts({
      search: normalized,
      limit: 30,
      status: true,
    });

    const match =
      list.products.find((p) => p.slug.toLowerCase() === normalized) ?? null;

    if (!match) {
      throw new Error("Product not found");
    }

    const detail = await this.getProductById(match.id);
    if (!detail?.success || !detail.product) {
      throw new Error("Product not found");
    }

    if (detail.product.slug.toLowerCase() !== normalized) {
      throw new Error("Product not found");
    }

    return detail.product;
  }

  async getVariations(product_id: number): Promise<ProductVariationsResponse> {
    try {
      const response = await api.get<ProductVariationsResponse>(
        `/product/getvariations/${product_id}`,
      );
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get variations"));
    }
  }

  async getVariationById(id: number): Promise<ProductVariationDetailResponse> {
    try {
      const response = await api.get<ProductVariationDetailResponse>(
        `/product/variation/${id}`,
      );
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to get variation"));
    }
  }

  async syncCartItems(skuIds: string[] | number[]): Promise<{ success: boolean; data: SyncCartItemResponse[] }> {
    try {
      const response = await api.post<{ success: boolean; data: SyncCartItemResponse[] }>(
        `/user/cart/sync`,
        { sku_ids: skuIds.map(Number) }
      );
      return response.data;
    } catch (err) {
      // Intentionally swallow errors so cart doesn't break, just returns empty
      return { success: false, data: [] };
    }
  }

  async compareProducts(
    ids: number[],
    options?: { signal?: AbortSignal },
  ): Promise<CompareResponse> {
    // Backend accepts 1–2 IDs only — sanitize before the request
    const uniqueIds = Array.from(
      new Set(
        ids
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id) && id > 0),
      ),
    ).slice(0, 2);

    if (uniqueIds.length < 1) {
      throw new Error("Provide at least one product ID to compare");
    }

    try {
      const response = await api.get<CompareResponse>(`/user/compare`, {
        params: { ids: uniqueIds.join(",") },
        signal: options?.signal,
      });
      return response.data;
    } catch (err) {
      if (options?.signal?.aborted) throw err;
      throw new Error(getServerErrorMessage(err, "Failed to compare products"));
    }
  }

  async budgetPlan(
    params: BudgetPlanParams,
    options?: { signal?: AbortSignal },
  ): Promise<BudgetPlanResponse> {
    const budget = Number(params.budget);
    if (!Number.isFinite(budget) || budget <= 0) {
      throw new Error("Enter a valid budget greater than zero");
    }

    const payload: BudgetPlanParams = {
      ...params,
      budget,
      limit:
        typeof params.limit === "number" && params.limit > 0
          ? Math.min(100, Math.floor(params.limit))
          : 48,
      coupon: params.coupon?.trim().toUpperCase() || undefined,
      search: params.search?.trim() || undefined,
      category_allocations: params.category_allocations
        ?.filter(
          (a) =>
            Number.isFinite(a.child_category_id) &&
            a.child_category_id > 0 &&
            Number.isFinite(a.qty) &&
            a.qty > 0,
        )
        .map((a) => ({
          child_category_id: Math.floor(a.child_category_id),
          qty: Math.min(100, Math.floor(a.qty)),
        })),
    };

    try {
      const response = await api.post<BudgetPlanResponse>(
        `/user/budget-plan`,
        payload,
        { signal: options?.signal },
      );
      return response.data;
    } catch (err) {
      if (options?.signal?.aborted) throw err;
      throw new Error(getServerErrorMessage(err, "Failed to calculate budget plan"));
    }
  }
}

export const productService = new ProductService();
