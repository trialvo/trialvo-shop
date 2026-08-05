import { api } from "./client";


export type BannerApi = {
  id: number;
  title: string;
  zone: string;
  type: string;
  img_path: string | null;
  path: string | null;

  status: boolean;
  featured: boolean;

  created_at: string;
  updated_at: string;
};

export type GetBannersParams = {
  search?: string;
  zone?: string;
  type?: string;

  status?: 0 | 1 | 5;
  featured?: 0 | 1 | 2;

  limit?: number;
  offset?: number;

  sort_by?: string;
  sort_order?: "asc" | "desc";
};

export type GetBannersResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  banners: BannerApi[];
};

export type GetBannerResponse = {
  success: boolean;
  banner: BannerApi;
};

export type CreateBannerInput = {
  banner_img: File;
  title: string;
  zone: string;
  type: string;

  // ✅ new
  path: string | null;

  status: boolean;
  featured: boolean;
};

export type UpdateBannerPatch = Partial<{
  banner_img: File;
  title: string;
  zone: string;
  type: string;

  // ✅ new
  path: string | null;

  status: boolean;
  featured: boolean;
}>;

function hasOwn(obj: object, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function compactParams<T extends Record<string, any>>(input: T): Partial<T> {
  const out: Record<string, any> = {};
  Object.entries(input).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out as Partial<T>;
}

function buildFormDataForPatch(patch: UpdateBannerPatch) {
  const fd = new FormData();

  // NOTE: include ONLY keys that exist in patch (supports false / null)
  if (hasOwn(patch, "banner_img") && patch.banner_img) {
    fd.append("banner_img", patch.banner_img);
  }
  if (hasOwn(patch, "title")) fd.append("title", String(patch.title ?? ""));
  if (hasOwn(patch, "zone")) fd.append("zone", String(patch.zone ?? ""));
  if (hasOwn(patch, "type")) fd.append("type", String(patch.type ?? ""));

  // ✅ path included only if provided (can be null)
  if (hasOwn(patch, "path")) {
    // multipart can't send real null, so send empty string for null -> backend should store null
    fd.append("path", patch.path == null ? "" : String(patch.path));
  }

  if (hasOwn(patch, "status")) fd.append("status", String(Boolean(patch.status)));
  if (hasOwn(patch, "featured")) fd.append("featured", String(Boolean(patch.featured)));

  return fd;
}

// ✅ Initial call: GET /banners (NO QUERY)
// Only send params if user applied something.
export async function getBanners(params?: GetBannersParams) {
  const cleaned = params ? compactParams(params) : undefined;
  const hasParams = cleaned && Object.keys(cleaned).length > 0;

  const { data } = await api.get<GetBannersResponse>("/banners", {
    params: hasParams ? cleaned : undefined,
  });

  return data;
}

export async function getBannerById(id: number) {
  const { data } = await api.get<GetBannerResponse>(`/banner/${id}`);
  return data;
}

export async function createBanner(input: CreateBannerInput) {
  const fd = new FormData();
  fd.append("banner_img", input.banner_img);
  fd.append("title", input.title);
  fd.append("zone", input.zone);
  fd.append("type", input.type);

  // ✅ always include path on create
  fd.append("path", input.path == null ? "" : String(input.path));

  fd.append("status", String(Boolean(input.status)));
  fd.append("featured", String(Boolean(input.featured)));

  const { data } = await api.post(`/banner`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function updateBanner(id: number, patch: UpdateBannerPatch) {
  const fd = buildFormDataForPatch(patch);

  const { data } = await api.put(`/banner/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteBanner(id: number) {
  const { data } = await api.delete(`/banner/${id}`);
  return data;
}
