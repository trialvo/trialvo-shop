"use client";

import {
  bannerKeys,
  bannerService,
  type Banner,
  type BannerDetailResponse,
  type BannerListParams,
  type BannerListResponse,
} from "@/lib/api/banner/service";
import { useQuery } from "@tanstack/react-query";

const toErrorMessage = (
  res: { error?: unknown; message?: unknown },
  fallback: string,
) => {
  if (typeof res?.error === "string" && res.error.trim())
    return res.error.trim();
  if (typeof res?.message === "string" && res.message.trim())
    return res.message.trim();
  return fallback;
};

type UseBannerOptions = {
  enabled?: boolean;
};

export const useBanner = (
  params?: BannerListParams,
  options?: UseBannerOptions,
) => {
  const bannersQuery = useQuery({
    queryKey: bannerKeys.list(params),
    enabled: options?.enabled ?? true,
    staleTime: 15 * 60 * 1000, // 15 min — banners change occasionally
    gcTime: 30 * 60 * 1000, // 30 min garbage collection
    queryFn: async (): Promise<BannerListResponse> => {
      const res = await bannerService.getBanners(params);
      if (!res?.success)
        throw new Error(toErrorMessage(res, "Failed to load banners"));
      return res;
    },
  });

  const useBannerById = (id: number) =>
    useQuery({
      queryKey: bannerKeys.detail(id),
      enabled: Number.isFinite(id) && id > 0,
      staleTime: 15 * 60 * 1000, // 15 min — banners change occasionally
      gcTime: 30 * 60 * 1000, // 30 min garbage collection
      queryFn: async (): Promise<Banner> => {
        const res: BannerDetailResponse = await bannerService.getBannerById(id);
        if (!res?.success)
          throw new Error(toErrorMessage(res, "Failed to load banner"));
        if (!res.banner) throw new Error("Banner not found");
        return res.banner;
      },
    });

  return {
    banners: bannersQuery.data?.banners ?? [],
    total: bannersQuery.data?.total ?? 0,
    limit: bannersQuery.data?.limit ?? params?.limit ?? 20,
    offset: bannersQuery.data?.offset ?? params?.offset ?? 0,

    bannersLoading: bannersQuery.isLoading,
    bannersError: bannersQuery.error,

    useBannerById,
  };
};
