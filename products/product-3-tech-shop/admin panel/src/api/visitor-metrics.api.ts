// src/api/visitor-metrics.api.ts
import { api } from "@/api/client";

export type VisitorMetricsReportRes = {
  success: true;
  data: {
    active_now: number;
    daily: {
      today: number;
      yesterday: number;
      growth: string; // "-45.45%"
    };
    weekly: {
      this_week: number;
      last_week: number;
    };
    monthly: {
      this_month: number;
      last_month: number;
    };
    yearly: {
      this_year: number;
      last_year: number;
    };
  };
  meta: {
    generated_at: string;
    live_definition: string;
  };
};

export type VisitorTrendParams = {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
};

export type VisitorTrendRes = {
  success: true;
  meta: {
    startDate: string;
    endDate: string;
    total_days: number;
    total_unique_visitors: number;
  };
  data: Array<{
    date: string; // YYYY-MM-DD
    visitors: number;
  }>;
};

export type VisitorTopViewedProductParams = {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  limit?: number;
  offset?: number;
};

export type VisitorTopViewedProductRes = {
  success: true;
  meta: {
    total: number;
    limit: number;
    offset: number;
    startDate: string;
    endDate: string;
  };
  data: Array<{
    id: number;
    name: string;
    slug: string;
    view_count: number;
    image: string;
    min_price: number;
    last_viewed: string; // ISO
  }>;
};

export type ApiErrorShape = {
  flag?: number;
  error?: string;
};

function pickApiErrorMessage(err: unknown, fallback = "Something went wrong") {
  const anyErr = err as any;
  const msg = (anyErr?.response?.data as ApiErrorShape | undefined)?.error || anyErr?.message || fallback;
  return String(msg);
}

export async function getVisitorMetricsReport() {
  try {
    const res = await api.get<VisitorMetricsReportRes>("/admin/visitor-metrics/report");
    return res.data;
  } catch (e) {
    throw new Error(pickApiErrorMessage(e, "Failed to load visitor report"));
  }
}

export async function getVisitorMetricsTrend(params: VisitorTrendParams) {
  try {
    const res = await api.get<VisitorTrendRes>("/admin/visitor-metrics/trend", { params });
    return res.data;
  } catch (e) {
    throw new Error(pickApiErrorMessage(e, "Failed to load visitor trend"));
  }
}

export async function getVisitorTopViewedProducts(params: VisitorTopViewedProductParams) {
  try {
    const res = await api.get<VisitorTopViewedProductRes>("/admin/visitor-metrics/top-viewd-product", { params });
    return res.data;
  } catch (e) {
    throw new Error(pickApiErrorMessage(e, "Failed to load top viewed products"));
  }
}
