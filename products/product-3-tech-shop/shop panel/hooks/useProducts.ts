"use client";

import {
  productService,
  type ProductListData,
  type ProductListParams,
  type ProductListItem,
  type ProductDetail,
  type ProductDetailResponse,
  type ProductVariationListItem,
  type ProductVariationsResponse,
  type ProductVariationDetail,
  type ProductVariationDetailResponse,
} from "@/lib/api/product/service";
import AuthCookies from "@/lib/auth/cookies";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import React from "react";

export const productKeys = {
  all: ["product"] as const,

  list: (params?: ProductListParams) => [
    ...productKeys.all,
    "list",
    params?.limit ?? 20,
    params?.offset ?? 0,
    params?.page ?? 1,
    params?.main_category_id ?? null,
    params?.child_category_id ?? null,
    params?.sub_category_id ?? null,
    params?.variant_id ?? null,
    params?.color_id ?? null,
    params?.variant_ids ?? null,
    params?.color_ids ?? null,
    params?.min_price ?? null,
    params?.max_price ?? null,
    params?.search ?? "",
    params?.q ?? "",
    params?.sort_by ?? "",
    params?.sort_order ?? "",
    params?.sort ?? "",
    params?.status ?? true,
    params?.featured ?? null,
    params?.best_deal ?? null,
    params?.free_delivery ?? null,
    params?.in_stock ?? null,
    params?.sizes ?? null,
    params?.colors ?? null,
    params?.brands ?? null,
    params?.brand_id ?? null,
    params?.is_favourite ?? null,
  ],

  infiniteList: (params?: Omit<ProductListParams, "offset" | "page">) => [
    ...productKeys.all,
    "infinite",
    ...productKeys.list(params),
  ],

  detail: (id: number) => [...productKeys.all, "detail", id],
  variations: (productId: number) => [...productKeys.all, "variations", productId],
  variationDetail: (variationId: number) => [...productKeys.all, "variationDetail", variationId],
};

const cleanParams = (params?: ProductListParams): ProductListParams | undefined => {
  if (!params) return undefined;
  const cleaned: Record<string, string | number | boolean | undefined> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value;
    }
  });
  return cleaned as ProductListParams;
};

const extractVariations = (res: ProductVariationsResponse): ProductVariationListItem[] => {
  if (!res?.success) return [];
  if (!Array.isArray(res.data)) return [];
  return res.data;
};

type UseProductOptions = {
  enabled?: boolean;
};

export const useProduct = (params?: ProductListParams, options?: UseProductOptions) => {
  const isAuthenticated = AuthCookies.isAuthenticated();
  const cleanedParams = React.useMemo(() => cleanParams(params), [params]);
  const isListEnabled = options?.enabled ?? true;

  const productsQuery = useQuery({
    queryKey: productKeys.list(cleanedParams),
    enabled: isListEnabled,
    staleTime: 10 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async (): Promise<ProductListData> => {
      const res = await productService.getProducts(cleanedParams);
      if (!res || !Array.isArray(res.products)) {
        return { total: 0, count: 0, products: [], has_more: false };
      }
      return res;
    },
    retry: 2,
    retryDelay: 1000,
  });

  const useProductById = (id: number) =>
    useQuery({
      queryKey: productKeys.detail(id),
      enabled: Number.isFinite(id) && id > 0,
      staleTime: 10 * 1000,
      queryFn: async (): Promise<ProductDetail> => {
        const res: ProductDetailResponse = await productService.getProductById(id);
        if (!res?.success) throw new Error(res?.error || "Failed to load product");
        if (!res.product) throw new Error("Product not found");
        return res.product;
      },
    });

  const useVariations = (productId: number) =>
    useQuery({
      queryKey: productKeys.variations(productId),
      enabled: Number.isFinite(productId) && productId > 0,
      staleTime: 10 * 1000,
      queryFn: async (): Promise<ProductVariationListItem[]> => {
        const res: ProductVariationsResponse = await productService.getVariations(productId);
        if (!res?.success) throw new Error(res?.error || "Failed to load variations");
        return extractVariations(res);
      },
    });

  const useVariationById = (variationId: number) =>
    useQuery({
      queryKey: productKeys.variationDetail(variationId),
      enabled: Number.isFinite(variationId) && variationId > 0,
      staleTime: 10 * 1000,
      queryFn: async (): Promise<ProductVariationDetail> => {
        const res: ProductVariationDetailResponse = await productService.getVariationById(variationId);
        if (!res?.success) throw new Error(res?.error || "Failed to load variation");
        if (!res.data) throw new Error("Variation not found");
        return res.data;
      },
    });

  return {
    products: productsQuery.data?.products ?? [],
    total: productsQuery.data?.total ?? 0,
    count: productsQuery.data?.count ?? 0,
    productsLoading: productsQuery.isLoading,
    productsError: productsQuery.error,
    productsRefetch: productsQuery.refetch,

    useProductById,
    useVariations,
    useVariationById,

    isAuthenticated,
  };
};

export type InfiniteProductsPage = Readonly<{
  products: ProductListItem[];
  total: number;
  count: number;
  /** Next offset for useInfiniteQuery; `null` when no further pages. */
  nextOffset: number | null;
}>;

export type UseInfiniteProductsOptions = Readonly<{
  pageSize?: number;
  enabled?: boolean;
}>;

export type UseInfiniteProductsReturn = Readonly<{
  products: ProductListItem[];
  /** Server-reported catalog total (last page), else loaded count. */
  total: number;
  loadedCount: number;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<unknown>;
  error: Error | null;
  refetch: () => Promise<unknown>;
}>;

type InfiniteProductListParams = Omit<ProductListParams, "offset" | "page">;

/**
 * Offset-based infinite product catalog (react-query `useInfiniteQuery`).
 * Mirrors `useOrderTabs` — flat list + pagination flags for sentinel UIs.
 */
export const useInfiniteProducts = (
  params?: InfiniteProductListParams,
  options?: UseInfiniteProductsOptions,
): UseInfiniteProductsReturn => {
  const pageSize = options?.pageSize ?? 40;
  const enabled = options?.enabled ?? true;

  const cleanedInfParams = React.useMemo(
    () => cleanParams({ ...params, limit: pageSize }),
    [params, pageSize],
  );

  const infiniteQuery = useInfiniteQuery({
    queryKey: productKeys.infiniteList(cleanedInfParams),
    enabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }): Promise<InfiniteProductsPage> => {
      const offset = typeof pageParam === "number" ? pageParam : 0;
      const res = await productService.getProducts({
        ...cleanedInfParams,
        offset,
        limit: pageSize,
      });

      const products = Array.isArray(res?.products) ? res.products : [];
      const total = typeof res?.total === "number" ? res.total : 0;
      const count = typeof res?.count === "number" ? res.count : products.length;

      let nextOffset: number | null = null;
      const next = offset + products.length;

      if (typeof res?.has_more === "boolean") {
        nextOffset = res.has_more ? next : null;
      } else if (total > 0) {
        nextOffset = next < total ? next : null;
      } else if (products.length >= pageSize) {
        // Fallback when API omits total / has_more
        nextOffset = next;
      }

      return { products, total, count, nextOffset };
    },
    getNextPageParam: (lastPage: InfiniteProductsPage) =>
      lastPage.nextOffset ?? undefined,
    staleTime: 10 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });

  const products =
    infiniteQuery.data?.pages.flatMap((page) => page.products) ?? [];
  const lastTotal =
    infiniteQuery.data?.pages
      .map((page) => page.total)
      .filter((t) => t > 0)
      .at(-1) ?? 0;

  return {
    products,
    total: lastTotal > 0 ? lastTotal : products.length,
    loadedCount: products.length,
    isLoading: infiniteQuery.isLoading,
    isFetching: infiniteQuery.isFetching,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: Boolean(infiniteQuery.hasNextPage),
    fetchNextPage: () => infiniteQuery.fetchNextPage(),
    error: infiniteQuery.error ?? null,
    refetch: () => infiniteQuery.refetch(),
  };
};

/* ── Backward-compat aliases ─────────────────────────────────── */

/** @deprecated Use `useProduct` */
export const useProducts = useProduct;

/** @deprecated Prefer `useProductDetail` from `@/hooks/useProductDetail` */
export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["product", "slug", slug],
    enabled: !!slug,
    staleTime: 30 * 1000,
    queryFn: async () => productService.getProductBySlug(slug),
  });
};

/** @deprecated Stub — product reviews are not yet implemented in the API */
export const useProductReviews = (_productId: number) => {
  return { data: [], isLoading: false, error: null };
};

/** @deprecated Stub — related products not yet in hooks */
export const useRelatedProducts = (_productId: number, _category?: string) => {
  return { data: [], isLoading: false, error: null };
};

