"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type Props = {
  config: { active: boolean; limit: number } | null;
  isLoading?: boolean;
};

const StockAlertCard: React.FC<Props> = ({ config, isLoading }) => {
  const { t } = useTranslation();
  const active = config?.active ?? false;
  const limit = config?.limit ?? 0;

  return (
    <div
      className={cn(
        "h-full rounded-xl border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-white/[0.03]",
        "p-5 sm:p-6"
      )}
    >
      <div className="text-base font-semibold text-gray-900 dark:text-white">{t("reports.productReport.stockAlert")}</div>
      <div className="mt-4 h-px w-full bg-gray-200 dark:bg-white/10" />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          <div className="h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{t("reports.productReport.status")}</div>
            <div
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                active
                  ? "bg-success-500/10 text-success-700 dark:text-success-400"
                  : "bg-error-500/10 text-error-700 dark:text-error-400"
              )}
            >
              {active ? t("reports.productReport.active") : t("reports.productReport.inactive")}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("reports.productReport.stockLimit")}</div>
            <div className="mt-1 text-xl font-extrabold text-gray-900 dark:text-white">
              {String(limit).padStart(2, "0")}
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t("reports.productReport.underLimitNote")}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockAlertCard;
