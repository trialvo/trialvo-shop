"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { TimePeriodKey, StockCategoryLevel, StockCategoryRow, StockHealthSummary, StockReportMetric, StockTrendPoint } from "../types";
import { clampValidTrendYear, getPeriodRange, safeNumber } from "../stockUtils";

import {
  getItemMetricsCategoryStockSummery,
  getItemMetricsDashboardSummery,
  getItemMetricsStockTrend,
} from "@/api/item-metrics.api";

import MetricCard from "./MetricCard";
import StockHealthCard from "./StockHealthCard";
import CategoryStockCard from "./CategoryStockCard";
import StockTrendChart from "./StockTrendChart";

type Props = { period: TimePeriodKey };

function useBuildMetrics() {
  const { t } = useTranslation();
  return (s: StockHealthSummary): StockReportMetric[] => [
    { key: "total_active_items", label: t("reports.stockReport.totalActiveItems"), qty: s.totalActiveItems },
    { key: "in_stock", label: t("reports.stockReport.inStock"), qty: s.inStock },
    { key: "low_stock", label: t("reports.stockReport.lowStock"), qty: s.lowStock },
    { key: "out_of_stock", label: t("reports.stockReport.outOfStock"), qty: s.outOfStock },
  ];
}

function mapCategoryRows(level: StockCategoryLevel, payload: any): StockCategoryRow[] {
  const data = payload?.data;
  if (!data) return [];

  const list =
    level === "main" ? data.main_categories :
      level === "sub" ? data.sub_categories :
        data.child_categories;

  if (!Array.isArray(list)) return [];

  return list.map((x: any) => ({
    id: String(x.id),
    name: String(x.name ?? "-"),
    totalSku: safeNumber(x.metrics?.total_variations),
    inStock: safeNumber(x.metrics?.in_stock),
    lowStock: safeNumber(x.metrics?.low_stock),
    outOfStock: safeNumber(x.metrics?.out_of_stock),
  }));
}

function mapTrendPoints(payload: any): StockTrendPoint[] {
  const list = payload?.data;
  if (!Array.isArray(list)) return [];
  return list.map((x: any) => ({
    month: String(x.month),
    in: safeNumber(x.stock_in),
    out: safeNumber(x.stock_out),
  }));
}

const StockReportDashboard: React.FC<Props> = ({ period }) => {
  const { t } = useTranslation();
  const buildMetrics = useBuildMetrics();
  const range = React.useMemo(() => getPeriodRange(period), [period]);

  // dashboard summery
  const dashQuery = useQuery({
    queryKey: ["item-metrics", "dashboard-summery"],
    queryFn: getItemMetricsDashboardSummery,
  });

  const summary: StockHealthSummary = React.useMemo(() => {
    const d = dashQuery.data?.data;
    const alert = dashQuery.data?.stock_alert_config;

    return {
      totalActiveItems: safeNumber(d?.total_active_items),
      inStock: safeNumber(d?.in_stock),
      lowStock: safeNumber(d?.low_stock),
      outOfStock: safeNumber(d?.out_of_stock),
      alert: {
        active: Boolean(alert?.active),
        limit: safeNumber(alert?.limit),
      },
    };
  }, [dashQuery.data]);

  const metrics = React.useMemo(() => buildMetrics(summary), [summary]);

  // category card state
  const [level, setLevel] = React.useState<StockCategoryLevel>("main");
  const [limit, setLimit] = React.useState<number>(5);
  const [offset, setOffset] = React.useState<number>(0);

  React.useEffect(() => {
    setOffset(0);
  }, [level, period]);

  const catQuery = useQuery({
    queryKey: ["item-metrics", "category-stock-summery", range.startDate, range.endDate, limit, offset],
    queryFn: () => getItemMetricsCategoryStockSummery({ startDate: range.startDate, endDate: range.endDate, limit, offset }),
    placeholderData: keepPreviousData,
  });

  const catRows = React.useMemo(() => mapCategoryRows(level, catQuery.data), [level, catQuery.data]);

  const pageLabel = `${t("reports.common.showing")} ${offset + 1} - ${offset + limit}`;

  // trend (year-based)
  const nowYear = new Date().getFullYear();
  const [year, setYear] = React.useState<number>(clampValidTrendYear(nowYear));

  const trendQuery = useQuery({
    queryKey: ["item-metrics", "stock-trend", year],
    queryFn: () => getItemMetricsStockTrend(year),
  });

  const trendPoints = React.useMemo(() => mapTrendPoints(trendQuery.data), [trendQuery.data]);

  const trendErrorText =
    (trendQuery.error as any)?.response?.data?.error ||
    (trendQuery.error as any)?.message ||
    null;

  return (
    <div className="mt-6 space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.key} qty={m.qty} label={m.label} />
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <StockHealthCard summary={summary} />
        </div>

        <div className="lg:col-span-8">
          <CategoryStockCard
            level={level}
            onLevelChange={setLevel}
            rows={catRows}
            isLoading={catQuery.isLoading || catQuery.isFetching}
            pageLabel={pageLabel}
            onPrev={() => setOffset(Math.max(0, offset - limit))}
            onNext={() => setOffset(offset + limit)}
            disablePrev={offset <= 0 || catQuery.isFetching}
            disableNext={catRows.length < limit || catQuery.isFetching}
          />
        </div>
      </div>

      {/* Trend */}
      <div className="grid grid-cols-1 gap-6">
        <StockTrendChart
          period={period}
          points={trendPoints}
          year={year}
          onYearChange={(y) => setYear(clampValidTrendYear(y))}
          isLoading={trendQuery.isLoading || trendQuery.isFetching}
          errorText={trendErrorText}
        />
      </div>

      {(dashQuery.isError || catQuery.isError) && (
        <div className="rounded-xl border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
          {t("reports.common.failedLoad")}
        </div>
      )}
    </div>
  );
};

export default StockReportDashboard;
