"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { StockTrendPoint, TimePeriodKey } from "../types";

type Props = {
  period: TimePeriodKey;
  points: StockTrendPoint[];
  year: number;
  onYearChange: (y: number) => void;
  isLoading?: boolean;
  errorText?: string | null;
};

const periodLabel = (p: TimePeriodKey) => {
  if (p === "today") return "Today";
  if (p === "last7") return "Last 7 Days";
  if (p === "thisMonth") return "This Month";
  return "This Year";
};

function toPath(values: number[], w: number, h: number, padding: number) {
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const span = Math.max(1, max - min);
  const step = (w - padding * 2) / Math.max(1, values.length - 1);

  return values
    .map((v, i) => {
      const x = padding + i * step;
      const y = padding + (1 - (v - min) / span) * (h - padding * 2);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

const YEAR_OPTIONS = [2024, 2025, 2026, 2027];

const StockTrendChart: React.FC<Props> = ({ period, points, year, onYearChange, isLoading, errorText }) => {
  const { t } = useTranslation();
  const inValues = points.map((p) => p.in);
  const outValues = points.map((p) => p.out);

  const w = 980;
  const h = 280;
  const pad = 24;

  const inPath = toPath(inValues.length ? inValues : new Array(12).fill(0), w, h, pad);
  const outPath = toPath(outValues.length ? outValues : new Array(12).fill(0), w, h, pad);

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-white/[0.03]",
        "p-5 sm:p-6"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-base font-semibold text-gray-900 dark:text-white">{t("reports.stockReport.stockTrend")}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("reports.common.timePeriod")}: {periodLabel(period)} • {t("reports.stockReport.year")}: {year}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <LegendDot className="bg-success-500" label={t("reports.stockReport.stockIn")} />
            <LegendDot className="bg-error-500" label={t("reports.stockReport.stockOut")} />
          </div>

          <select
            value={String(year)}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className={cn(
              "h-10 rounded-xl border border-gray-200 dark:border-gray-800",
              "bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white",
              "px-3 outline-none focus:ring-2 focus:ring-brand-500/30"
            )}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={String(y)} className="bg-white dark:bg-gray-950">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-gray-200 dark:bg-white/10" />

      {errorText ? (
        <div className="mt-4 rounded-xl border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
          {errorText}
        </div>
      ) : null}

      <div className="mt-4 w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[980px]">
          {isLoading ? (
            <div className="h-[280px] w-full rounded bg-gray-200 dark:bg-gray-800" />
          ) : (
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[280px]">
              {[0, 1, 2, 3, 4].map((g) => (
                <line
                  key={g}
                  x1={pad}
                  x2={w - pad}
                  y1={pad + (g * (h - pad * 2)) / 4}
                  y2={pad + (g * (h - pad * 2)) / 4}
                  className="stroke-gray-200 dark:stroke-white/10"
                  strokeDasharray="6 6"
                />
              ))}

              <path d={`${inPath} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`} className="fill-success-500/10" />
              <path d={inPath} className="stroke-success-500" fill="none" strokeWidth="3" />

              <path d={`${outPath} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`} className="fill-error-500/10" />
              <path d={outPath} className="stroke-error-500" fill="none" strokeWidth="3" />

              {points.map((p, i) => {
                const step = (w - pad * 2) / Math.max(1, points.length - 1);
                const x = pad + i * step;
                return (
                  <text
                    key={`${p.month}-${i}`}
                    x={x}
                    y={h - 6}
                    textAnchor="middle"
                    className="fill-gray-500 dark:fill-gray-400"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {p.month}
                  </text>
                );
              })}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} />
      <span className="font-semibold">{label}</span>
    </div>
  );
}

export default StockTrendChart;
