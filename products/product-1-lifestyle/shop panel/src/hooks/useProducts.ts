"use client";

import {
  productService,
  type ProductDetail,
  type ProductDetailResponse,
  type ProductListData,
  type ProductListParams,
  type ProductVariationDetail,
  type ProductVariationDetailResponse,
  type ProductVariationListItem,
  type ProductVariationsResponse,
} from "@/lib/api/product/service";
import AuthCookies from "@/lib/auth/cookies";
import { reviewService } from "@/lib/api/review/service";
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
    params?.in_stock ?? null,
    params?.is_favourite ?? null,
    params?.sizes ?? null,
    params?.colors ?? null,
    params?.brands ?? null,
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

export const useInfiniteProducts = (
  params?: Omit<ProductListParams, "offset" | "page">,
  pageSize: number = 20,
) => {
  const cleanedInfParams = React.useMemo(
    () => cleanParams({ ...params, limit: pageSize }),
    [params, pageSize],
  );

  return useInfiniteQuery({
    queryKey: productKeys.infiniteList(cleanedInfParams),
    enabled: true,
    queryFn: async ({ pageParam = 0 }): Promise<ProductListData> => {
      const apiParams = { ...cleanedInfParams, offset: pageParam, limit: pageSize };
      const res = await productService.getProducts(apiParams);
      if (!res || !Array.isArray(res.products)) {
        return { total: 0, count: 0, products: [], has_more: false };
      }
      const nextOffset = pageParam + pageSize;
      const hasMorePages = res.total ? nextOffset < res.total : (res.has_more ?? false);
      return { ...res, has_more: hasMorePages };
    },
    getNextPageParam: (lastPage: ProductListData, allPages: ProductListData[]) => {
      const currentOffset = (allPages.length - 1) * pageSize;
      const nextOffset = currentOffset + pageSize;
      if (lastPage.has_more) return nextOffset;
      return undefined;
    },
    getPreviousPageParam: () => undefined,
    initialPageParam: 0,
    staleTime: 10 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  });
};

/* ── Backward-compat aliases ─────────────────────────────────── */

/** @deprecated Use `useProduct` */
export const useProducts = useProduct;

/** @deprecated Use `useProduct().useProductById` after resolving slug to id */
export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["product", "slug", slug],
    enabled: !!slug,
    staleTime: 10 * 1000,
    queryFn: async () => {
      // The API fetches by ID, but pages use slug. Fetch product list with search=slug
      const res = await productService.getProducts({ search: slug, limit: 1 });
      if (!res || !Array.isArray(res.products) || res.products.length === 0) {
        throw new Error("Product not found");
      }
      const product = res.products[0];
      // Fetch full detail if we have id
      const detail = await productService.getProductById(product.id);
      if (!detail?.success || !detail.product) throw new Error("Product not found");
      return detail.product;
    },
  });
};

export const useProductReviews = (productId: number) => {
  return useQuery({
    queryKey: ["product", "reviews", productId],
    enabled: Number.isFinite(productId) && productId > 0,
    staleTime: 10 * 1000,
    queryFn: async () => {
      const res = await reviewService.getProductReviews(productId);
      if (!res?.success) throw new Error("Failed to load reviews");
      return res;
    },
  });
};

export const useRelatedProducts = (productId: number, _category?: string) => {
  return useQuery({
    queryKey: productKeys.detail(productId),
    enabled: Number.isFinite(productId) && productId > 0,
    staleTime: 10 * 1000,
    queryFn: async () => {
      const res = await productService.getProductById(productId);
      if (!res?.success || !res.product) throw new Error("Product not found");
      return res.product;
    },
    select: (product) => product.related_products,
  });
};
