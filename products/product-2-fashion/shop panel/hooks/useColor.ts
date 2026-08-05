"use client";

import {
  colorService,
  type ColorDetailResponse,
  type ColorItem,
  type ColorListParams,
  type ColorListResponse,
} from "@/lib/api/color/service";
import { useQuery } from "@tanstack/react-query";

export const colorKeys = {
  all: ["color"] as const,

  list: (params?: ColorListParams) =>
    [
      ...colorKeys.all,
      "list",
      params?.name ?? null,
      params?.status ?? null,
      params?.limit ?? null,
      params?.offset ?? null,
    ] as const,

  detail: (id: number) => [...colorKeys.all, "detail", id] as const,
};

const extractList = (res: ColorListResponse): ColorItem[] => {
  if (!res) return [];
  if (!Array.isArray(res.data)) return [];
  return res.data;
};

export const useColor = (params?: ColorListParams) => {
  const colorsQuery = useQuery({
    queryKey: colorKeys.list(params),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ColorItem[]> => {
      const res = await colorService.getColors(params);
      return extractList(res);
    },
  });

  const useColorById = (id: number, status?: boolean) =>
    useQuery({
      queryKey: colorKeys.detail(id),
      enabled: Number.isFinite(id) && id > 0,
      staleTime: 5 * 60 * 1000,
      queryFn: async (): Promise<ColorItem> => {
        const res: ColorDetailResponse = await colorService.getColorById(id, { status });
        if (!res?.data) throw new Error("Color not found");
        return res.data;
      },
    });

  return {
    colors: colorsQuery.data ?? [],
    colorsLoading: colorsQuery.isLoading,
    colorsError: colorsQuery.error,

    useColorById,
  };
};
