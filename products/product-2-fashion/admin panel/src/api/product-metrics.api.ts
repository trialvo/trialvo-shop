import { api } from "./client";

export type ProductMetricsDashboardSummaryResponse = {
  success: boolean;
  stock_alert_config: {
    active: boolean;
    limit: number;
  };
  data: {
    product_status: {
      total_active: number;
      total_inactive: number;
      under_limit_stock: number;
      above_limit_stock: number;
    };
    inventory_valuation: {
      total_buying_value: string;
      total_selling_value: string;
    };
    categories: {
      main: number;
      sub: number;
      child: number;
    };
    coupons: {
      active: number;
    };
  };
};

export type ProductTopSellingCategoriesParams = {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  limit?: number;
  offset?: number;
};

export type ProductTopSellingCategory = {
  id: number;
  name: string;
  image: string | null;
  sold_count: number;
  revenue: string;
  order_count: number;
};

export type ProductTopSellingCategoriesResponse = {
  success: boolean;
  data: {
    main_categories: ProductTopSellingCategory[];
    sub_categories: ProductTopSellingCategory[];
    child_categories: ProductTopSellingCategory[];
  };
};

export type ProductMetricsReportParams = {
  startDate: string;
  endDate: string;
  limit?: number;
  offset?: number;
  main_category_id?: number;
  sub_category_id?: number;
  child_category_id?: number;
  status?: boolean;
  search?: string;
};

export type ProductMetricsReportRow = {
  id: number;
  name: string;
  slug: string;
  last_updated: string;
  is_active: boolean;
  categories: {
    main: { id: number; name: string } | null;
    sub: { id: number; name: string } | null;
    child: { id: number; name: string } | null;
  };
  metrics: {
    quantity_sold: number;
    total_buying_price: string;
    total_selling_price: string;
    total_item_discount: string;
    net_revenue: string;
  };
};

export type ProductMetricsReportResponse = {
  success: boolean;
  timeframe: string;
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
  note?: string;
  data: ProductMetricsReportRow[];
};

export async function getProductMetricsDashboardSummary() {
  const res = await api.get<ProductMetricsDashboardSummaryResponse>(
    "/admin/product-metrics/dashboard-summery"
  );
  return res.data;
}

export async function getProductMetricsTopSellingCategories(params: ProductTopSellingCategoriesParams) {
  const res = await api.get<ProductTopSellingCategoriesResponse>(
    "/admin/product-metrics/top-selling-categories",
    { params }
  );
  return res.data;
}

export async function getProductMetricsReport(params: ProductMetricsReportParams) {
  const res = await api.get<ProductMetricsReportResponse>("/admin/product-metrics/report", {
    params,
  });
  return res.data;
}
