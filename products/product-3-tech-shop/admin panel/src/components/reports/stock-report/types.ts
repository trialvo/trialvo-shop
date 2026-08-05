// src/components/reports/stock-report/types.ts

export type TimePeriodKey = "today" | "last7" | "thisMonth" | "thisYear";
export type StockReportTabKey = "dashboard" | "report";

export type StockCategoryLevel = "main" | "sub" | "child";

export type StockMetricKey = "total_active_items" | "in_stock" | "low_stock" | "out_of_stock";

export type StockReportMetric = {
  key: StockMetricKey;
  label: string;
  qty: number;
};

export type StockAlertConfig = {
  active: boolean;
  limit: number;
};

export type StockHealthSummary = {
  totalActiveItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  alert: StockAlertConfig;
};

export type StockCategoryRow = {
  id: string;
  name: string;
  totalSku: number;    // total_variations
  inStock: number;
  lowStock: number;
  outOfStock: number;
};

export type StockTrendPoint = {
  month: string;
  in: number;
  out: number;
};

export type StockCategoryReportRow = {
  sl: number;
  name: string;
  totalSku: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
};
