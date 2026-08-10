import { useQuery } from "@tanstack/react-query";
import apiClient from "./client";
import type { Product } from "@/types";

export interface ComboProductItem {
  id: number;
  combo_id: number;
  product_id: number;
  qty: number;
  custom_label?: string;
  product?: {
    id: number;
    name: string;
    name_bn?: string | null;
    slug: string;
    image: string;
    price: number; // MRP
    original_price?: number; // MRP (alias from API)
    discount_amount?: number; // flat BDT discount
    sell_price?: number; // price - discount_amount (virtual)
    in_stock: boolean;
  };
}

export interface ComboProduct {
  id: number;
  name: string;
  name_bn?: string | null;
  slug: string;
  description?: string;
  short_description?: string;
  image?: string;
  images?: string[];
  bundle_price: number;
  original_price?: number;
  discount_percent?: number;
  in_stock: boolean;
  stock_qty: number;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  tags?: string[];
  items?: ComboProductItem[];
}

export interface ComboBundleListResponse {
  success: boolean;
  combos: ComboProduct[];
  total: number;
  pages: number;
  page: number;
}

/** Map a ComboProduct to the shared Product shape for unified ProductCard rendering.
 *  The returned object has an extra `_comboSlug` field so the products page can
 *  pass the correct `/combo-bundles/[slug]` href to ProductCard. */
export function toFrontendCombo(
  c: ComboProduct,
): Product & { _comboSlug: string } {
  return {
    id: c.id,
    name: c.name,
    name_bn: c.name_bn ?? null,
    slug: c.slug,
    // For combos: bundle_price is the final price; original_price is MRP before bundle discount
    price: c.original_price ? Number(c.original_price) : Number(c.bundle_price), // MRP
    discountPrice: c.original_price ? Number(c.bundle_price) : null, // sell price
    description: c.description ?? "",
    shortDescription: c.short_description ?? "",
    image: c.image ?? "",
    images: c.images?.length ? c.images : c.image ? [c.image] : [],
    category: "কম্বো বান্ডেল",
    categorySlug: "combo-bundles",
    rating: 0,
    reviewCount: 0,
    inStock: c.in_stock,
    stockQty: c.stock_qty,
    tags: c.tags ?? [],
    isComboEligible: false,
    isFeatured: c.is_featured,
    _comboSlug: c.slug,
  };
}

export function useComboBundles(
  params: { page?: number; limit?: number; featured?: boolean } = {},
) {
  const { page = 1, limit = 20, featured } = params;
  return useQuery<ComboBundleListResponse>({
    queryKey: ["combo-bundles", { page, limit, featured }],
    queryFn: async () => {
      const q = new URLSearchParams();
      q.set("page", String(page));
      q.set("limit", String(limit));
      if (featured) q.set("featured", "true");
      const { data } = await apiClient.get(`/combo-products?${q.toString()}`);
      return data;
    },
  });
}

export function useComboBundle(slug: string | null | undefined) {
  return useQuery<{ success: boolean; combo: ComboProduct }>({
    queryKey: ["combo-bundle", slug],
    queryFn: async () => {
      const { data } = await apiClient.get(`/combo-products/${slug}`);
      return data;
    },
    enabled: Boolean(slug),
  });
}
