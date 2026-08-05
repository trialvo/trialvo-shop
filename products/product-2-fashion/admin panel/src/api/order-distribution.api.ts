import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────── //

export type DistributionSettings = {
  id: number;
  auto_assign_enabled: boolean;
  strategy: "round_robin";
  assign_on_order_create: boolean;
  include_admin_role: boolean;
  include_order_manager_role: boolean;
  last_assigned_admin_id: number | null;
  updated_by_admin: number | null;
  updated_at: string | null;
};

/** One admin eligible to be in the distribution pool */
export type EligibleAdmin = {
  id: number;
  admin_name: string;
  email: string;
  profile_img_path: string | null;
  is_active: boolean;
  role_name: string;
  role_id: number;
  /** pool_id is null if this admin is NOT currently in the pool */
  pool_id: number | null;
  serial: number | null;
  max_active_orders: number | null;
  pool_auto_assign: boolean | null;
  pool_status: boolean | null;
  /** Orders currently in-flight (non-terminal) */
  active_order_count: number;
  /** Orders assigned into this admin's queue today */
  today_assigned_count: number;
  /** Orders this admin moved to a terminal state today (delivered/cancelled/etc.) */
  today_completed_count: number;
  /** All orders ever assigned to this admin */
  total_assigned_count: number;
};

/** An agent row from the pool table (for existing pool management) */
export type DistributionAgent = {
  id: number;
  admin_id: number;
  admin_name: string;
  admin_email: string;
  serial: number;
  max_active_orders: number | null;
  auto_assign_enabled: boolean;
  status: boolean;
  active_order_count: number;
  today_assigned_count: number;
  today_completed_count: number;
  total_assigned_count: number;
  created_at: string;
};

export type AgentPayload = {
  serial?: number;
  max_active_orders?: number | null;
  auto_assign_enabled?: boolean;
  status?: boolean;
};

// ─── API functions ────────────────────────────────────────────────────────── //

export async function getDistributionSettings(): Promise<{
  success: boolean;
  data: DistributionSettings | null;
}> {
  const { data } = await api.get("/admin/order-distribution/settings");
  return data;
}

export async function updateDistributionSettings(
  body: Partial<Pick<DistributionSettings, "auto_assign_enabled" | "assign_on_order_create" | "include_admin_role" | "include_order_manager_role">>
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.patch("/admin/order-distribution/settings", body);
  return data;
}

export async function getEligibleAdmins(): Promise<{
  success: boolean;
  data: EligibleAdmin[];
}> {
  const { data } = await api.get("/admin/order-distribution/eligible-admins");
  return data;
}

export async function getAgents(): Promise<{
  success: boolean;
  data: DistributionAgent[];
}> {
  const { data } = await api.get("/admin/order-distribution/agents");
  return data;
}

export async function addAgent(body: {
  admin_id: number;
  serial?: number;
  max_active_orders?: number | null;
}): Promise<{ success: boolean; message: string; data: { id: number } }> {
  const { data } = await api.post("/admin/order-distribution/agent", body);
  return data;
}

export async function editAgent(
  id: number,
  body: AgentPayload
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.put(`/admin/order-distribution/agent/${id}`, body);
  return data;
}

export async function removeAgent(id: number): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete(`/admin/order-distribution/agent/${id}`);
  return data;
}

/** Upsert (add/update) an admin's pool membership by admin_id */
export async function upsertAgentByAdminId(
  adminId: number,
  body: AgentPayload
): Promise<{ success: boolean; message: string; pool_id: number }> {
  const { data } = await api.post(
    `/admin/order-distribution/agent/by-admin/${adminId}`,
    body
  );
  return data;
}

/** Bulk redistribute all currently unassigned orders to pool agents */
export async function redistributeUnassigned(): Promise<{
  success: boolean;
  message: string;
  assigned: number;
  skipped: number;
}> {
  const { data } = await api.post("/admin/order-distribution/redistribute-unassigned");
  return data;
}
