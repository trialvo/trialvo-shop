// src/components/reports/visitor-report/TopViewedProductsCard.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";
import { toPublicUrl } from "@/utils/toPublicUrl";
import type { TopViewedProductRow } from "./types";

type Props = {
  rows: TopViewedProductRow[];
  total: number;
  limit: number;
  offset: number;
  isLoading?: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export default function TopViewedProductsCard({
  rows,
  total,
  limit,
  offset,
  isLoading,
  onPrev,
  onNext,
}: Props) {
  const { t } = useTranslation();
  const canPrev = offset > 0;
  const canNext = offset + limit < total;

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
          <div className="text-base font-semibold text-gray-900 dark:text-white">{t("reports.visitorReport.topViewedProducts")}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t("reports.common.total")}: <span className="font-semibold">{total}</span> • {t("reports.common.showing")}{" "}
            <span className="font-semibold">{Math.min(offset + 1, total)}</span>-
            <span className="font-semibold">{Math.min(offset + limit, total)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9" type="button" disabled={!canPrev || !!isLoading} onClick={onPrev}>
            {t("reports.common.prev")}
          </Button>
          <Button variant="outline" className="h-9" type="button" disabled={!canNext || !!isLoading} onClick={onNext}>
            {t("reports.common.next")}
          </Button>
        </div>
      </div>

      <div className="mt-4 h-px w-full bg-gray-200 dark:bg-white/10" />

      <div className="mt-4 space-y-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          ))}

        {!isLoading &&
          rows.map((r) => (
            <div
              key={String(r.id)}
              className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  {r.image ? (
                    <img
                      src={toPublicUrl(r.image)}
                      alt={r.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">{r.name}</div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {t("reports.visitorReport.minPrice")}: <span className="font-semibold">{r.minPrice}</span> • {t("reports.visitorReport.lastViewed")}:{" "}
                    <span className="font-semibold">{new Date(r.lastViewed).toLocaleString()}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-brand-600 dark:text-brand-400">{r.viewCount}</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400">{t("reports.visitorReport.views")}</div>
                </div>
              </div>
            </div>
          ))}

        {!isLoading && rows.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
            {t("reports.common.noData")}
          </div>
        )}
      </div>
    </div>
  );
}
