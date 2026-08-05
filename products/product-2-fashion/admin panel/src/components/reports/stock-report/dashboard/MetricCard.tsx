"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

type Props = { qty: number; label: string };

const MetricCard: React.FC<Props> = ({ qty, label }) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-white/[0.03]",
        "p-5 sm:p-6"
      )}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          {String(qty).padStart(2, "0")}
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
          {t("reports.common.qty")}
        </div>
        <div className="mt-3 text-sm font-semibold text-gray-800 dark:text-white/90">{label}</div>
      </div>
    </div>
  );
};

export default MetricCard;
