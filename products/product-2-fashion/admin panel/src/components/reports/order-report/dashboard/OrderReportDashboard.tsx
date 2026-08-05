"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { TimePeriodKey } from "../types";
import type { OrderStatusKey } from "@/api/order-matrics.api";
import {
  getOrderMatricsDashboard,
  getOrderMatricsReport,
  getOrderMatricsYearlyComparison,
  orderMatricsKeys,
} from "@/api/order-matrics.api";
import { startEndByPeriod } from "../dateUtils";

import MetricCard from "./MetricCard";
import TodaySummaryCard from "./TodaySummaryCard";
import DeliveryFlowCard from "./DeliveryFlowCard";
import OverallCard from "./OverallCard";
import OrdersBarChart from "./OrdersBarChart";

type Props = { period: TimePeriodKey };

function safeNum(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function useLabelForStatus() {
  const { t } = useTranslation();
  return (k: OrderStatusKey) => {
    const map: Record<OrderStatusKey, string> = {
      new: t("reports.common.new"),
      approved: t("reports.common.approved"),
      processing: t("reports.common.processing"),
      packaging: t("reports.common.packaging"),
      shipped: t("reports.common.shipped"),
      out_for_delivery: t("reports.common.outForDelivery"),
      delivered: t("reports.common.delivered"),
      returned: t("reports.common.returned"),
      cancelled: t("reports.common.cancelled"),
      on_hold: t("reports.common.onHold"),
      trash: t("reports.common.trash"),
    };
    return map[k] ?? k;
  };
}

function toneForStatus(k: OrderStatusKey) {
  if (k === "delivered") return "success" as const;
  if (k === "cancelled" || k === "trash") return "error" as const;
  if (k === "returned" || k === "on_hold") return "warning" as const;
  if (k === "new") return "brand" as const;
  return "muted" as const;
}

const OrderReportDashboard: React.FC<Props> = ({ period }) => {
  const { t } = useTranslation();
  const { startDate, endDate } = React.useMemo(() => startEndByPeriod(period), [period]);

  const dashboardQuery = useQuery({
    queryKey: orderMatricsKeys.dashboard(startDate, endDate),
    queryFn: () => getOrderMatricsDashboard({ startDate, endDate }),
    placeholderData: keepPreviousData,
  });

  const yearlyQuery = useQuery({
    queryKey: orderMatricsKeys.yearlyComparison(),
    queryFn: () => getOrderMatricsYearlyComparison(),
    placeholderData: keepPreviousData,
  });

  const totalsQuery = useQuery({
    queryKey: orderMatricsKeys.report({
      startDate,
      endDate,
      limit: 5000,
      offset: 0,
    }),
    queryFn: () =>
      getOrderMatricsReport({
        startDate,
        endDate,
        limit: 5000,
        offset: 0,
      }),
    placeholderData: keepPreviousData,
  });

  const isLoading = dashboardQuery.isLoading || yearlyQuery.isLoading || totalsQuery.isLoading;
  const isError = dashboardQuery.isError || yearlyQuery.isError || totalsQuery.isError;

  const delivery = dashboardQuery.data?.data?.order_status;

  const totalQty = safeNum(dashboardQuery.data?.meta?.total_records);
  const deliveredQty = safeNum(delivery?.delivered);
  const cancelledQty = safeNum(delivery?.cancelled) + safeNum(delivery?.trash);
  const pendingQty = Math.max(0, totalQty - deliveredQty - cancelledQty);

  const labelForStatus = useLabelForStatus();

  const metrics = [
    { key: "total" as const, label: t("reports.orderReport.totalOrders"), qty: totalQty },
    { key: "delivered" as const, label: t("reports.common.delivered"), qty: deliveredQty },
    { key: "cancelled" as const, label: t("reports.orderReport.cancelledTrash"), qty: cancelledQty },
    { key: "pending" as const, label: t("reports.orderReport.pending"), qty: pendingQty },
  ];

  const todaySummary = {
    total: totalQty,
    delivered: deliveredQty,
    cancelled: cancelledQty,
    pending: pendingQty,
  };

  const flowItems = (Object.keys(delivery ?? {}) as OrderStatusKey[]).map((k) => ({
    key: k,
    label: labelForStatus(k),
    qty: safeNum(delivery?.[k]),
    tone: toneForStatus(k),
  }));

  const flowOrder: OrderStatusKey[] = [
    "new",
    "approved",
    "processing",
    "packaging",
    "shipped",
    "out_for_delivery",
    "delivered",
    "returned",
    "cancelled",
    "on_hold",
    "trash",
  ];

  const orderedFlowItems = flowOrder
    .map((k) => flowItems.find((x) => x.key === k))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const overall = React.useMemo(() => {
    const rows = totalsQuery.data?.data ?? [];
    return rows.reduce(
      (acc, r) => {
        acc.totalOrderAmount += safeNum(r.grand_total);
        acc.totalOrderCost += safeNum(r.total_cost);
        acc.totalProfit += safeNum(r.profit);
        return acc;
      },
      { totalOrderAmount: 0, totalOrderCost: 0, totalProfit: 0 }
    );
  }, [totalsQuery.data]);

  const chart = React.useMemo(() => {
    const api = yearlyQuery.data;
    if (!api?.success) return null;
    const years = api.meta.years;

    const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const byMonth = new Map(api.data.map((x) => [x.month, x] as const));

    const current = monthsOrder.map((m) => safeNum(byMonth.get(m)?.current_year));
    const last = monthsOrder.map((m) => safeNum(byMonth.get(m)?.last_year));
    const beforeLast = monthsOrder.map((m) => safeNum(byMonth.get(m)?.before_last_year));

    return {
      years: [String(years.current), String(years.last), String(years.before_last)] as [string, string, string],
      series: [
        { year: String(years.before_last), values: beforeLast },
        { year: String(years.last), values: last },
        { year: String(years.current), values: current },
      ],
    };
  }, [yearlyQuery.data]);

  return (
    <div className="mt-6 space-y-6">
      {isError ? (
        <div className="rounded-xl border border-error-500/30 bg-error-500/10 px-4 py-3 text-sm text-error-700 dark:text-error-300">
          {t("reports.common.failedLoad")}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard key={m.key} qty={m.qty} label={m.label} isLoading={isLoading} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <TodaySummaryCard summary={todaySummary} isLoading={isLoading} />
        </div>

        <div className="lg:col-span-8">
          <DeliveryFlowCard items={orderedFlowItems} isLoading={isLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <OverallCard overall={overall} isLoading={isLoading} />
        </div>

        <div className="lg:col-span-8">
          <OrdersBarChart period={period} chart={chart} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default OrderReportDashboard;
