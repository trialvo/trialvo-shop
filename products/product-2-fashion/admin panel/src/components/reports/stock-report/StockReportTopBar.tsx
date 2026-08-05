"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { StockReportTabKey, TimePeriodKey } from "./types";

type Props = {
  activeTab: StockReportTabKey;
  onTabChange: (t: StockReportTabKey) => void;
  period: TimePeriodKey;
  onPeriodChange: (p: TimePeriodKey) => void;
};

function useStockPeriods() {
  const { t } = useTranslation();
  return [
    { value: "today" as TimePeriodKey, label: t("reports.common.today") },
    { value: "last7" as TimePeriodKey, label: t("reports.common.last7") },
    { value: "thisMonth" as TimePeriodKey, label: t("reports.common.thisMonth") },
    { value: "thisYear" as TimePeriodKey, label: t("reports.common.thisYear") },
  ];
}

const StockReportTopBar: React.FC<Props> = ({ activeTab, onTabChange, period, onPeriodChange }) => {
  const { t } = useTranslation();
  const PERIODS = useStockPeriods();
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
          {t("reports.stockReport.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400" />

        <div className="mt-4 inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => onTabChange("dashboard")}
            className={cn(
              "h-10 px-4 rounded-lg text-sm font-semibold transition",
              activeTab === "dashboard"
                ? "bg-brand-500 text-white shadow-theme-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/[0.04]"
            )}
          >
            {t("reports.common.dashboard")}
          </button>

          <button
            type="button"
            onClick={() => onTabChange("report")}
            className={cn(
              "h-10 px-4 rounded-lg text-sm font-semibold transition",
              activeTab === "report"
                ? "bg-brand-500 text-white shadow-theme-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/[0.04]"
            )}
          >
            {t("reports.common.report")}
          </button>
        </div>
      </div>

      <div className="w-full lg:w-[220px]">
        <div className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{t("reports.common.timePeriod")}</div>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as TimePeriodKey)}
          className={cn(
            "h-11 w-full rounded-xl border border-gray-200 dark:border-gray-800",
            "bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white",
            "outline-none focus:ring-2 focus:ring-brand-500/30 px-3"
          )}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value} className="bg-white dark:bg-gray-950">
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default StockReportTopBar;
