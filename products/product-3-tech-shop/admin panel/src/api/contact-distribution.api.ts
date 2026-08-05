// src/api/contact-distribution.api.ts — V2-037
import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────── //

export type ContactDistributionSettings = {
  id: number;
  auto_assign_enabled: boolean;
  assign_on_message_create: boolean;
  include_admin_role: boolean;
  include_order_manager_role: boolean;
  last_assigned_admin_id: number | null;
  updated_by_admin: number | null;
  updated_at: string | null;
};

export type ContactEligibleAdmin = {
  id: number;
  admin_name: string;
  email: string;
  profile_img_path: string | null;
  is_active: boolean;
  role_name: string;
  role_id: number;
  pool_id: number | null;
  serial: number | null;
  max_active_messages: number | null;
  pool_auto_assign: boolean | null;
  pool_status: boolean | null;
  /** Unreplied messages admin still has open */
  active_message_count: number;
  /** Messages assigned to queue today */
  today_assigned_count: number;
  /** Messages this admin replied to or archived today */
  today_completed_count: number;
  /** Lifetime total messages ever assigned to this admin */
  total_assigned_count: number;
};

export type ContactAgentPayload = {
  serial?: number;
  max_active_messages?: number | null;
  auto_assign_enabled?: boolean;
  status?: boolean;
};

// ─── API Functions ────────────────────────────────────────────────────────── //

export async function getContactDistributionSettings(): Promise<{ success: boolean; data: ContactDistributionSettings | null }> {
  const { data } = await api.get("/admin/contact-distribution/settings");
  return data;
}

export async function updateContactDistributionSettings(
  body: Partial<Pick<ContactDistributionSettings, "auto_assign_enabled" | "assign_on_message_create" | "include_admin_role" | "include_order_manager_role">>
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.patch("/admin/contact-distribution/settings", body);
  return data;
}

export async function getContactEligibleAdmins(): Promise<{ success: boolean; data: ContactEligibleAdmin[] }> {
  const { data } = await api.get("/admin/contact-distribution/eligible-admins");
  return data;
}

export async function upsertContactAgent(
  adminId: number,
  body: ContactAgentPayload
): Promise<{ success: boolean; message: string; pool_id: number }> {
  const { data } = await api.post(`/admin/contact-distribution/agent/${adminId}`, body);
  return data;
}

export async function removeContactAgent(adminId: number): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete(`/admin/contact-distribution/agent/${adminId}`);
  return data;
}

export async function redistributeContactMessages(): Promise<{ success: boolean; message: string; assigned: number; skipped: number }> {
  const { data } = await api.post("/admin/contact-distribution/redistribute");
  return data;
}

// ─── V2-038: Manual Assign / Unassign / Logs ─────────────────────────────── //

export type ContactAssignmentLog = {
  id: number;
  message_id: number;
  action_type: "auto_assign" | "manual" | "redistribute" | "unassign";
  from_admin_id: number | null;
  to_admin_id: number | null;
  changed_by_admin_id: number | null;
  from_admin_name: string | null;
  to_admin_name: string | null;
  changed_by_name: string | null;
  created_at: string;
};

export async function manualAssignContactMessage(body: {
  message_id: number;
  admin_id: number;
}): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post("/admin/contact-message/assign", body);
  return data;
}

export async function unassignContactMessage(messageId: number): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete(`/admin/contact-message/unassign/${messageId}`);
  return data;
}

export async function getContactAssignmentLogs(params?: {
  message_id?: number;
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; data: ContactAssignmentLog[] }> {
  const { data } = await api.get("/admin/contact-message/assignment-logs", { params });
  return data;
}
