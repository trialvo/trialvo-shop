import { api } from "./client";

export type AssignmentLog = {
  id: number;
  order_id: number;
  action_type: "auto_assign" | "manual" | "redistribute" | "unassign";
  from_admin_id: number | null;
  to_admin_id: number | null;
  changed_by_admin_id: number | null;
  from_admin_name: string | null;
  to_admin_name: string | null;
  changed_by_name: string | null;
  created_at: string;
};

export async function assignOrder(body: {
  order_id: number;
  admin_id: number;
}): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post("/admin/order/assign", body);
  return data;
}

export async function unassignOrder(
  orderId: number
): Promise<{ success: boolean; message: string }> {
  const { data } = await api.delete(`/admin/order/unassign/${orderId}`);
  return data;
}

export async function getAssignmentLogs(params?: {
  order_id?: number;
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; data: AssignmentLog[] }> {
  const { data } = await api.get("/admin/order/assignment-logs", { params });
  return data;
}
