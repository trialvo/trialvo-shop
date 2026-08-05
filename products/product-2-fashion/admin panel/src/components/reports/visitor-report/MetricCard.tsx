// src/components/reports/visitor-report/MetricCard.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { VisitorMetric } from "./types";

type Props = { metric: VisitorMetric };

function toneClass(tone?: VisitorMetric["tone"]) {
  if (tone === "success") return "text-success-600 dark:text-success-400";
  if (tone === "warning") return "text-amber-600 dark:text-amber-400";
  if (tone === "error") return "text-error-600 dark:text-error-400";
  if (tone === "muted") return "text-gray-700 dark:text-gray-200";
  return "text-brand-600 dark:text-brand-400";
}

const MetricCard: React.FC<Props> = ({ metric }) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 dark:border-gray-800",
        "bg-white dark:bg-white/[0.03]",
        "p-5 sm:p-6"
      )}
    >
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">{metric.label}</div>

        <div className={cn("mt-2 text-3xl md:text-4xl font-extrabold tracking-tight", toneClass(metric.tone))}>
          {metric.valueText}
        </div>

        {metric.hint ? (
          <div className="mt-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500">{metric.hint}</div>
        ) : (
          <div className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">—</div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
