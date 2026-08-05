"use client";

import {
  brandKeys,
  brandService,
  type Brand,
  type BrandListParams,
} from "@/lib/api/brand/service";
import { useQuery } from "@tanstack/react-query";

export const useBrands = (params?: BrandListParams) => {
  const query = useQuery({
    queryKey: brandKeys.list(params),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<Brand[]> => {
      const res = await brandService.getBrands({
        status: true,
        limit: params?.limit ?? 24,
        offset: params?.offset ?? 0,
        ...params,
      });
      return Array.isArray(res.data) ? res.data.filter((b) => b.status) : [];
    },
    retry: 2,
    retryDelay: 1000,
  });

  return {
    brands: query.data ?? [],
    brandsLoading: query.isLoading,
    brandsError: query.error,
    refetchBrands: query.refetch,
  };
};
