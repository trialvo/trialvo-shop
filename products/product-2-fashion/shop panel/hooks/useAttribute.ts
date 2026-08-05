"use client";

import {
    attributeService,
    type AttributeDetailResponse,
    type AttributeItem,
    type AttributeListParams,
    type AttributeListResponse,
} from "@/lib/api/attribute/service";
import { useQuery } from "@tanstack/react-query";

export const attributeKeys = {
  all: ["attribute"] as const,

  list: (params?: AttributeListParams) =>
    [
      ...attributeKeys.all,
      "list",
      params?.status ?? true,
      params?.limit ?? null,
      params?.offset ?? null,
    ] as const,

  detail: (id: number, status = true) => [...attributeKeys.all, "detail", id, status] as const,
};

const extractList = (res: AttributeListResponse): AttributeItem[] => {
  if (!res?.success) return [];
  if (!Array.isArray(res.data)) return [];
  return res.data;
};

export const useAttribute = (params?: AttributeListParams) => {
  const attributesQuery = useQuery({
    queryKey: attributeKeys.list(params),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<AttributeItem[]> => {
      const res = await attributeService.getAttributes(params);
      if (!res?.success) {
        throw new Error(res?.error || res?.message || "Failed to load attributes");
      }
      return extractList(res);
    },
  });

  const useAttributeById = (id: number, status = true) =>
    useQuery({
      queryKey: attributeKeys.detail(id, status),
      enabled: Number.isFinite(id) && id > 0,
      staleTime: 5 * 60 * 1000,
      queryFn: async (): Promise<AttributeItem> => {
        const res: AttributeDetailResponse = await attributeService.getAttributeById(id, { status });
        if (!res?.success) throw new Error(res?.error || res?.message || "Failed to load attribute");
        if (!res.data) throw new Error("Attribute not found");
        return res.data;
      },
    });

  return {
    attributes: attributesQuery.data ?? [],
    attributesLoading: attributesQuery.isLoading,
    attributesError: attributesQuery.error,

    useAttributeById,
  };
};
