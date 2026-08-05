import { api } from "./client";

export type RefundStatus = "pending" | "processing" | "completed" | "failed";

export type OrderRefund = {
  id: number;
  order_id: number;
  amount: number;
  method: string;
  reference: string | null;
  status: RefundStatus;
  note: string | null;
  created_at: string;
};

export type CreateRefundPayload = {
  order_id: number;
  amount: number;
  method: string;
  reference?: string;
  note?: string;
};

export async function createRefund(body: CreateRefundPayload): Promise<{ success: true; refund_id: number }> {
  const res = await api.post("/admin/order/refund", body);
  return res.data;
}

export async function getRefundsForOrder(order_id: number): Promise<OrderRefund[]> {
  const res = await api.get(`/admin/order/${order_id}/refunds`);
  return res.data.data; // { success, data: [] }
}

export async function updateRefundStatus(
  id: number,
  status: RefundStatus
): Promise<{ success: true }> {
  const res = await api.patch(`/admin/order/refund/${id}/status`, { status });
  return res.data;
}
