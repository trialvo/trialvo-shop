// src/api/contact-messages.api.ts
import { api } from "./client";

export type ContactMessageCounts = {
  total: number;
  unread: number;
  unreplied: number;
  read_but_not_replied: number;
  archived: number; // V2-037
};

export type ContactMessage = {
  id: number;
  user_id: number | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string | null;
  is_read: 0 | 1;
  is_replied: 0 | 1;
  /** 1 = active, 0 = archived (based on your responses) */
  status: 0 | 1;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user_avatar: string | null;
  user_account_status: string | null;
};

export type ContactMessageReply = {
  id: number;
  message_id: number;
  reply_text: string;
  type: "email" | "sms";
  created_at: string;
};

export type ContactMessageSingle = {
  id: number;
  user_id: number | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string | null;
  is_read: 0 | 1;
  is_replied: 0 | 1;
  status: 0 | 1;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  registered_first_name: string | null;
  registered_last_name: string | null;
  user_avatar: string | null;
  total_spent: number | null;
  total_orders: number;
  replies: ContactMessageReply[];
};

export type ContactMessageStatusFilter = "all" | "active" | "archived";
export type ContactMessageBoolFilter = "all" | "true" | "false";

export type GetContactMessagesParams = {
  status?: ContactMessageStatusFilter;
  offset?: number;
  limit?: number;
  subject?: string;
  search?: string;
  is_read?: ContactMessageBoolFilter;
  is_replied?: ContactMessageBoolFilter;
  assigned_to_me?: boolean; // bell dropdown filter
};

export type GetContactMessagesResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  data: ContactMessage[];
};

export async function getContactMessageCounts(): Promise<{
  success: boolean;
  data: ContactMessageCounts;
}> {
  const res = await api.get("/admin/contact-messages/counts");
  return res.data;
}

function normalizeStatusParam(
  status: ContactMessageStatusFilter | undefined
): string | undefined {
  if (!status || status === "all") return undefined;
  // Your sample query uses status=false for archived. We'll keep that behavior.
  return status === "archived" ? "false" : "true";
}

function normalizeBoolFilterParam(
  v: ContactMessageBoolFilter | undefined
): string | undefined {
  if (!v || v === "all") return undefined;
  return v;
}

export async function getContactMessages(
  params: GetContactMessagesParams
): Promise<GetContactMessagesResponse> {
  const subject =
    params.subject && params.subject.trim().length > 0 ? params.subject.trim() : undefined;
  const search =
    params.search && params.search.trim().length > 0 ? params.search.trim() : undefined;
  const queryParams: Record<string, string | number | boolean | undefined> = {
    status: normalizeStatusParam(params.status),
    offset: params.offset,
    limit: params.limit,
    subject,
    search,
    is_read: normalizeBoolFilterParam(params.is_read),
    is_replied: normalizeBoolFilterParam(params.is_replied),
    assigned_to_me: params.assigned_to_me || undefined,
  };
  const res = await api.get("/admin/contact-messages", {
    params: queryParams,
  });
  return res.data;
}

export async function getContactMessage(
  id: number
): Promise<{ success: boolean; data: ContactMessageSingle }> {
  const res = await api.get(`/admin/contact-message/${id}`);
  return res.data;
}

export async function toggleContactMessageStatus(id: number): Promise<{
  success: boolean;
  message: string;
  data: { id: number; status: 0 | 1 };
}> {
  const res = await api.patch(`/admin/contact-message/${id}/toggle-status`);
  return res.data;
}

export async function deleteContactMessage(id: number): Promise<{
  success: boolean;
  message: string;
}> {
  const res = await api.delete(`/admin/contact-message/${id}`);
  return res.data;
}

export type ReplyContactMessagePayload = {
  message_id: number;
  reply_text: string;
  type: "email" | "sms";
};

export async function replyContactMessage(
  payload: ReplyContactMessagePayload
): Promise<{ success: boolean; message: string } & Record<string, unknown>> {
  const res = await api.post("/admin/contact-message/reply", payload);
  return res.data;
}

// V2-036: Assign a contact message to an admin
export async function assignContactMessage(
  id: number,
  admin_id: number
): Promise<{ success: boolean; message: string }> {
  const res = await api.patch(`/admin/contact-message/${id}/assign`, { admin_id });
  return res.data;
}

// V2: Mark all contact messages as read (bell clear button)
export async function markAllContactMessagesRead(): Promise<{ success: boolean; message: string }> {
  const res = await api.post("/admin/contact-messages/mark-all-read");
  return res.data;
}
