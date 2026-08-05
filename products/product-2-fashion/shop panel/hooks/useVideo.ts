"use client";

import {
  type VideoListParams,
  type VideoListResponse,
  videoKeys,
  videoService,
} from "@/lib/api/videos/service";
import { useQuery } from "@tanstack/react-query";

const toErrorMessage = (res: { error?: unknown; message?: unknown }, fallback: string) => {
  if (typeof res?.error === "string" && res.error.trim()) return res.error.trim();
  if (typeof res?.message === "string" && res.message.trim()) return res.message.trim();
  return fallback;
};

export const useVideo = (params?: VideoListParams) => {
  const videosQuery = useQuery({
    queryKey: videoKeys.list(params),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<VideoListResponse> => {
      const res = await videoService.getVideos(params);
      if (!res?.success) throw new Error(toErrorMessage(res, "Failed to load videos"));
      return res;
    },
  });

  return {
    videos: videosQuery.data?.data ?? [],
    total: videosQuery.data?.meta?.total ?? 0,
    limit: videosQuery.data?.meta?.limit ?? (params?.limit ?? 20),
    offset: videosQuery.data?.meta?.offset ?? (params?.offset ?? 0),

    videosLoading: videosQuery.isLoading,
    videosError: videosQuery.error,
  };
};
