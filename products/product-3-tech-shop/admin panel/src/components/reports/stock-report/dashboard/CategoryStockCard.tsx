"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { StockCategoryLevel, StockCategoryRow } from "../types";

type Props = {
  level: StockCategoryLevel;
  onLevelChange: (l: StockCategoryLevel) => void;
  rows: StockCategoryRow[];
  isLoading?: boolean;
  pageLabel: string;
  onPrev: () => void;
  onNext: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
};

const CategoryStockCard: React.FC<Props> = ({
  level,
  onLevelChange,
  rows,
  isLoading,
  pageLabel,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "h-full rounded-xl border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-white/[0.03]",
        "p-5 sm:p-6"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-semibold text-gray-900 dark:text-white">{t("reports.stockReport.categoryStockSummary")}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("reports.stockReport.breakdownBy")} {level === "main" ? t("reports.productReport.main") : level === "sub" ? t("reports.productReport.sub") : t("reports.productReport.child")}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-950">
            {(["main", "sub", "child"] as const).map((k) => {
              const active = level === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onLevelChange(k)}
                  className={cn(
                    "h-9 px-3 rounded-xl text-xs font-semibold transition",
                    active
                      ? "bg-brand-500 text-white"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]"
                  )}
                >
                  {k === "main" ? t("reports.productReport.main") : k === "sub" ? t("reports.productReport.sub") : t("reports.productReport.child")}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-gray-200 dark:bg-white/10" />

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">{pageLabel}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={disablePrev}
            className={cn(
              "h-9 px-3 rounded-xl text-xs font-semibold border",
              disablePrev
                ? "border-gray-200 text-gray-400 dark:border-gray-800"
                : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.04]"
            )}
          >
            {t("reports.common.prev")}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={disableNext}
            className={cn(
              "h-9 px-3 rounded-xl text-xs font-semibold border",
              disableNext
                ? "border-gray-200 text-gray-400 dark:border-gray-800"
                : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.04]"
            )}
          >
            {t("reports.common.next")}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="mt-2 h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))
          : rows.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.name}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    SKU: {r.totalSku} • In: {r.inStock} • Low: {r.lowStock} • Out: {r.outOfStock}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Pill tone="success" value={r.inStock} />
                  <Pill tone="warning" value={r.lowStock} />
                  <Pill tone="error" value={r.outOfStock} />
                </div>
              </div>
            </div>
          ))}

        {!isLoading && rows.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
            {t("reports.common.noData")}
          </div>
        )}
      </div>
    </div>
  );
};

function Pill({ value, tone }: { value: number; tone: "success" | "warning" | "error" }) {
  const cls =
    tone === "success"
      ? "border-success-500/20 bg-success-500/10 text-success-700 dark:text-success-400"
      : tone === "warning"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "border-error-500/20 bg-error-500/10 text-error-700 dark:text-error-400";

  return <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", cls)}>{value}</span>;
}

export default CategoryStockCard;
