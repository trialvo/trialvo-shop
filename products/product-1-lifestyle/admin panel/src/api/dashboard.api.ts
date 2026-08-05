import { api } from "./client";

/** =========================
 *  Overview
 *  ========================= */
export type OverviewBucketKey = "today" | "week" | "month" | "year";

export type OverviewNumbers = {
  total_orders: number;
  total_sales: number;
  total_cancelled: number;
  total_views: number;
};

export type OverviewBucket = {
  current: OverviewNumbers;
  last: OverviewNumbers;
  change: OverviewNumbers;
};

export type DashboardOverview = {
  today: OverviewBucket;
  week: OverviewBucket;
  month: OverviewBucket;
  year: OverviewBucket;
};

export type DashboardOverviewResponse = {
  success: boolean;
  overview: DashboardOverview;
};

/** =========================
 *  Shared TimeRange
 *  ========================= */
export type DashboardTimeRange = "today" | "week" | "month" | "year" | "all";

/**
 * Backward-compatible alias used by some dashboard components.
 */
export type TopViewedTimeRange = DashboardTimeRange;

/** =========================
 *  Top Viewed Products
 *  ========================= */
export type DashboardTopViewedItem = {
  id: number;
  name: string;
  slug: string;
  view_count: number;
  image: string | null;
  selling_price: number;
  last_viewed: string | null;
};

export type DashboardTopViewedMeta = {
  timeRange: DashboardTimeRange;
  count: number;
  limit: number;
  offset: number;
};

export type DashboardTopViewedResponse = {
  success: boolean;
  data: DashboardTopViewedItem[];
  meta: DashboardTopViewedMeta;
};

/** =========================
 *  Top Selling Products
 *  ========================= */
export type DashboardCategoryMini = {
  id: number;
  name: string;
};

export type DashboardSellingVariation = {
  id: number;
  sku: string;
  selling_price: number;
  stock: number;
  sell_count: number;
};

export type DashboardTopSellingItem = {
  product_id: number;
  product_name: string;
  first_image: string | null;

  main_category: DashboardCategoryMini | null;
  sub_category: DashboardCategoryMini | null;
  child_category: DashboardCategoryMini | null;

  total_sell_count: number;
  total_in_stock: number;
  variations: DashboardSellingVariation[];
};

export type DashboardTopSellingMeta = {
  timeRange: DashboardTimeRange;
  count: number;
  limit: number;
  offset: number;
};

export type DashboardTopSellingResponse = {
  success: boolean;
  data: DashboardTopSellingItem[];
  meta: DashboardTopSellingMeta;
};

/** =========================
 *  Top Selling Zones (level-1 location_mappings)
 *  ========================= */
export type DashboardTopSellingAreaItem = {
  zone: string;
  total_orders: number;
  total_items_sold: number;
  total_revenue: string; // "18880.00"
};

export type DashboardTopSellingAreaMeta = {
  timeRange: DashboardTimeRange;
  count: number;
  limit: number;
  offset: number;
};

export type DashboardTopSellingAreaResponse = {
  success: boolean;
  data: DashboardTopSellingAreaItem[];
  meta: DashboardTopSellingAreaMeta;
};

/** =========================
 *  Yearly Statistic (Revenue/Profit)
 *  ========================= */
export type DashboardYearlyStatisticItem = {
  month: string; // "Jan"
  revenue: string; // "18530.00"
  profit: string; // "5048.00"
};

export type DashboardYearlyStatisticResponse = {
  success: boolean;
  year: number;
  data: DashboardYearlyStatisticItem[];
};

/** =========================
 *  Low Stock Products (NEW)
 *  ========================= */
export type LowStockVariation = {
  product_variation_id: number;
  sku_code: string;
  color: string;
  variant: string;
  current_stock: number;
};

export type LowStockProductItem = {
  product_id: number;
  name: string;
  low_stock_variations: LowStockVariation[];
};

export type DashboardLowStockResponse = {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  alert_limit_used: number;
  data: LowStockProductItem[];
};

export const dashboardKeys = {
  all: ["dashboard"] as const,

  overview: () => [...dashboardKeys.all, "overview"] as const,

  topViewed: () => [...dashboardKeys.all, "topViewed"] as const,
  topViewedList: (params: {
    timeRange: DashboardTimeRange;
    limit: number;
    offset: number;
  }) => [...dashboardKeys.topViewed(), "list", params] as const,

  topSelling: () => [...dashboardKeys.all, "topSelling"] as const,
  topSellingList: (params: {
    timeRange: DashboardTimeRange;
    limit: number;
    offset: number;
  }) => [...dashboardKeys.topSelling(), "list", params] as const,

  topSellingArea: () => [...dashboardKeys.all, "topSellingArea"] as const,
  topSellingAreaList: (params: {
    timeRange: DashboardTimeRange;
    limit: number;
    offset: number;
  }) => [...dashboardKeys.topSellingArea(), "list", params] as const,

  yearlyStatistic: () => [...dashboardKeys.all, "yearlyStatistic"] as const,
  yearlyStatisticByYear: (year: number) =>
    [...dashboardKeys.yearlyStatistic(), "year", year] as const,

  lowStock: () => [...dashboardKeys.all, "lowStock"] as const,
  lowStockList: (params: { limit: number; offset: number }) =>
    [...dashboardKeys.lowStock(), "list", params] as const,
};

export async function getDashboardOverview(): Promise<DashboardOverviewResponse> {
  const res = await api.get("/admin/dashboard/overview");
  return res.data as DashboardOverviewResponse;
}

export async function getDashboardTopViewed(params: {
  timeRange: DashboardTimeRange;
  limit: number;
  offset: number;
}): Promise<DashboardTopViewedResponse> {
  const res = await api.get("/admin/dashboard/topviewed", { params });
  return res.data as DashboardTopViewedResponse;
}

export async function getDashboardTopSelling(params: {
  timeRange: DashboardTimeRange;
  limit: number;
  offset: number;
}): Promise<DashboardTopSellingResponse> {
  const res = await api.get("/admin/dashboard/topselling", { params });
  return res.data as DashboardTopSellingResponse;
}

export async function getDashboardTopSellingArea(params: {
  timeRange: DashboardTimeRange;
  limit: number;
  offset: number;
}): Promise<DashboardTopSellingAreaResponse> {
  const res = await api.get("/admin/dashboard/topselling-area", { params });
  return res.data as DashboardTopSellingAreaResponse;
}

export async function getDashboardYearlyStatistic(
  year: number,
): Promise<DashboardYearlyStatisticResponse> {
  const res = await api.get("/admin/dashboard/yearly-statistic", {
    params: { year },
  });
  return res.data as DashboardYearlyStatisticResponse;
}

/** ✅ NEW: Low stock products (pagination supported) */
export async function getDashboardLowStockProducts(params: {
  limit: number;
  offset: number;
}): Promise<DashboardLowStockResponse> {
  const res = await api.get("/admin/dashboard/low-stock-products", { params });
  return res.data as DashboardLowStockResponse;
}
