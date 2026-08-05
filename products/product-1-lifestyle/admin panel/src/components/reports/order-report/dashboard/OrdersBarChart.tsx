"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { TimePeriodKey, YearlyBarSeries } from "../types";
import { periodLabel } from "../dateUtils";

type ChartData = {
  years: [string, string, string];
  series: YearlyBarSeries[]; // ordered old -> new
} | null;

type Props = {
  period: TimePeriodKey;
  chart: ChartData;
  isLoading?: boolean;
};

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const OrdersBarChart: React.FC<Props> = ({ period, chart, isLoading }) => {
  const { t } = useTranslation();
  const series = chart?.series ?? [];
  const years = chart?.years ?? ["-", "-", "-"];

  const maxValue = React.useMemo(() => {
    const all = series.flatMap((s) => s.values);
    return Math.max(1, ...all);
  }, [series]);

  const colorByIndex: Record<number, string> = {
    0: "bg-indigo-500/80",
    1: "bg-cyan-500/80",
    2: "bg-rose-400/80",
  };

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
          <div className="text-base font-semibold text-gray-900 dark:text-white">{t("reports.orderReport.yearlyComparison")}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("reports.common.timePeriod")}: {periodLabel(period)}</div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <LegendDot className={colorByIndex[0]} label={years[0]} />
          <LegendDot className={colorByIndex[1]} label={years[1]} />
          <LegendDot className={colorByIndex[2]} label={years[2]} />
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-gray-200 dark:bg-white/10" />

      <div className="mt-6">
        {isLoading ? (
          <div className="h-[260px] w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        ) : (
          <div className="w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-12 gap-4 items-end">
                {months.map((m, idx) => (
                  <div key={m} className="flex flex-col items-center gap-2">
                    <div className="h-[220px] w-full flex items-end justify-center gap-1">
                      {series.map((s, si) => {
                        const h = Math.round((Number(s.values[idx] || 0) / maxValue) * 100);
                        return (
                          <div
                            key={`${s.year}-${m}`}
                            className={cn("w-3 rounded-full", colorByIndex[si] ?? "bg-brand-500/70")}
                            style={{ height: `${Math.max(6, h)}%` }}
                            title={`${s.year}: ${s.values[idx]}`}
                          />
                        );
                      })}
                    </div>
                    <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{m}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                {t("reports.orderReport.groupedMonthly")}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-1">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} />
      <span>{label}</span>
    </div>
  );
}

export default OrdersBarChart;
