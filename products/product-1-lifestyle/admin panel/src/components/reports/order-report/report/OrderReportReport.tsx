"use client";

import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Download, FileDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Pagination } from "@/components/ui";
import { useTranslation } from "react-i18next";

import { getOrderMatricsReport, orderMatricsKeys, type OrderMatricsReportRow } from "@/api/order-matrics.api";
import type { OrderReportRow, TimePeriodKey } from "../types";
import { formatLocalDateTime, periodLabel, startEndByPeriod } from "../dateUtils";
import { exportOrdersAsCsv, exportOrdersAsPrintablePdf } from "../exportUtils";
import OrderReportTable from "./OrderReportTable";

type Props = { period: TimePeriodKey };

type OrderTypeFilter = "all" | "regular" | "guest" | "admin_regular" | "admin_stranger" | "single_page";
type OrderStatusFilter =
  | "all"
  | "new"
  | "approved"
  | "processing"
  | "packaging"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "returned"
  | "cancelled"
  | "on_hold"
  | "trash";
type PaymentStatusFilter = "all" | "unpaid" | "partial_paid" | "paid";
type PaymentTypeFilter = "all" | "cod" | "gateway" | "mixed";

const money = (n: number) => `${Number(n || 0).toLocaleString()}৳`;

function safeNum(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function mapRow(r: OrderMatricsReportRow): OrderReportRow {
  return {
    orderId: String(r.order_id),
    orderType: r.order_type,
    customerName: (r.customer_name ?? "").trim() || "—",
    phone: r.customer_phone ?? "-",
    email: r.customer_email ?? undefined,
    items: safeNum(r.item_count),
    grandTotal: safeNum(r.grand_total),
    totalCost: safeNum(r.total_cost),
    profit: safeNum(r.profit),
    orderStatus: r.order_status,
    paymentStatus: r.payment_status,
    paymentType: r.payment_type,
    placedAt: formatLocalDateTime(r.placed_at),
  };
}

const OrderReportReport: React.FC<Props> = ({ period }) => {
  const { t } = useTranslation();
  const { startDate, endDate } = React.useMemo(() => startEndByPeriod(period), [period]);

  const [query, setQuery] = React.useState("");
  const [orderType, setOrderType] = React.useState<OrderTypeFilter>("all");
  const [orderStatus, setOrderStatus] = React.useState<OrderStatusFilter>("all");
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatusFilter>("all");
  const [paymentType, setPaymentType] = React.useState<PaymentTypeFilter>("all");

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);

  React.useEffect(() => {
    setPage(1);
  }, [period, query, orderType, orderStatus, paymentStatus, paymentType, pageSize]);

  const offset = (page - 1) * pageSize;

  const listQuery = useQuery({
    queryKey: orderMatricsKeys.report({
      startDate,
      endDate,
      order_type: orderType,
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_type: paymentType,
      search: query,
      limit: pageSize,
      offset,
    }),
    queryFn: () =>
      getOrderMatricsReport({
        startDate,
        endDate,
        order_type: orderType,
        order_status: orderStatus,
        payment_status: paymentStatus,
        payment_type: paymentType,
        search: query,
        limit: pageSize,
        offset,
      }),
    placeholderData: keepPreviousData,
  });

  const rows = React.useMemo(() => (listQuery.data?.data ?? []).map(mapRow), [listQuery.data?.data]);
  const totalItems = listQuery.data?.meta.total ?? 0;

  const pageTotals = React.useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.amount += safeNum(r.grandTotal);
        acc.cost += safeNum(r.totalCost);
        acc.profit += safeNum(r.profit);
        return acc;
      },
      { amount: 0, cost: 0, profit: 0 }
    );
  }, [rows]);

  const handleExportCsv = async () => {
    const res = await getOrderMatricsReport({
      startDate,
      endDate,
      order_type: orderType,
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_type: paymentType,
      search: query,
      limit: 5000,
      offset: 0,
    });
    const exportRows = (res.data ?? []).map(mapRow);
    exportOrdersAsCsv(exportRows, `order-report-${startDate}-to-${endDate}.csv`);
  };

  const handleExportPdf = async () => {
    const res = await getOrderMatricsReport({
      startDate,
      endDate,
      order_type: orderType,
      order_status: orderStatus,
      payment_status: paymentStatus,
      payment_type: paymentType,
      search: query,
      limit: 5000,
      offset: 0,
    });
    const exportRows = (res.data ?? []).map(mapRow);
    exportOrdersAsPrintablePdf(exportRows, `Order Report (${periodLabel(period)})`);
  };

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{t("reports.common.allReports")}</div>
            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {t("reports.common.period")}: {periodLabel(period)} • {t("reports.common.range")}: {startDate} → {endDate} • {t("reports.common.total")}: {totalItems}
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap xl:items-center xl:justify-end">
            <div className="relative w-full xl:w-[320px]">
              <Input
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder={t("reports.common.searchPlaceholder")}
                className="h-11 rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 pr-10"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>

            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderTypeFilter)}
              className={cn(
                "h-11 rounded-xl border border-gray-200 dark:border-gray-800",
                "bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white",
                "px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
              )}
            >
              <option value="all">{t("reports.common.allOrderType")}</option>
              <option value="regular">{t("reports.common.regular")}</option>
              <option value="guest">{t("reports.common.guest")}</option>
              <option value="admin_regular">Admin (Registered)</option>
              <option value="admin_stranger">Admin (Stranger)</option>
              <option value="single_page">Single Page</option>
            </select>

            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value as OrderStatusFilter)}
              className={cn(
                "h-11 rounded-xl border border-gray-200 dark:border-gray-800",
                "bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white",
                "px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
              )}
            >
              <option value="all">{t("reports.common.allOrderStatus")}</option>
              <option value="new">{t("reports.common.new")}</option>
              <option value="approved">{t("reports.common.approved")}</option>
              <option value="processing">{t("reports.common.processing")}</option>
              <option value="packaging">{t("reports.common.packaging")}</option>
              <option value="shipped">{t("reports.common.shipped")}</option>
              <option value="out_for_delivery">{t("reports.common.outForDelivery")}</option>
              <option value="delivered">{t("reports.common.delivered")}</option>
              <option value="returned">{t("reports.common.returned")}</option>
              <option value="cancelled">{t("reports.common.cancelled")}</option>
              <option value="on_hold">{t("reports.common.onHold")}</option>
              <option value="trash">{t("reports.common.trash")}</option>
            </select>

            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatusFilter)}
              className={cn(
                "h-11 rounded-xl border border-gray-200 dark:border-gray-800",
                "bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white",
                "px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
              )}
            >
              <option value="all">{t("reports.common.allPaymentStatus")}</option>
              <option value="unpaid">{t("reports.common.unpaid")}</option>
              <option value="partial_paid">{t("reports.common.partialPaid")}</option>
              <option value="paid">{t("reports.common.paid")}</option>
            </select>

            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentTypeFilter)}
              className={cn(
                "h-11 rounded-xl border border-gray-200 dark:border-gray-800",
                "bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white",
                "px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
              )}
            >
              <option value="all">{t("reports.common.allPaymentType")}</option>
              <option value="cod">{t("reports.common.cod")}</option>
              <option value="gateway">{t("reports.common.gateway")}</option>
              <option value="mixed">{t("reports.common.mixed")}</option>
            </select>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="h-11 w-full xl:w-auto"
                startIcon={<Download className="h-4 w-4" />}
                onClick={handleExportCsv}
                type="button"
                disabled={listQuery.isFetching}
              >
                {t("reports.common.exportExcel")}
              </Button>

              <Button
                variant="outline"
                className="h-11 w-full xl:w-auto"
                startIcon={<FileDown className="h-4 w-4" />}
                onClick={handleExportPdf}
                type="button"
                disabled={listQuery.isFetching}
              >
                {t("reports.common.exportPdf")}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label={t("reports.common.thisPageAmount")} value={money(pageTotals.amount)} isLoading={listQuery.isLoading} />
          <StatTile label={t("reports.common.thisPageCost")} value={money(pageTotals.cost)} isLoading={listQuery.isLoading} />
          <StatTile label={t("reports.common.thisPageProfit")} value={money(pageTotals.profit)} isLoading={listQuery.isLoading} />
        </div>
      </div>

      <OrderReportTable rows={rows} isLoading={listQuery.isLoading} />

      <Pagination
        totalItems={totalItems}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[10, 20, 50, 100]}
      />
    </div>
  );
};

function StatTile({ label, value, isLoading }: { label: string; value: string; isLoading?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</div>
      {isLoading ? (
        <div className="mt-2 h-6 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      ) : (
        <div className="mt-1 text-lg font-extrabold text-gray-900 dark:text-white">{value}</div>
      )}
    </div>
  );
}

export default OrderReportReport;
