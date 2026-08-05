// src/components/reports/visitor-report/VisitorReportPage.tsx
"use client";

import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import MetricCard from "./MetricCard";
import VisitorsAreaChart from "./VisitorsAreaChart";
import TopViewedProductsCard from "./TopViewedProductsCard";

import type {
  TimePeriodKey,
  VisitorMetric,
  VisitorDayPoint,
  TopViewedProductRow,
} from "./types";
import {
  clampPctText,
  getPeriodRange,
  periodLabel,
  safeNumber,
} from "./visitorUtils";

import {
  getVisitorMetricsReport,
  getVisitorMetricsTrend,
  getVisitorTopViewedProducts,
} from "@/api/visitor-metrics.api";

function usePeriodsOptions() {
  const { t } = useTranslation();
  return [
    { value: "today" as TimePeriodKey, label: t("reports.common.today") },
    { value: "last7" as TimePeriodKey, label: t("reports.common.last7") },
    { value: "thisMonth" as TimePeriodKey, label: t("reports.common.thisMonth") },
    { value: "thisYear" as TimePeriodKey, label: t("reports.common.thisYear") },
  ];
}

export default function VisitorReportPage() {
  const { t } = useTranslation();
  const PERIODS = usePeriodsOptions();
  const [period, setPeriod] = React.useState<TimePeriodKey>("last7");

  const range = React.useMemo(() => getPeriodRange(period), [period]);

  const [topLimit] = React.useState<number>(20);
  const [topOffset, setTopOffset] = React.useState<number>(0);

  // reset pagination when period changes
  React.useEffect(() => {
    setTopOffset(0);
  }, [period]);

  // REPORT
  const reportQuery = useQuery({
    queryKey: ["visitor-metrics", "report"],
    queryFn: () => getVisitorMetricsReport(),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  // TREND (startDate is REQUIRED by API)
  const trendQuery = useQuery({
    queryKey: ["visitor-metrics", "trend", range.startDate, range.endDate],
    queryFn: () =>
      getVisitorMetricsTrend({
        startDate: range.startDate,
        endDate: range.endDate,
      }),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  // TOP VIEWED PRODUCTS
  const topViewedQuery = useQuery({
    queryKey: [
      "visitor-metrics",
      "top-viewed",
      range.startDate,
      range.endDate,
      topLimit,
      topOffset,
    ],
    queryFn: () =>
      getVisitorTopViewedProducts({
        startDate: range.startDate,
        endDate: range.endDate,
        limit: topLimit,
        offset: topOffset,
      }),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });

  const metrics: VisitorMetric[] = React.useMemo(() => {
    const d = reportQuery.data?.data;
    const meta = reportQuery.data?.meta;

    const activeNow = safeNumber(d?.active_now);
    const today = safeNumber(d?.daily?.today);
    const yesterday = safeNumber(d?.daily?.yesterday);
    const growth = clampPctText(d?.daily?.growth ?? "0%");

    const thisWeek = safeNumber(d?.weekly?.this_week);
    const lastWeek = safeNumber(d?.weekly?.last_week);

    const thisMonth = safeNumber(d?.monthly?.this_month);
    const lastMonth = safeNumber(d?.monthly?.last_month);

    const thisYear = safeNumber(d?.yearly?.this_year);
    const lastYear = safeNumber(d?.yearly?.last_year);

    const liveHint = meta?.live_definition
      ? `Live: ${meta.live_definition}`
      : undefined;

    const growthNum = Number(String(growth).replace("%", ""));
    const growthTone =
      Number.isFinite(growthNum) && growthNum < 0
        ? "error"
        : Number.isFinite(growthNum) && growthNum > 0
          ? "success"
          : "muted";

    return [
      {
        key: "active_now",
        label: t("reports.visitorReport.activeNow"),
        valueText: String(activeNow),
        hint: liveHint,
        tone: "brand",
      },
      {
        key: "today",
        label: t("reports.common.today"),
        valueText: String(today),
        hint: t("reports.visitorReport.uniqueVisitors"),
        tone: "muted",
      },
      {
        key: "yesterday",
        label: t("reports.visitorReport.yesterday"),
        valueText: String(yesterday),
        hint: t("reports.visitorReport.uniqueVisitors"),
        tone: "muted",
      },
      {
        key: "growth",
        label: t("reports.visitorReport.dailyGrowth"),
        valueText: growth,
        hint: t("reports.visitorReport.todayVsYesterday"),
        tone: growthTone as any,
      },
      {
        key: "this_week",
        label: t("reports.visitorReport.thisWeek"),
        valueText: String(thisWeek),
        hint: t("reports.visitorReport.uniqueVisitors"),
        tone: "muted",
      },
      {
        key: "last_week",
        label: t("reports.visitorReport.lastWeek"),
        valueText: String(lastWeek),
        hint: t("reports.visitorReport.uniqueVisitors"),
        tone: "muted",
      },
      {
        key: "this_month",
        label: t("reports.common.thisMonth"),
        valueText: String(thisMonth),
        hint: t("reports.visitorReport.uniqueVisitors"),
        tone: "muted",
      },
      {
        key: "last_month",
        label: t("reports.visitorReport.lastMonth"),
        valueText: String(lastMonth),
        hint: t("reports.visitorReport.uniqueVisitors"),
        tone: "muted",
      },
      {
        key: "this_year",
        label: t("reports.common.thisYear"),
        valueText: String(thisYear),
        hint: t("reports.visitorReport.uniqueVisitors"),
        tone: "muted",
      },
      {
        key: "last_year",
        label: t("reports.visitorReport.lastYear"),
        valueText: String(lastYear),
        hint: t("reports.visitorReport.uniqueVisitors"),
        tone: "muted",
      },
    ];
  }, [reportQuery.data]);

  const points: VisitorDayPoint[] = React.useMemo(() => {
    const list = trendQuery.data?.data ?? [];
    return list.map((x) => ({
      date: x.date,
      visitors: safeNumber(x.visitors),
    }));
  }, [trendQuery.data]);

  const trendMetaText = React.useMemo(() => {
    const m = trendQuery.data?.meta;
    if (!m) return undefined;
    return `Total ${m.total_unique_visitors} • Days ${m.total_days}`;
  }, [trendQuery.data]);

  const topRows: TopViewedProductRow[] = React.useMemo(() => {
    const list = topViewedQuery.data?.data ?? [];
    return list.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      viewCount: safeNumber(p.view_count),
      image: p.image || null,
      minPrice: safeNumber(p.min_price),
      lastViewed: p.last_viewed,
    }));
  }, [topViewedQuery.data]);

  const topTotal = safeNumber(topViewedQuery.data?.meta?.total);
  const topMetaLimit = safeNumber(topViewedQuery.data?.meta?.limit) || topLimit;
  const topMetaOffset =
    safeNumber(topViewedQuery.data?.meta?.offset) || topOffset;

  return (
    <div className="w-full px-4 py-6 md:px-8">
      <div
        className={cn(
          "rounded-xl border border-gray-200 dark:border-gray-800",
          "bg-white dark:bg-gray-900",
          "p-4 sm:p-6",
        )}
      >
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {t("reports.visitorReport.title")}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("reports.visitorReport.description")}
            </p>
          </div>

          <div className="w-full lg:w-[260px]">
            <div className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t("reports.common.timePeriod")}
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as TimePeriodKey)}
              className={cn(
                "h-11 w-full rounded-xl border border-gray-200 dark:border-gray-800",
                "bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white",
                "outline-none focus:ring-2 focus:ring-brand-500/30 px-3",
              )}
            >
              {PERIODS.map((p) => (
                <option
                  key={p.value}
                  value={p.value}
                  className="bg-white dark:bg-gray-950"
                >
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Meta line */}
        <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            {t("reports.visitorReport.selected")}:{" "}
            <span className="font-semibold">{periodLabel(period)}</span> •
            {t("reports.common.range")}: <span className="font-semibold">{range.startDate}</span> →{" "}
            <span className="font-semibold">{range.endDate}</span>
          </div>
          <div>
            {t("reports.visitorReport.generated")}:{" "}
            <span className="font-semibold">
              {reportQuery.data?.meta?.generated_at
                ? new Date(reportQuery.data.meta.generated_at).toLocaleString()
                : "—"}
            </span>
          </div>
        </div>

        {/* Error banner */}
        {(reportQuery.isError ||
          trendQuery.isError ||
          topViewedQuery.isError) && (
            <div className="mt-4 rounded-xl border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
              {String(
                (reportQuery.error as any)?.message ||
                (trendQuery.error as any)?.message ||
                (topViewedQuery.error as any)?.message ||
                "Failed to load visitor report",
              )}
            </div>
          )}

        {/* Metrics */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {metrics.slice(0, 10).map((m) => (
            <MetricCard key={m.key} metric={m} />
          ))}
        </div>

        {/* Chart */}
        <div className="mt-6">
          <VisitorsAreaChart
            title={t("reports.visitorReport.visitorTrend")}
            legend={t("reports.visitorReport.uniqueVisitors")}
            points={points}
            metaText={trendMetaText}
          />
        </div>

        {/* Top viewed products */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-12">
            <TopViewedProductsCard
              rows={topRows}
              total={topTotal}
              limit={topMetaLimit}
              offset={topMetaOffset}
              isLoading={topViewedQuery.isLoading || topViewedQuery.isFetching}
              onPrev={() => setTopOffset((p) => Math.max(0, p - topLimit))}
              onNext={() => setTopOffset((p) => p + topLimit)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
