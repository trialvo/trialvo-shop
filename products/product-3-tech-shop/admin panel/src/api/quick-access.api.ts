import { api } from "./client";

export type QuickAccessListParams = {
  /**
   * Search query
   * backend: /quickAccess?=&is_pinned=true
   */
  q?: string;
  is_pinned?: boolean;
};

export type ApiQuickAccessItem = {
  id: number;
  title: string;
  is_pinned: boolean;
  img_path: string | null;
  path: string | null;
  sort_order: number | null;
};

export type QuickAccessListResponse = {
  success: boolean;
  count: number;
  quick_access: ApiQuickAccessItem[];
};

export type QuickAccessSingleResponse = {
  success: boolean;
  quick_access: ApiQuickAccessItem;
};

export type UpdateQuickAccessPayload = {
  title?: string;
  is_pinned?: boolean;
  sort_order?: number | null;
  img_path?: string | null;
  path?: string | null;
};

export type UpdateQuickAccessResponse = {
  success: boolean;
  message: string;
};

export const quickAccessKeys = {
  all: ["quickAccess"] as const,
  lists: () => [...quickAccessKeys.all, "list"] as const,
  list: (params: QuickAccessListParams) =>
    [...quickAccessKeys.lists(), params] as const,
  details: () => [...quickAccessKeys.all, "detail"] as const,
  detail: (id: number) => [...quickAccessKeys.details(), id] as const,
};

export async function getQuickAccessList(
  params: QuickAccessListParams = {}
): Promise<QuickAccessListResponse> {
  const res = await api.get("/quickAccess", { params });
  return res.data as QuickAccessListResponse;
}

export async function getQuickAccessById(
  id: number
): Promise<QuickAccessSingleResponse> {
  const res = await api.get(`/quickAccess/${id}`);
  return res.data as QuickAccessSingleResponse;
}

export async function updateQuickAccess(
  id: number,
  payload: UpdateQuickAccessPayload
): Promise<UpdateQuickAccessResponse> {
  const res = await api.put(`/quickAccess/${id}`, payload);
  return res.data as UpdateQuickAccessResponse;
}
