"use client";

import {
  variantService,
  type VariantDetailResponse,
  type VariantItem,
  type VariantListParams,
  type VariantListResponse,
} from "@/lib/api/variant/service";
import { useQuery } from "@tanstack/react-query";

export const variantKeys = {
  all: ["variant"] as const,

  list: (params?: VariantListParams) =>
    [
      ...variantKeys.all,
      "list",
      params?.status ?? true,
      params?.limit ?? null,
      params?.offset ?? null,
      params?.attribute_id ?? null,
    ] as const,

  detail: (id: number, status = true) => [...variantKeys.all, "detail", id, status] as const,
};

const extractList = (res: VariantListResponse): VariantItem[] => {
  if (!res) return [];
  if (!Array.isArray(res.data)) return [];
  return res.data;
};

export const useVariant = (params?: VariantListParams) => {
  const variantsQuery = useQuery({
    queryKey: variantKeys.list(params),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<VariantItem[]> => {
      const res = await variantService.getVariants(params);
      return extractList(res);
    },
  });

  const useVariantById = (id: number, status = true) =>
    useQuery({
      queryKey: variantKeys.detail(id, status),
      enabled: Number.isFinite(id) && id > 0,
      staleTime: 5 * 60 * 1000,
      queryFn: async (): Promise<VariantItem> => {
        const res: VariantDetailResponse = await variantService.getVariantById(id, { status });
        if (!res?.data) throw new Error("Variant not found");
        return res.data;
      },
    });

  return {
    variants: variantsQuery.data ?? [],
    variantsTotal:
      typeof (variantsQuery.dataUpdatedAt) === "number"
        ? undefined
        : undefined,

    variantsLoading: variantsQuery.isLoading,
    variantsError: variantsQuery.error,

    useVariantById,
  };
};
