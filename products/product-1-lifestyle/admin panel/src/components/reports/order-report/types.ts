export type TimePeriodKey = "today" | "last7" | "thisMonth" | "thisYear";

export type OrderReportTabKey = "dashboard" | "report";

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

export type OrderReportMetric = {
  key: "total" | "delivered" | "cancelled" | "pending";
  label: string;
  qty: number;
};

export type TodaySummary = {
  total: number;
  delivered: number;
  cancelled: number;
  pending: number;
};

export type DeliveryFlowItem = {
  key: OrderStatusKey;
  label: string;
  qty: number;
  tone: "brand" | "success" | "warning" | "error" | "muted";
};

export type OrderReportRow = {
  orderId: string;
  orderType: "regular" | "guest" | "admin_regular" | "admin_stranger" | "single_page";
  customerName: string;
  phone: string;
  email?: string;

  items: number;

  grandTotal: number;
  totalCost: number;
  profit: number;

  orderStatus: OrderStatusKey;
  paymentStatus: "unpaid" | "partial_paid" | "paid";
  paymentType: "cod" | "gateway" | "mixed";

  placedAt: string; // formatted local
};

export type YearlyBarSeries = {
  year: string;
  values: number[]; // 12 months
};

export type OrderOverall = {
  totalOrderAmount: number;
  totalOrderCost: number;
  totalProfit: number;
};
