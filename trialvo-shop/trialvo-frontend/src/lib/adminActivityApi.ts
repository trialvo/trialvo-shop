import { api } from '@/lib/api';
import type { AdminRole } from '@/lib/adminStaffApi';

export interface ActivityActor {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AdminRole | string | null;
}

export interface ActivityLogItem {
  id: number;
  admin_id: string | null;
  action: string;
  resource: string | null;
  resource_id: string | null;
  summary: string | null;
  meta: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_email: string | null;
  admin_name: string | null;
  admin_role: string | null;
}

export interface ActivityLogListParams {
  admin_id?: string;
  action?: string;
  resource?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ActivityLogListResponse {
  items: ActivityLogItem[];
  total: number;
  page: number;
  limit: number;
  actors?: ActivityActor[];
}

function toQuery(params: ActivityLogListParams): string {
  const q = new URLSearchParams();
  if (params.admin_id) q.set('admin_id', params.admin_id);
  if (params.action) q.set('action', params.action);
  if (params.resource) q.set('resource', params.resource);
  if (params.search) q.set('search', params.search);
  if (params.date_from) q.set('date_from', params.date_from);
  if (params.date_to) q.set('date_to', params.date_to);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const qs = q.toString();
  return qs ? `?${qs}` : '';
}

export const adminActivityApi = {
  list: (params: ActivityLogListParams = {}) =>
    api.get<ActivityLogListResponse>(`/admin/activity-logs${toQuery(params)}`),
  actions: () => api.get<{ actions: string[] }>('/admin/activity-logs/actions'),
  resources: () => api.get<{ resources: string[] }>('/admin/activity-logs/resources'),
};
