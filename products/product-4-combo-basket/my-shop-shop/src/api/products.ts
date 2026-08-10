import { useQuery } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiProduct {
  id: number;
  name: string;
  name_bn?: string | null;
  slug: string;
  price: number; // MRP — shown as strikethrough when there is a discount
  discount_amount?: number; // flat ৳ discount set in admin
  sell_price?: number; // price − discount_amount (virtual, computed by API)
  original_price?: number; // legacy
  actual_price?: number | null; // cost price (admin only)
  discount_price?: number | null; // legacy
  short_description: string;
  description: string;
  image: string;
  images?: string[];
  category_id: number;
  category?: { id: number; name: string; slug: string };
  tags?: string[];
  features?: string[];
  specifications?: Record<string, string>;
  in_stock: boolean;
  stock_qty: number;
  rating: number;
  review_count: number;
  is_combo_eligible: boolean;
  is_featured: boolean;
}

export interface ProductListResponse {
  success: boolean;
  products: ApiProduct[];
  total: number;
  pages: number;
  page: number;
}

export interface ProductDetailResponse {
  success: boolean;
  product: ApiProduct;
}

export interface UseProductsParams {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
  is_combo_eligible?: boolean;
}

// ─── Transformer ──────────────────────────────────────────────────────────────

/** Map API snake_case product to frontend camelCase */
export function toFrontendProduct(p: ApiProduct) {
  const mrp = Number(p.price);
  // Always compute locally from discount_amount — more reliable than virtual field
  const discountAmt = Number(p.discount_amount ?? 0);
  const sellPrice = discountAmt > 0 ? Math.max(0, mrp - discountAmt) : mrp;
  const hasDiscount = sellPrice < mrp;

  return {
    id: p.id,
    name: p.name,
    name_bn: p.name_bn ?? null,
    slug: p.slug,
    price: mrp, // MRP — shown as strikethrough
    originalPrice: mrp, // alias for MRP, used in cart/combo for strikethrough
    discountPrice: hasDiscount ? sellPrice : null, // effective sell price
    discountAmount: discountAmt, // flat discount ৳
    shortDescription: p.short_description,
    description: p.description,
    image: p.image,
    images: p.images?.length ? p.images : [p.image],
    category: p.category?.name ?? "",
    categorySlug: p.category?.slug ?? "",
    rating: Number(p.rating),
    reviewCount: p.review_count,
    inStock: p.in_stock,
    stockQty: p.stock_qty,
    tags: p.tags ?? [],
    features: p.features ?? [],
    specifications: p.specifications ?? {},
    isComboEligible: p.is_combo_eligible,
    isFeatured: p.is_featured,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useProducts(params: UseProductsParams = {}) {
  const {
    category,
    search,
    sort,
    page = 1,
    limit = 20,
    featured,
    is_combo_eligible,
  } = params;

  return useQuery<ProductListResponse>({
    queryKey: [
      "products",
      { category, search, sort, page, limit, featured, is_combo_eligible },
    ],
    queryFn: async () => {
      const q = new URLSearchParams();
      if (category) q.set("category", category);
      if (search) q.set("search", search);
      if (sort) q.set("sort", sort);
      q.set("page", String(page));
      q.set("limit", String(limit));
      if (featured) q.set("featured", "true");
      if (is_combo_eligible) q.set("is_combo_eligible", "true");
      const { data } = await apiClient.get(`/products?${q.toString()}`);
      return data;
    },
  });
}

export function useProduct(slug: string | null | undefined) {
  return useQuery<ProductDetailResponse>({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
  });
}
