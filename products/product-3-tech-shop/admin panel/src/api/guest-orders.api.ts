import { api } from "./client";

export type GuestOrderStatus = "pending" | "complete" | "cancelled";

export type GuestOrdersListParams = {
  is_deleted?: boolean;
  status?: GuestOrderStatus;
  search?: string;
  sort_order?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export type GuestOrderListItem = {
  id: string;
  order_id: number | null;
  status: GuestOrderStatus;
  name: string | null;
  email: string | null;
  phone: string | null;
  otp: string | null;
  otp_exp: string | null;
  is_phone_verified: number | boolean;
  profile_img: string | null;
  full_address: string | null;
  city: string | null;
  zip_code: string | null;
  coupon_code: string | null;
  delivery_charge_id: number | null;
  payment_type: "gateway" | "cod" | "mixed" | string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  grand_total: number;
  payment_status: "unpaid" | "partial_paid" | "paid" | string;
  paid_amount: number;
  due_amount: number;
};

export type GuestOrderItem = {
  id: number;
  guest_order_id: string;
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
  final_unit_price: number;
  line_total: number;
  created_at: string;
};

export type GuestOrderDetail = GuestOrderListItem & {
  subtotal: number;
  sku_discount: number;
  coupon_discount: number;
  discount_total: number;
  delivery_charge: number;
  items: GuestOrderItem[];
  coupon: any | null;
  applicable_items: any[];
};

export type GuestOrdersListResponse = {
  success: true;
  guest_orders: GuestOrderListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type GuestOrderDetailResponse = {
  success: true;
  guest_order: GuestOrderDetail;
};

export const guestOrdersKeys = {
  all: ["guest-orders"] as const,
  lists: () => [...guestOrdersKeys.all, "list"] as const,
  list: (params: GuestOrdersListParams) => [...guestOrdersKeys.lists(), params] as const,
  detail: (id: string) => [...guestOrdersKeys.all, "detail", id] as const,
};

function cleanParams(params: GuestOrdersListParams) {
  const out: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    out[k] = v;
  });
  return out as GuestOrdersListParams;
}

function getErrMessage(err: any, fallback: string) {
  return (
    err?.response?.data?.error ??
    err?.response?.data?.message ??
    err?.message ??
    fallback
  );
}

export async function getGuestOrders(params: GuestOrdersListParams) {
  try {
    const res = await api.get<GuestOrdersListResponse>("/admin/guest-orders", {
      params: cleanParams(params),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to load guest orders"));
  }
}

export async function getGuestOrderById(id: string) {
  try {
    const res = await api.get<GuestOrderDetailResponse>(`/admin/guest-order/${id}`);
    return res.data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to load guest order"));
  }
}

export async function updateGuestOrderStatus(id: string, status: GuestOrderStatus) {
  try {
    const res = await api.patch(`/admin/guest-order/${id}/status`, { status });
    const data: any = res.data;
    if (Number.isFinite(Number(data?.flag)) && Number(data.flag) >= 400) {
      throw new Error(data?.error || data?.message || "Failed to update status");
    }
    return data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to update status"));
  }
}

export async function deleteGuestOrder(id: string) {
  try {
    const res = await api.delete(`/admin/guest-order/${id}`);
    const data: any = res.data;
    if (Number.isFinite(Number(data?.flag)) && Number(data.flag) >= 400) {
      throw new Error(data?.error || data?.message || "Failed to delete guest order");
    }
    return data;
  } catch (err: any) {
    throw new Error(getErrMessage(err, "Failed to delete guest order"));
  }
}
