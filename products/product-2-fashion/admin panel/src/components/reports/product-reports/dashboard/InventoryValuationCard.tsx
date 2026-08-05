"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatBdt } from "../reportUtils";
import { useTranslation } from "react-i18next";

type Props = {
  totalBuyingValue: number;
  totalSellingValue: number;
  isLoading?: boolean;
};

const InventoryValuationCard: React.FC<Props> = ({ totalBuyingValue, totalSellingValue, isLoading }) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "h-full rounded-xl border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-white/[0.03]",
        "p-5 sm:p-6"
      )}
    >
      <div className="text-base font-semibold text-gray-900 dark:text-white">{t("reports.productReport.inventoryValuation")}</div>
      <div className="mt-4 h-px w-full bg-gray-200 dark:bg-white/10" />

      {isLoading ? (
        <div className="mt-6 space-y-4">
          <div className="h-16 w-full rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-16 w-full rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("reports.productReport.totalBuyingValue")}</div>
            <div className="mt-1 text-lg font-extrabold text-gray-900 dark:text-white">
              {formatBdt(totalBuyingValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{t("reports.productReport.totalSellingValue")}</div>
            <div className="mt-1 text-lg font-extrabold text-gray-900 dark:text-white">
              {formatBdt(totalSellingValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t("reports.productReport.valuationNote")}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryValuationCard;
