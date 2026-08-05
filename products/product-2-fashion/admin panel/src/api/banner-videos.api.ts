import { api } from "./client";

export type BannerVideoApi = {
  id: number;
  product_id: number | null;
  product_name?: string | null;
  label: string | null;
  video_url: string;
  path: string | null;
  thumb: string | null;
  created_at: string;
  updated_at: string;
};

export type BannerVideosListParams = {
  limit?: number;
  offset?: number;
};

export type BannerVideosListResponse = {
  success: boolean;
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
  data: BannerVideoApi[];
};

export type BannerVideoSingleResponse = {
  success: boolean;
  data: BannerVideoApi;
};

export type CreateBannerVideoPayload = {
  product_id?: number;
  label?: string;
  video_url: string;
  path?: string;
  thumb?: string;
};

export type UpdateBannerVideoPayload = Partial<{
  product_id: number;
  label: string;
  video_url: string;
  path: string;
  thumb: string;
}>;

function compactParams<T extends Record<string, any>>(input: T): Partial<T> {
  const out: Record<string, any> = {};
  Object.entries(input).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out as Partial<T>;
}

export async function getBannerVideos(params?: BannerVideosListParams) {
  const cleaned = params ? compactParams(params) : undefined;
  const hasParams = cleaned && Object.keys(cleaned).length > 0;
  const { data } = await api.get<BannerVideosListResponse>("/videos", {
    params: hasParams ? cleaned : undefined,
  });
  return data;
}

export async function getBannerVideoById(id: number) {
  const { data } = await api.get<BannerVideoSingleResponse>(`/video/byId/${id}`);
  return data;
}

export async function createBannerVideo(payload: CreateBannerVideoPayload) {
  const { data } = await api.post("/admin/video", payload);
  return data;
}

export async function updateBannerVideo(id: number, payload: UpdateBannerVideoPayload) {
  const { data } = await api.put(`/admin/video/${id}`, payload);
  return data;
}

export async function deleteBannerVideo(id: number) {
  const { data } = await api.delete(`/admin/video/${id}`);
  return data;
}
