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

export type Video = {
  id: number;
  product_id: number | null;
  product_name: string;
  label: string;
  video_url: string;
  thumb: string | null;
  path: string;
  created_at: string;
  updated_at: string;
};

export type VideoListParams = {
  limit?: number;
  offset?: number;
};

export type VideoListResponse = {
  success: boolean;
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
  data: Video[];
  error?: string;
  message?: string;
  flag?: number;
};

export const videoKeys = {
  all: ["video"] as const,
  list: (params?: VideoListParams) =>
    [...videoKeys.all, "list", params?.limit ?? 20, params?.offset ?? 0] as const,
};

class VideoService {
  async getVideos(params?: VideoListParams): Promise<VideoListResponse> {
    try {
      const res = await api.get<VideoListResponse>("/videos", { params });
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to load videos"));
    }
  }
}

export const videoService = new VideoService();
