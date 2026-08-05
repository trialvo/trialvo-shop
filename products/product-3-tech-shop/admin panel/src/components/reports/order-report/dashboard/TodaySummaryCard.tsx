"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { TodaySummary } from "../types";

type Props = { summary: TodaySummary; isLoading?: boolean };

const TodaySummaryCard: React.FC<Props> = ({ summary, isLoading }) => {
  const { t } = useTranslation();
  const total = Math.max(1, summary.total);
  const deliveredPct = (summary.delivered / total) * 100;
  const totalPct = 100;

  const pieStyle: React.CSSProperties = {
    background: `conic-gradient(#10B981 0% ${deliveredPct}%, rgba(255,255,255,0.10) ${deliveredPct}% ${totalPct}%)`,
  };

  return (
    <div
      className={cn(
        "h-full rounded-xl border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-white/[0.03]",
        "p-5 sm:p-6"
      )}
    >
      <div className="text-base font-semibold text-gray-900 dark:text-white">{t("reports.orderReport.orderSummary")}</div>
      <div className="mt-4 h-px w-full bg-gray-200 dark:bg-white/10" />

      {isLoading ? (
        <div className="mt-5 h-[220px] w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
          <div className="md:col-span-5 space-y-3">
            <Row label={t("reports.common.total")} value={summary.total} tone="brand" />
            <Row label={t("reports.common.delivered")} value={summary.delivered} tone="success" />
            <Row label={t("reports.orderReport.cancelledTrash")} value={summary.cancelled} tone="error" />
            <Row label={t("reports.orderReport.pending")} value={summary.pending} tone="warning" />
          </div>

          <div className="md:col-span-7 flex items-center justify-center">
            <div className="relative h-[200px] w-[200px]">
              <div className="absolute inset-0 rounded-full" style={pieStyle} />
              <div className="absolute inset-[26px] rounded-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t("reports.common.total")}</div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    {String(summary.total).padStart(2, "0")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "brand" | "success" | "warning" | "error";
}) {
  const valueClass =
    tone === "brand"
      ? "text-brand-500"
      : tone === "success"
        ? "text-success-600 dark:text-success-500"
        : tone === "warning"
          ? "text-amber-600 dark:text-amber-400"
          : "text-error-600 dark:text-error-500";

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}:</div>
      <div className={cn("text-sm font-extrabold", valueClass)}>{String(value).padStart(2, "0")}</div>
    </div>
  );
}

export default TodaySummaryCard;
