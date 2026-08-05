"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

import type { OrderReportRow } from "../types";

type Props = { rows: OrderReportRow[]; isLoading?: boolean };

const money = (n: number) => `${Number(n || 0).toLocaleString()}৳`;

function OrderStatusBadge({ s, t }: { s: OrderReportRow["orderStatus"]; t: (key: string) => string }) {
  if (s === "delivered") {
    return (
      <Badge size="sm" color="success" variant="light">
        {t("reports.common.delivered")}
      </Badge>
    );
  }
  if (s === "cancelled" || s === "trash") {
    return (
      <Badge size="sm" color="error" variant="light">
        {s === "trash" ? t("reports.common.trash") : t("reports.common.cancelled")}
      </Badge>
    );
  }
  if (s === "returned") {
    return (
      <Badge size="sm" color="warning" variant="light">
        {t("reports.common.returned")}
      </Badge>
    );
  }
  if (s === "on_hold") {
    return (
      <Badge size="sm" color="warning" variant="light">
        {t("reports.common.onHold")}
      </Badge>
    );
  }
  return (
    <Badge size="sm" color="info" variant="light">
      {s.replace(/_/g, " ")}
    </Badge>
  );
}

function PaymentStatusBadge({ s, t }: { s: OrderReportRow["paymentStatus"]; t: (key: string) => string }) {
  if (s === "paid") {
    return (
      <Badge size="sm" color="success" variant="light">
        {t("reports.common.paid")}
      </Badge>
    );
  }
  if (s === "partial_paid") {
    return (
      <Badge size="sm" color="warning" variant="light">
        {t("reports.common.partialPaid")}
      </Badge>
    );
  }
  return (
    <Badge size="sm" color="error" variant="light">
      {t("reports.common.unpaid")}
    </Badge>
  );
}

function PaymentTypeBadge({ s, t }: { s: OrderReportRow["paymentType"]; t: (key: string) => string }) {
  if (s === "gateway") {
    return (
      <Badge size="sm" color="primary" variant="light">
        {t("reports.common.gateway")}
      </Badge>
    );
  }
  if (s === "mixed") {
    return (
      <Badge size="sm" color="warning" variant="light">
        {t("reports.common.mixed")}
      </Badge>
    );
  }
  return (
    <Badge size="sm" color="info" variant="light">
      {t("reports.common.cod")}
    </Badge>
  );
}

const OrderReportTable: React.FC<Props> = ({ rows, isLoading }) => {
  const { t } = useTranslation();
  const skeletonRows = React.useMemo(() => Array.from({ length: 10 }), []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="w-full overflow-hidden rounded-xl">
        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <Table className="min-w-[1400px]">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-950">
                <TableCell
                  isHeader
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 w-[70px]"
                  )}
                >
                  {t("reports.orderReport.thSl")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[140px]"
                >
                  {t("reports.orderReport.thOrderId")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[110px]"
                >
                  {t("reports.orderReport.thType")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[220px]"
                >
                  {t("reports.orderReport.thCustomer")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[160px]"
                >
                  {t("reports.orderReport.thPhone")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[100px] text-right"
                >
                  {t("reports.orderReport.thItems")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[150px] text-right"
                >
                  {t("reports.orderReport.thTotal")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[150px] text-right"
                >
                  {t("reports.orderReport.thCost")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[150px] text-right"
                >
                  {t("reports.orderReport.thProfit")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[150px]"
                >
                  {t("reports.orderReport.thOrderStatus")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[160px]"
                >
                  {t("reports.orderReport.thPayment")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[150px]"
                >
                  {t("reports.orderReport.thMethod")}
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 min-w-[200px]"
                >
                  {t("reports.orderReport.thPlacedAt")}
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading
                ? skeletonRows.map((_, idx) => (
                  <TableRow key={`sk-${idx}`} className="border-t border-gray-100 dark:border-gray-800">
                    {Array.from({ length: 13 }).map((__, cidx) => (
                      <TableCell key={`skc-${idx}-${cidx}`} className="px-4 py-3">
                        <div className="h-4 w-full max-w-[140px] animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
                : rows.map((r, idx) => (
                  <TableRow
                    key={`${r.orderId}-${idx}`}
                    className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.04]"
                  >
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{idx + 1}</TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {r.orderId}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {String(r.orderType ?? "-").toUpperCase()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {r.customerName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">{r.phone}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 text-right">
                      {r.items}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white text-right">
                      {money(r.grandTotal)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 text-right">
                      {money(r.totalCost)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "px-4 py-3 text-sm text-right",
                        r.profit < 0 ? "text-error-600 dark:text-error-400" : "text-gray-700 dark:text-gray-200"
                      )}
                    >
                      {money(r.profit)}
                    </TableCell>
                    <TableCell className="px-4 py-3">{<OrderStatusBadge s={r.orderStatus} t={t} />}</TableCell>
                    <TableCell className="px-4 py-3">{<PaymentStatusBadge s={r.paymentStatus} t={t} />}</TableCell>
                    <TableCell className="px-4 py-3">{<PaymentTypeBadge s={r.paymentType} t={t} />}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{r.placedAt}</TableCell>
                  </TableRow>
                ))}

              {!isLoading && rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={13} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                    {t("reports.common.noData")}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default OrderReportTable;
