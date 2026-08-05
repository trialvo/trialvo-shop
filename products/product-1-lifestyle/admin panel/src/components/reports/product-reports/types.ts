export type TimePeriodKey = "today" | "last7" | "thisMonth" | "thisYear";
export type ProductReportsTabKey = "dashboard" | "report";

export type ReportStatus = "active" | "inactive";

export type StockAlertConfig = {
  active: boolean;
  limit: number;
};

export type ProductDashboardSummary = {
  totalActive: number;
  totalInactive: number;
  underLimitStock: number;
  aboveLimitStock: number;
  couponActive: number;
  categoryMain: number;
  categorySub: number;
  categoryChild: number;
  totalBuyingValue: number;
  totalSellingValue: number;
};

export type TopSellingCategoryItem = {
  id: number;
  name: string;
  image?: string | null;
  soldCount: number;
  orderCount: number;
  revenue: number;
};

export type TopSellingCategories = {
  main: TopSellingCategoryItem[];
  sub: TopSellingCategoryItem[];
  child: TopSellingCategoryItem[];
};

export type ProductReportRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryPath: string;
  stockQty: number;
  soldQty: number;
  buying: number;
  selling: number;
  discount: number;
  netRevenue: number;
  revenue: number;
  cost: number;
  profit: number;
  status: ReportStatus;
  updatedAt: string; // YYYY-MM-DD
};

export type PagedMeta = {
  total: number;
  limit: number;
  offset: number;
};

export type SelectOption = { value: string; label: string };
