import { api } from "./client";

// ─── Shared pagination response shape ────────────────────────────────────────

export type PaginatedAuditResponse<T> = {
  count: number;
  limit: number;
  next_cursor?: number;
  has_more: boolean;
  data: T[];
};

// ─── Admin Audit ──────────────────────────────────────────────────────────────

export type AdminAuditLog = {
  id: number;
  admin_id: number;
  action: string;
  action_display_name: string | null;
  resource: string | null;
  resource_id: number | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  actor_email: string;
  actor_name: string;
  actor_img_path: string | null;
};

export type AdminAuditLogParams = {
  admin_id?: number;
  target_id?: number;
  action?: string;
  search?: string;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
  limit?: number;     // 20-500, default 100
  cursor?: number;    // cursor-based pagination
  page?: number;      // page-based pagination
};

export type AdminActionKey = {
  action_key: string;
  display_name: string;
};

export async function getAdminAuditLogs(
  params: AdminAuditLogParams
): Promise<PaginatedAuditResponse<AdminAuditLog>> {
  const res = await api.get("/admin/getAuditLogs", { params });
  return res.data; // returns { count, limit, next_cursor, has_more, data: [] } directly
}

export async function getAdminActionKeys(): Promise<AdminActionKey[]> {
  const res = await api.get("/admin/getActionsKey");
  return res.data; // returns bare array directly (no wrapper)
}

// ─── User Audit ───────────────────────────────────────────────────────────────

export type UserAuditLog = {
  id: number;
  user_id: number;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  user_email: string;
  first_name: string | null;
  last_name: string | null;
  user_img_path: string | null;
  action_display_name: string;
};

export type UserAuditLogParams = {
  user_id?: number;
  action?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  cursor?: number;
  page?: number;
};

export type UserActionKey = {
  action_key: string;
  display_name: string;
};

export async function getUserAuditLogs(
  params: UserAuditLogParams
): Promise<PaginatedAuditResponse<UserAuditLog>> {
  const res = await api.get("/admin/getUserAuditLogs", { params });
  return res.data; // returns { count, limit, next_cursor, has_more, data: [] } directly
}

export async function getUserActionKeys(): Promise<UserActionKey[]> {
  const res = await api.get("/admin/getUserActionsKey");
  return res.data; // returns bare array directly (no wrapper)
}
