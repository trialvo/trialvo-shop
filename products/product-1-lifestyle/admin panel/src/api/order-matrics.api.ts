import { api } from "./client";

export type OrderStatusKey =
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

export type PaymentStatusKey = "unpaid" | "partial_paid" | "paid";
export type PaymentTypeKey = "cod" | "gateway" | "mixed";

export type OrderMatricsDashboardResponse = {
  success: boolean;
  meta: {
    timeframe: string;
    total_records: number;
    total_grand_total: number;
  };
  data: {
    order_status: Record<OrderStatusKey, number>;
    payment_status: Record<PaymentStatusKey, number>;
    payment_methods: Record<PaymentTypeKey, number>;
  };
};

export type OrderMatricsYearlyComparisonResponse = {
  success: boolean;
  meta: {
    years: {
      current: number;
      last: number;
      before_last: number;
    };
    status_filtered: OrderStatusKey[];
  };
  data: Array<{
    month: string; // Jan..Dec
    current_year: number;
    last_year: number;
    before_last_year: number;
  }>;
};

export type OrderMatricsReportRow = {
  order_id: number;
  order_type: "regular" | "guest" | "admin_regular" | "admin_stranger" | "single_page";
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  order_status: OrderStatusKey;
  payment_status: PaymentStatusKey;
  payment_type: PaymentTypeKey;
  placed_at: string; // ISO
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  full_address: string;
  city: string;
  item_count: number;
  total_cost: string; // API returns string
  profit: string; // API returns string
};

export type OrderMatricsReportResponse = {
  success: boolean;
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
  data: OrderMatricsReportRow[];
};

export type OrderMatricsReportParams = {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  order_type?: "all" | "regular" | "guest" | "admin_regular" | "admin_stranger" | "single_page";
  order_status?: "all" | OrderStatusKey;
  payment_status?: "all" | PaymentStatusKey;
  payment_type?: "all" | PaymentTypeKey;
  search?: string;
  limit?: number;
  offset?: number;
};

function cleanParams<T extends Record<string, unknown>>(params: T): Partial<T> {
  const out: Partial<T> = {};
  Object.keys(params).forEach((k) => {
    const v = params[k];
    if (v === undefined || v === null) return;
    if (typeof v === "string" && v.trim() === "") return;
    if (v === "all") return;
    out[k as keyof T] = v as T[keyof T];
  });
  return out;
}

export const orderMatricsKeys = {
  all: ["order-matrics"] as const,
  dashboard: (startDate: string, endDate: string) => [...orderMatricsKeys.all, "dashboard", startDate, endDate] as const,
  yearlyComparison: () => [...orderMatricsKeys.all, "yearly-comparison"] as const,
  report: (params: OrderMatricsReportParams) => [...orderMatricsKeys.all, "report", params] as const,
};

export async function getOrderMatricsDashboard(params: { startDate: string; endDate: string }) {
  const res = await api.get<OrderMatricsDashboardResponse>("/admin/order-matrics/dashboard", {
    params: cleanParams(params),
  });
  return res.data;
}

export async function getOrderMatricsYearlyComparison() {
  const res = await api.get<OrderMatricsYearlyComparisonResponse>("/admin/order-matrics/yearly-comparison");
  return res.data;
}

export async function getOrderMatricsReport(params: OrderMatricsReportParams) {
  const res = await api.get<OrderMatricsReportResponse>("/admin/order-matrics/report", {
    params: cleanParams(params),
  });
  return res.data;
}
