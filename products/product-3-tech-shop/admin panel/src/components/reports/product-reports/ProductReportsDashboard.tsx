"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import type { TimePeriodKey } from "./types";
import { getPeriodRange, parseMoney } from "./reportUtils";
import {
  getProductMetricsDashboardSummary,
  getProductMetricsTopSellingCategories,
} from "@/api/product-metrics.api";

import ProductReportMetricCard from "./dashboard/ProductReportMetricCard";
import StockAlertCard from "./dashboard/StockAlertCard";
import InventoryValuationCard from "./dashboard/InventoryValuationCard";
import CategoryCountsCard from "./dashboard/CategoryCountsCard";
import TopSellingCategoriesCard from "./dashboard/TopSellingCategoriesCard";

type Props = { period: TimePeriodKey };

const ProductReportsDashboard: React.FC<Props> = ({ period }) => {
  const { t } = useTranslation();
  const range = React.useMemo(() => getPeriodRange(period), [period]);

  const summaryQuery = useQuery({
    queryKey: ["product-metrics", "dashboard-summery"],
    queryFn: getProductMetricsDashboardSummary,
  });

  const topSellingQuery = useQuery({
    queryKey: ["product-metrics", "top-selling-categories", range.startDate, range.endDate],
    queryFn: () =>
      getProductMetricsTopSellingCategories({
        startDate: range.startDate,
        endDate: range.endDate,
        limit: 5,
        offset: 0,
      }),
    enabled: Boolean(range.startDate && range.endDate),
  });

  const isLoading = summaryQuery.isLoading || topSellingQuery.isLoading;
  const isError = Boolean(summaryQuery.error || topSellingQuery.error);

  const summary = summaryQuery.data?.data;
  const stockAlert = summaryQuery.data?.stock_alert_config;

  const metricCards = React.useMemo(() => {
    const s = summary;
    if (!s) return [];

    return [
      { key: "active", label: t("reports.productReport.active"), qty: s.product_status.total_active },
      { key: "inactive", label: t("reports.productReport.inactive"), qty: s.product_status.total_inactive },
      { key: "under", label: t("reports.productReport.lowStock"), qty: s.product_status.under_limit_stock },
      { key: "above", label: t("reports.productReport.inStock"), qty: s.product_status.above_limit_stock },
      { key: "coupon", label: t("reports.productReport.active") + " Coupons", qty: s.coupons.active },
    ];
  }, [summary]);

  const inventoryBuying = parseMoney(summary?.inventory_valuation.total_buying_value);
  const inventorySelling = parseMoney(summary?.inventory_valuation.total_selling_value);

  const topData = topSellingQuery.data?.data;

  return (
    <div className="mt-6 space-y-6">
      {isError && (
        <div className="rounded-xl border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
          {t("reports.common.failedLoad")}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metricCards.map((m) => (
          <ProductReportMetricCard key={m.key} qty={m.qty} label={m.label} isLoading={isLoading} />
        ))}
        {metricCards.length === 0 &&
          Array.from({ length: 5 }).map((_, i) => (
            <ProductReportMetricCard key={`sk-${i}`} qty={0} label="-" isLoading />
          ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <StockAlertCard config={stockAlert ?? null} isLoading={summaryQuery.isLoading} />
        </div>
        <div className="lg:col-span-4">
          <InventoryValuationCard
            totalBuyingValue={inventoryBuying}
            totalSellingValue={inventorySelling}
            isLoading={summaryQuery.isLoading}
          />
        </div>
        <div className="lg:col-span-4">
          <CategoryCountsCard
            main={summary?.categories.main ?? 0}
            sub={summary?.categories.sub ?? 0}
            child={summary?.categories.child ?? 0}
            isLoading={summaryQuery.isLoading}
          />
        </div>
      </div>

      <TopSellingCategoriesCard
        isLoading={topSellingQuery.isLoading}
        main={topData?.main_categories ?? []}
        sub={topData?.sub_categories ?? []}
        child={topData?.child_categories ?? []}
      />
    </div>
  );
};

export default ProductReportsDashboard;
