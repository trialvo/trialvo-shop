"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { OrderOverall } from "../types";

type Props = { overall: OrderOverall; isLoading?: boolean };

const bdt = (n: number) => `${Number(n || 0).toLocaleString()}৳`;

const OverallCard: React.FC<Props> = ({ overall, isLoading }) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "h-full rounded-xl border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-white/[0.03]",
        "p-5 sm:p-6"
      )}
    >
      <div className="text-base font-semibold text-gray-900 dark:text-white">{t("reports.orderReport.overall")}</div>
      <div className="mt-4 h-px w-full bg-gray-200 dark:bg-white/10" />

      {isLoading ? (
        <div className="mt-8 space-y-6">
          <div className="h-10 w-56 animate-pulse rounded bg-gray-200 dark:bg-gray-800 mx-auto" />
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800 mx-auto" />
          <div className="h-px w-full bg-gray-200 dark:bg-white/10" />
          <div className="h-10 w-56 animate-pulse rounded bg-gray-200 dark:bg-gray-800 mx-auto" />
          <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-800 mx-auto" />
        </div>
      ) : (
        <>
          <div className="mt-8 text-center">
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-brand-500">
              {bdt(overall.totalOrderAmount)}
            </div>
            <div className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t("reports.orderReport.totalOrderAmount")}</div>
          </div>

          <div className="my-8 h-px w-full bg-gray-200 dark:bg-white/10" />

          <div className="text-center">
            <div className="text-4xl md:text-5xl font-extrabold tracking-tight text-success-600 dark:text-success-500">
              {bdt(overall.totalOrderCost)}
            </div>
            <div className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t("reports.orderReport.totalOrderCost")}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default OverallCard;
