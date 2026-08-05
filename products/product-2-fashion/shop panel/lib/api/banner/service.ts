"use client";

import { api } from "@/lib/api/client";

export type ApiError = {
  flag?: number;
  error?: string;
  message?: string;
};

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

// -----------------------------
// Types
// -----------------------------
export type Banner = {
  id: number;
  title: string;
  zone: string;
  type: string;
  img_path: string;
  path: string;
  featured: boolean;
};

export type BannerListParams = {
  featured?: boolean | 0 | 1;
  zone?: string;
  type?: string;
  limit?: number;
  offset?: number;
};

export type BannerListResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  banners: Banner[];
  error?: string;
  message?: string;
  flag?: number;
};

export type BannerDetailResponse = {
  success: boolean;
  banner?: Banner;
  error?: string;
  message?: string;
  flag?: number;
};

// -----------------------------
// Query Keys
// -----------------------------
export const bannerKeys = {
  all: ["banner"] as const,
  list: (params?: BannerListParams) =>
    [
      ...bannerKeys.all,
      "list",
      params?.featured ?? null,
      params?.zone ?? null,
      params?.type ?? null,
      params?.limit ?? 20,
      params?.offset ?? 0,
    ] as const,
  detail: (id: number) => [...bannerKeys.all, "detail", id] as const,
};

// -----------------------------
// Service
// -----------------------------
class BannerService {
  async getBanners(params?: BannerListParams): Promise<BannerListResponse> {
    try {
      const res = await api.get<BannerListResponse>("/user/banners", { params });
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to load banners"));
    }
  }

  async getBannerById(id: number): Promise<BannerDetailResponse> {
    try {
      const res = await api.get<BannerDetailResponse>(`/user/banner/${id}`);
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to load banner"));
    }
  }
}

export const bannerService = new BannerService();
