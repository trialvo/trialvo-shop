import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import * as React from "react";

export type MetricsRange = "day" | "week" | "month" | "year";

interface MetricCardProps {
  title: string;
  value: string;
  changePercent: number;
  subLeftText: string;
  subRightText: string;
  trendUp?: boolean;
  icon: React.ReactNode;
  loading?: boolean;
  sparkline?: number[];
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  changePercent,
  subLeftText,
  subRightText,
  trendUp = true,
  icon,
  loading = false,
  sparkline,
}) => {
  if (loading) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-white p-5",
          "shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)]",
          "dark:bg-gray-900",
          "dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)]"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-6 w-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>

        <div className="h-4 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="mt-3 h-9 w-36 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />

        <div className="my-4 h-px w-full bg-gray-200 dark:bg-gray-800" />

        <div className="flex items-center justify-between">
          <div className="h-3 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  const color = trendUp ? "success" : "danger";
  const sparklineLineId = React.useId();
  const sparklineFillId = React.useId();

  const sparklinePoints =
    sparkline && sparkline.length >= 2
      ? sparkline
      : trendUp
        ? [12, 10, 13, 9, 11, 8, 10, 6, 7]
        : [8, 10, 9, 11, 10, 12, 11, 13, 12];
  const minPoint = Math.min(...sparklinePoints);
  const maxPoint = Math.max(...sparklinePoints);
  const range = Math.max(maxPoint - minPoint, 1);
  const normalized = sparklinePoints.map((value) => (value - minPoint) / range);
  const step = 96 / (normalized.length - 1);
  const path = normalized
    .map((value, index) => {
      const x = Math.round(index * step * 100) / 100;
      const y = Math.round((30 - value * 24) * 100) / 100;
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
  const lastX = Math.round((normalized.length - 1) * step * 100) / 100;
  const lastY = Math.round((30 - normalized[normalized.length - 1] * 24) * 100) / 100;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white p-5",
        "shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)] transition-shadow duration-300 ease-out",
        "dark:bg-gray-900",
        "dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)]"
      )}
    >
      {/* Top row: badge + sparkline */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-semibold",
            trendUp
              ? "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-300"
              : "border-danger-200 bg-danger-50 text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-300"
          )}
        >
          <span className="inline-flex items-center gap-1">
            <span
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-lg",
                trendUp
                  ? "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300"
                  : "bg-danger-100 text-danger-700 dark:bg-danger-500/20 dark:text-danger-300"
              )}
            >
              {icon}
            </span>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(changePercent).toFixed(2).replace(/\.00$/, "")}%
          </span>
        </div>

        {/* Sparkline */}
        <div
          className={cn(
            "relative h-8 w-24 overflow-hidden rounded-xl border bg-gray-50",
            "dark:bg-gray-800",
            color === "success"
              ? "border-success-200 dark:border-success-500/30"
              : "border-danger-200 dark:border-danger-500/30"
          )}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 96 32"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={sparklineLineId} x1="0" y1="0" x2="1" y2="0">
                <stop
                  offset="0%"
                  stopColor={color === "success" ? "rgb(16 185 129)" : "rgb(239 68 68)"}
                  stopOpacity="0.25"
                />
                <stop
                  offset="100%"
                  stopColor={color === "success" ? "rgb(16 185 129)" : "rgb(239 68 68)"}
                  stopOpacity="0.7"
                />
              </linearGradient>
              <linearGradient id={sparklineFillId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={color === "success" ? "rgb(16 185 129)" : "rgb(239 68 68)"}
                  stopOpacity="0.25"
                />
                <stop
                  offset="100%"
                  stopColor={color === "success" ? "rgb(16 185 129)" : "rgb(239 68 68)"}
                  stopOpacity="0.02"
                />
              </linearGradient>
            </defs>
            <path
              d={`${path} L${lastX} 32 L0 32 Z`}
              fill={`url(#${sparklineFillId})`}
            />
            <path
              d={path}
              stroke={`url(#${sparklineLineId})`}
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx={lastX}
              cy={lastY}
              r="2"
              fill={color === "success" ? "rgb(16 185 129)" : "rgb(239 68 68)"}
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>

      {/* Value */}
      <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {value}
      </p>

      {/* Divider */}
      <div className="my-4 h-px w-full bg-gray-200 dark:bg-gray-800" />

      {/* Bottom */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-gray-500 dark:text-gray-400">{subLeftText}</span>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 font-semibold",
            trendUp ? "text-success-600 dark:text-success-400" : "text-danger-600 dark:text-danger-400"
          )}
        >
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {subRightText}
        </span>
      </div>
    </div>
  );
};

export default MetricCard;
