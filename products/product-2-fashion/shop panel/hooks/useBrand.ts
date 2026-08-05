"use client";

import {
    brandService,
    type BrandDetailResponse,
    type BrandItem,
    type BrandListParams,
    type BrandListResponse,
} from "@/lib/api/brand/service";
import { useQuery } from "@tanstack/react-query";

export const brandKeys = {
  all: ["brand"] as const,

  list: (params?: BrandListParams) =>
    [
      ...brandKeys.all,
      "list",
      params?.status ?? true,
      params?.limit ?? null,
      params?.offset ?? null,
    ] as const,

  detail: (id: number, status = true) => [...brandKeys.all, "detail", id, status] as const,
};

const extractList = (res: BrandListResponse): BrandItem[] => {
  if (!res?.success) return [];
  if (!Array.isArray(res.data)) return [];
  return res.data;
};

export const useBrand = (params?: BrandListParams) => {
  const brandsQuery = useQuery({
    queryKey: brandKeys.list(params),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<BrandItem[]> => {
      const res = await brandService.getBrands(params);
      if (!res?.success) throw new Error(res?.error || res?.message || "Failed to load brands");
      return extractList(res);
    },
  });

  const useBrandById = (id: number, status = true) =>
    useQuery({
      queryKey: brandKeys.detail(id, status),
      enabled: Number.isFinite(id) && id > 0,
      staleTime: 5 * 60 * 1000,
      queryFn: async (): Promise<BrandItem> => {
        const res: BrandDetailResponse = await brandService.getBrandById(id, { status });
        if (!res?.success) throw new Error(res?.error || res?.message || "Failed to load brand");
        if (!res.data) throw new Error("Brand not found");
        return res.data;
      },
    });

  return {
    brands: brandsQuery.data ?? [],
    brandsLoading: brandsQuery.isLoading,
    brandsError: brandsQuery.error,

    useBrandById,
  };
};
