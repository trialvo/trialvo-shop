// src/api/item-metrics.api.ts
import { api } from "@/api/client";

export type ApiSuccess<T> = {
  success: boolean;
} & T;

export type StockAlertConfig = {
  active: boolean;
  limit: number;
};

export type ItemDashboardSummeryRes = {
  success: true;
  stock_alert_config: StockAlertConfig;
  data: {
    total_active_items: number;
    in_stock: number;
    out_of_stock: number;
    low_stock: number;
  };
};

export type CategoryStockMetrics = {
  total_variations: number;
  in_stock: number;
  out_of_stock: number;
  low_stock: number;
};

export type CategoryStockSummeryRes = {
  success: true;
  data: {
    main_categories: Array<{
      id: number;
      name: string;
      metrics: CategoryStockMetrics;
    }>;
    sub_categories: Array<{
      id: number;
      name: string;
      main_category_id: number;
      metrics: CategoryStockMetrics;
    }>;
    child_categories: Array<{
      id: number;
      name: string;
      main_category_id: number;
      sub_category_id: number;
      metrics: CategoryStockMetrics;
    }>;
  };
};

export type StockTrendRes = {
  success: true;
  year: number;
  data: Array<{
    month: string; // Jan..Dec
    stock_in: number;
    stock_out: number;
  }>;
};

export type StockTrendError = {
  flag: number;
  error: string;
};

export type CategoryStockSummeryParams = {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  limit?: number;
  offset?: number;
};

export async function getItemMetricsDashboardSummery() {
  const res = await api.get<ItemDashboardSummeryRes>("/admin/item-metrics/dashboard-summery");
  return res.data;
}

export async function getItemMetricsCategoryStockSummery(params: CategoryStockSummeryParams) {
  const res = await api.get<CategoryStockSummeryRes>("/admin/item-metrics/category-stock-summery", { params });
  return res.data;
}

export async function getItemMetricsStockTrend(year: number) {
  const res = await api.get<StockTrendRes>("/admin/item-metrics/stock-trend", { params: { year } });
  return res.data;
}
