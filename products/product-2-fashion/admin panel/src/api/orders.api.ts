import { api } from "./client";

export type OrdersListParams = {
  order_type?: string;
  customer_phone?: string;
  customer_email?: string;

  order_status?: string;
  payment_status?: string;

  payment_provider?: string;
  payment_type?: string;

  is_fraud?: string;
  min_total?: number;
  max_total?: number;

  date_from?: string;
  date_to?: string;

  /** Filter to only orders assigned to the current admin */
  assigned_to_me?: boolean;
  /** Filter to orders assigned to a specific admin */
  assigned_to_admin_id?: number;

  limit?: number;
  offset?: number;
};

/** Courier provider ids (match UI types) */
export type CourierProviderId =
  | "select"
  | "manual"
  | "sa_paribahan"
  | "pathao"
  | "redx"
  | "delivery_tiger"
  | "sundarban"
  | "steadfast"
  | "paperfly";

export type DispatchCourierProvider =
  | "paperfly"
  | "redx"
  | "pathao"
  | "steadfast";

export const ordersKeys = {
  all: ["orders"] as const,
  lists: () => [...ordersKeys.all, "list"] as const,
  list: (params: OrdersListParams) => [...ordersKeys.lists(), params] as const,
  details: () => [...ordersKeys.all, "detail"] as const,
  detail: (orderId: number | string) =>
    [...ordersKeys.details(), String(orderId)] as const,
};

export type CourierOption = {
  any_auto_available: boolean;
  available_providers: { provider: string; is_auto_available: number }[];
};

export type ApiOrderPayment = {
  id: number;
  order_id: number;
  provider: string;
  transaction_ref: string | null;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string;
};

export type ApiOrderCourier = {
  id: number;
  order_id: number;
  courier_provider: string | null;
  type: string | null;
  is_auto_available: number | null;
  delivery_charge_id: number | null;
  delivery_title: string | null;
  customer_charge: number | null;
  our_charge: number | null;
  weight: number | null;
  tracking_number: string | null;
  courier_phone: string | null;
  note: string | null;
  memo: string | null;
  created_at: string;
  reference_id: number | null;
  raw_response: string | null;
};

export type ApiOrderCoupon = {
  id: number;
  order_id: number;
  coupon_id: number;
  coupon_code: string;
  coupon_title: string;
  discount_type: number;
  discount_value: number;
  discount_amount: number;
  applied_on: string;
  created_at: string;
};

export type ApiOrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  product_sku_id: number;
  product_name: string;
  product_image: string | null;
  color_id: number | null;
  color_name: string | null;
  color_hex: string | null;
  attribute_id: number | null;
  variant_id: number | null;
  variant_name: string | null;
  quantity: number;
  buying_price: number;
  selling_price: number;
  discount: number;
  discount_type: number;
  coupon_code: string | null;
  coupon_discount: number;
  final_unit_price: number;
  line_total: number;
  created_at: string;
  stock_adjusted: number;
  sell_count_adjusted: number;
  weight_kg: number;
  sku?: string | null;
  attribute_name?: string | null;
  brand_name?: string | null;
};

export type ApiOrder = {
  id: number;
  customer_name: string;
  customer_image?: string | null;
  customer_img?: string | null;
  customer_email: string;
  customer_phone: string;

  order_type: string;
  is_fraud: number;
  fraud_test_results?: string | null;

  payment_type: "gateway" | "cod" | "mixed";
  payment_status: "unpaid" | "partial_paid" | "paid";

  subtotal: number;
  discount_total: number;
  sku_discount_total: number;
  bulk_discount_total?: number;
  combo_discount_total?: number;
  cart_wide_discount?: number;
  coupon_discount?: number;
  delivery_charge: number;
  weight_kg_total: number;
  weight_extra_charge: number;
  grand_total: number;

  paid_amount: number;
  due_amount: number;

  order_status:
    | "new"
    | "approved"
    | "processing"
    | "packaging"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "returned"
    | "cancelled"
    | "on_hold"
    | "trash";

  note: string | null;
  created_at: string;

  full_address: string;
  city: string;
  area_name: string | null;
  lm_city_name: string | null;
  location_mapping_id: number | null;
  zip_code: string;

  /** Order assignment fields (V2-017) */
  assigned_to_admin_id: number | null;
  assigned_by_admin_id: number | null;
  assignment_method: "auto" | "manual" | "redistribute" | null;
  assigned_at: string | null;
  assigned_admin_name: string | null;
  assigned_admin_email: string | null;
  assigned_admin_img: string | null;

  items: ApiOrderItem[];
  payments: ApiOrderPayment[];
  couriers: ApiOrderCourier[];
  coupons: ApiOrderCoupon[];
};

export type OrdersListResponse = {
  success: boolean;
  courierOption: CourierOption;
  data: ApiOrder[];
  pagination: { limit: number; offset: number; total: number };
  summary?: {
    total: number;
    new: number;
    delivered: number;
    cancelled: number;
    others: number;
  };
};

export type OrderDetailResponse = {
  success: boolean;
  courierOption: CourierOption;
  data: ApiOrder;
};

export type DispatchCourierRequest = {
  courier_provider: DispatchCourierProvider;
  weight?: number; // kg
};

export type DispatchCourierResponse = {
  success: boolean;
  message: string;
  courier: string;
  tracking_number: string;
  response?: any;
  flag?: number;
  error?: string;
};

export type ManualDispatchRequest = {
  courier_provider: DispatchCourierProvider;
  tracking_number?: string;
  reference_id?: string;
  memo?: string;
  weight?: number; // kg
};

export type ManualDispatchResponse = {
  success: boolean;
  message: string;
  courier: string;
  tracking_number?: string;
  reference_id?: string;
  memo?: string;
  weight?: number;
  flag?: number;
  error?: string;
};

function cleanParams(params: Record<string, any>) {
  const out: Record<string, any> = {};
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out;
}

function getErrMessage(err: any, fallback: string) {
  return (
    err?.response?.data?.error ??
    err?.response?.data?.message ??
    err?.message ??
    fallback
  );
}

/** Lightweight polling gate — returns a monotonic version counter. */
export async function getOrderEventVersion(): Promise<number> {
  try {
    const res = await api.get<{ version: number }>("/admin/orders/event-version");
    return res.data.version;
  } catch {
    // On any error, return -1 to force a full refresh next cycle
    return -1;
  }
}

export async function getAdminOrders(params: OrdersListParams) {
  try {
    const res = await api.get<OrdersListResponse>("/admin/orders", {
      params: cleanParams(params),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to load orders"));
  }
}

export async function getAdminOrderById(orderId: number) {
  try {
    const res = await api.get<OrderDetailResponse>(`/admin/order/${orderId}`);
    return res.data;
  } catch (err: any) {
    // Handles: { flag: 404, error: "Order not found" }
    const msg = getErrMessage(err, "Failed to load order");
    throw new Error(msg);
  }
}

export async function patchOrderPaymentStatus(
  orderId: number,
  newPaymentStatus: "unpaid" | "partial_paid" | "paid",
) {
  try {
    const res = await api.patch(`/admin/order/paymentstatus/${orderId}`, {
      new_payment_status: newPaymentStatus,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to update payment status"));
  }
}

export async function patchOrderStatus(
  orderId: number,
  newStatus: ApiOrder["order_status"],
) {
  try {
    const res = await api.patch(`/admin/order/status/${orderId}`, {
      new_status: newStatus,
    });
    const data: any = res.data;
    if (Number.isFinite(Number(data?.flag)) && Number(data.flag) !== 200) {
      const message =
        data?.error || data?.message || "Failed to update order status";
      throw new Error(message);
    }
    return data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to update order status"));
  }
}

export type UpdateOrderInfoPayload = {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  payment_type: string;
  note?: string;
  full_address: string;
  city: string;
  zip_code: string;
  location_mapping_id?: number | null;
};

export async function updateOrderInfo(
  orderId: number,
  payload: UpdateOrderInfoPayload
) {
  try {
    const res = await api.patch(`/admin/order/info/${orderId}`, payload);
    const data: any = res.data;
    if (Number.isFinite(Number(data?.flag)) && Number(data.flag) !== 200) {
      const message =
        data?.error || data?.message || "Failed to update order info";
      throw new Error(message);
    }
    return data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to update order info"));
  }
}


/** Auto dispatch via API: POST /admin/order/dispatch/:id */
export async function dispatchOrderCourier(
  orderId: number,
  payload: DispatchCourierRequest,
) {
  try {
    const res = await api.post<DispatchCourierResponse>(
      `/admin/order/dispatch/${orderId}`,
      payload,
    );
    const data: any = res.data;
    if (Number.isFinite(Number(data?.flag)) && Number(data.flag) !== 200) {
      const message =
        data?.error || data?.message || "Failed to dispatch courier";
      throw new Error(message);
    }
    return data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to dispatch courier"));
  }
}

/** Manual dispatch via API: POST /admin/order/manualDispatchOrder/:id */
export async function manualDispatchOrder(
  orderId: number,
  payload: ManualDispatchRequest,
) {
  try {
    const res = await api.post<ManualDispatchResponse>(
      `/admin/order/manualDispatchOrder/${orderId}`,
      payload,
    );
    const data: any = res.data;
    if (Number.isFinite(Number(data?.flag)) && Number(data.flag) !== 200) {
      const message =
        data?.error || data?.message || "Failed to manual dispatch courier";
      throw new Error(message);
    }
    return data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to manual dispatch courier"));
  }
}

/** Update order items: PATCH /admin/order/items/:id */
export type UpdateOrderItemPayload = {
  order_item_id: number;
  product_sku_id: number;
  quantity: number;
  discount?: number;
};

export type UpdateOrderItemsPayload = {
  items: UpdateOrderItemPayload[];
  delivery_charge?: number;
  discount_total?: number;
};

export async function updateOrderItems(
  orderId: number,
  payload: UpdateOrderItemsPayload,
) {
  try {
    const res = await api.patch(`/admin/order/items/${orderId}`, payload);
    const data: any = res.data;
    if (Number.isFinite(Number(data?.flag)) && Number(data.flag) !== 200) {
      const message =
        data?.error || data?.message || "Failed to update order items";
      throw new Error(message);
    }
    return data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to update order items"));
  }
}

/* ──────────────────────────────────────────────────────────────────────
   Courier Balance — GET /config/courier/balance/:provider
   ────────────────────────────────────────────────────────────────────── */

export type CourierBalanceResponse = {
  provider: string;
  balance: number;
  currency: string;
  timestamp: string;
};

export async function getCourierBalance(provider: string) {
  try {
    const res = await api.get<CourierBalanceResponse>(
      `/config/courier/balance/${provider}`,
    );
    return res.data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, `Failed to get ${provider} balance`));
  }
}

/* ──────────────────────────────────────────────────────────────────────
   Track Courier — GET /admin/order/track/:order_id
   ────────────────────────────────────────────────────────────────────── */

export type TrackCourierResponse = {
  order_id: number;
  customer: string;
  provider: string;
  tracking_number: string;
  current_internal_status: string;
  courier_live_status: string;
  last_updated: string;
  raw_response: {
    raw_status: string;
    status_code: number;
    updated_at: string;
  };
};

export async function trackOrderCourier(orderId: number) {
  try {
    const res = await api.get<TrackCourierResponse>(
      `/admin/order/track/${orderId}`,
    );
    return res.data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to track courier"));
  }
}

/* ──────────────────────────────────────────────────────────────────────
   V2-019: Order Refund Ledger
   ────────────────────────────────────────────────────────────────────── */

export type RefundMethod = "original_method" | "bank_transfer" | "mobile_banking" | "cash" | "other";
export type RefundStatus = "pending" | "processed" | "failed";

export interface OrderRefund {
  id: number;
  order_id: number;
  order_payment_id: number | null;
  refund_method: RefundMethod;
  refund_amount: number;
  refund_reference: string | null;
  note: string | null;
  refunded_by_admin: number | null;
  refunded_by_name: string | null;
  status: RefundStatus;
  refunded_at: string | null;
  created_at: string;
}

export interface CreateRefundPayload {
  order_id: number;
  order_payment_id?: number;
  refund_method: RefundMethod;
  refund_amount: number;
  refund_reference?: string;
  note?: string;
}

export async function createRefund(payload: CreateRefundPayload) {
  try {
    const res = await api.post("/admin/order/refund", payload);
    return res.data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to create refund"));
  }
}

export async function getRefundsByOrder(orderId: number): Promise<{
  success: boolean;
  data: OrderRefund[];
  summary: { total_refunded: number; total_pending: number };
}> {
  try {
    const res = await api.get(`/admin/order/refund/${orderId}`);
    return res.data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to load refunds"));
  }
}

export async function updateRefundStatus(
  refundId: number,
  payload: { status: RefundStatus; refund_reference?: string; note?: string },
) {
  try {
    const res = await api.patch(`/admin/order/refund/status/${refundId}`, payload);
    return res.data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to update refund status"));
  }
}

export async function syncCourierStatus(orderId: number): Promise<{
  success: boolean;
  updated: boolean;
  courier_raw_status: string;
  previous_status: string;
  new_status: string;
  message: string;
}> {
  const res = await api.post(`/admin/order/sync-courier-status/${orderId}`);
  return res.data;
}

export async function bulkSyncCourierStatus(): Promise<{
  success: boolean;
  checked: number;
  updated: number;
  errors: number;
  message: string;
}> {
  const res = await api.post(`/admin/orders/bulk-sync-courier-status`);
  return res.data;
}

/* ──────────────────────────────────────────────────────────────────────
   Order Status History — GET /admin/orders/status-history?orderId=X
   ────────────────────────────────────────────────────────────────────── */

export type OrderStatusHistoryEntry = {
  id: number;
  order_id: number;
  status_change: { from: string | null; to: string };
  note: string | null;
  created_at: string;
  admin: { id: number; name: string; email: string } | null;
};

export type OrderStatusHistoryResponse = {
  success: boolean;
  meta: { total_count: number; limit: number; offset: number };
  data: OrderStatusHistoryEntry[];
};

export async function getOrderStatusHistory(
  orderId: number | string,
  limit = 20,
): Promise<OrderStatusHistoryResponse> {
  try {
    const res = await api.get<OrderStatusHistoryResponse>(
      `/admin/orders/status-history`,
      { params: { orderId, limit, offset: 0 } },
    );
    return res.data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to load status history"));
  }
}
