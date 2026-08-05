"use client";

import {
  bannerKeys,
  bannerService,
  type Banner,
  type BannerListParams,
} from "@/lib/api/banner/service";
import { useQuery } from "@tanstack/react-query";

export const useBanners = (params?: BannerListParams) => {
  const query = useQuery({
    queryKey: bannerKeys.list(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<Banner[]> => {
      const res = await bannerService.getBanners(params);
      if (!res?.success || !Array.isArray(res.banners)) return [];
      return res.banners;
    },
    retry: 2,
    retryDelay: 1000,
  });

  return {
    banners: query.data ?? [],
    bannersLoading: query.isLoading,
    bannersError: query.error,
    refetchBanners: query.refetch,
  };
};
