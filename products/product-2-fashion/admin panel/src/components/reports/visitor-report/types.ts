// src/components/reports/visitor-report/types.ts
export type TimePeriodKey = "today" | "last7" | "thisMonth" | "thisYear";

export type VisitorMetricKey =
  | "active_now"
  | "today"
  | "yesterday"
  | "growth"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_year";

export type VisitorMetric = {
  key: VisitorMetricKey;
  label: string;
  valueText: string;
  hint?: string;
  tone?: "brand" | "success" | "warning" | "error" | "muted";
};

export type VisitorDayPoint = {
  date: string; // YYYY-MM-DD
  visitors: number;
};

export type TopViewedProductRow = {
  id: number;
  name: string;
  slug: string;
  viewCount: number;
  image?: string | null;
  minPrice: number;
  lastViewed: string; // ISO
};
