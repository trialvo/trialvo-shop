import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationBatch = {
  id: number;
  source_type: string;
  source_id: string | null;
  channel: string;
  audience_type: string;
  title: string | null;
  message: string | null;
  status: string;
  total_target: number;
  total_sent: number;
  total_failed: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  announcement_headline: string | null;
  initiated_by_admin_name: string | null;
};

export type NotificationLog = {
  id: number;
  batch_id: number | null;
  channel: "email" | "sms" | "push";
  category: string;
  recipient_type: string;
  recipient_user_id: number | null;
  recipient_admin_id: number | null;
  recipient_email: string | null;
  recipient_phone: string | null;
  device_token: string | null;
  title: string | null;
  message: string | null;
  provider: string | null;
  status: "queued" | "sent" | "failed" | "delivered" | "read" | "cancelled";
  error_message: string | null;
  related_order_id: number | null;
  related_announcement_id: number | null;
  related_contact_message_id: number | null;
  triggered_by_admin_id: number | null;
  sent_at: string | null;
  created_at: string;
  recipient_admin_name: string | null;
  recipient_user_name: string | null;
};

export type LogsParams = {
  channel?: string;
  category?: string;
  recipient_type?: string;
  status?: string;
  batch_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
};

export type BatchesParams = {
  source_type?: string;
  status?: string;
  limit?: number;
  offset?: number;
};

// ─── API functions ────────────────────────────────────────────────────────────

export async function getNotificationBatches(params?: BatchesParams): Promise<{
  total: number;
  data: NotificationBatch[];
}> {
  const res = await api.get("/admin/notifications/batches", { params });
  return { total: res.data.total ?? 0, data: res.data.data ?? [] };
}

export async function getNotificationLogs(params?: LogsParams): Promise<{
  total: number;
  data: NotificationLog[];
}> {
  const res = await api.get("/admin/notifications/logs", { params });
  return { total: res.data.total ?? 0, data: res.data.data ?? [] };
}

// Legacy / channel-specific (kept for compatibility)
export async function getEmailLogs(params?: LogsParams): Promise<{ total: number; data: NotificationLog[] }> {
  const res = await api.get("/admin/notifications/email-logs", { params });
  return { total: res.data.total ?? 0, data: res.data.data ?? [] };
}

export async function getSmsLogs(params?: LogsParams): Promise<{ total: number; data: NotificationLog[] }> {
  const res = await api.get("/admin/notifications/sms-logs", { params });
  return { total: res.data.total ?? 0, data: res.data.data ?? [] };
}

export async function getPushLogs(params?: LogsParams): Promise<{ total: number; data: NotificationLog[] }> {
  const res = await api.get("/admin/notifications/push-logs", { params });
  return { total: res.data.total ?? 0, data: res.data.data ?? [] };
}
