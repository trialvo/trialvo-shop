"use client";

import { api } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";

export type Banner = {
  id: number;
  title: string;
  subtitle?: string | null;
  zone?: string;
  type?: string;
  image?: string;
  img_path?: string;
  path?: string | null;
  link?: string | null;
  featured?: boolean;
  position?: number;
  status?: boolean;
  created_at?: string;
};

type BannerResponse = {
  success: boolean;
  total?: number;
  banners: Banner[];
  data?: Banner[];
  message?: string;
  error?: string;
};

export const bannerKeys = {
  all: ["banners"] as const,
  list: () => [...bannerKeys.all, "list"] as const,
};

export const useBanner = () => {
  const bannersQuery = useQuery({
    queryKey: bannerKeys.list(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<Banner[]> => {
      try {
        const res = await api.get<BannerResponse>("/user/banners");
        const raw = res.data?.banners || res.data?.data || [];
        return Array.isArray(raw) ? raw : [];
      } catch {
        return [];
      }
    },
  });

  return {
    banners: bannersQuery.data ?? [],
    bannersLoading: bannersQuery.isLoading,
    refetchBanners: bannersQuery.refetch,
  };
};
