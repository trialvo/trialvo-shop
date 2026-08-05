"use client";

import * as React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronLeft, ChevronRight, Package, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import { cn } from "@/lib/utils";

import {
  dashboardKeys,
  getDashboardLowStockProducts,
  type LowStockProductItem,
} from "@/api/dashboard.api";
import StockAlertUpdateModal from "./StockAlertUpdateModal";

const PAGE_SIZE = 10;

export default function StockAlertProductsCard() {
  const { t } = useTranslation();
  const [page, setPage] = React.useState(1);
  const [open, setOpen] = React.useState(false);
  const [activeProductId, setActiveProductId] = React.useState<number | null>(null);
  const [activeProductName, setActiveProductName] = React.useState<string>("");

  const offset = (page - 1) * PAGE_SIZE;

  const query = useQuery({
    queryKey: dashboardKeys.lowStockList({ limit: PAGE_SIZE, offset }),
    queryFn: () => getDashboardLowStockProducts({ limit: PAGE_SIZE, offset }),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
  });

  const rows: LowStockProductItem[] = query.data?.data ?? [];
  const total = query.data?.total ?? 0;
  const alertLimitUsed = query.data?.alert_limit_used ?? 0;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const openModal = (p: LowStockProductItem) => {
    setActiveProductId(p.product_id);
    setActiveProductName(p.name);
    setOpen(true);
  };

  return (
    <>
      <div className="rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)] transition-shadow duration-300 ease-out dark:bg-gray-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)] w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t("dashboard.stockAlert.title")}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.stockAlert.subtitle", { alertLimitUsed })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-semibold",
                "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300"
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              {t("dashboard.stockAlert.lowStock")}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {query.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.04]" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-200">
              {t("dashboard.stockAlert.loadFailed")}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-300">
              {t("dashboard.stockAlert.empty")}
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((p) => {
                const lowVars = p.low_stock_variations ?? [];
                const totalLow = lowVars.length;

                return (
                  <div
                    key={p.product_id}
                    className="rounded-lg border border-gray-200 px-4 py-4 dark:border-gray-800"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/[0.04]">
                            <Package className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {p.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {t("dashboard.stockAlert.productId")}: {p.product_id} • {t("dashboard.stockAlert.lowStockVariations")}: {" "}
                              <span className="font-semibold text-warning-700 dark:text-warning-300">
                                {totalLow}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Variation chips */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {lowVars.slice(0, 6).map((v) => (
                            <span
                              key={v.product_variation_id}
                              className={cn(
                                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                                "bg-gray-100 text-gray-700 dark:bg-white/[0.04] dark:text-gray-200"
                              )}
                              title={v.sku_code}
                            >
                              <span className="truncate max-w-[140px]">{v.color} • {v.variant}</span>
                              <span className="text-warning-700 dark:text-warning-300">{v.current_stock}</span>
                            </span>
                          ))}

                          {totalLow > 6 ? (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-white/[0.04] dark:text-gray-200">
                              +{totalLow - 6} {t("dashboard.stockAlert.more")}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          type="button"
                          onClick={() => openModal(p)}
                          startIcon={<Plus className="h-4 w-4" />}
                          className="bg-brand-500 hover:bg-brand-600"
                        >
                          {t("dashboard.stockAlert.update")}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer: Pagination */}
          <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.stockAlert.showingItems", { count: rows.length, total })}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!canPrev}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold",
                  "border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed",
                  "dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("dashboard.stockAlert.prev")}
              </button>

              <span className="inline-flex h-9 items-center rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-800 dark:bg-white/[0.04] dark:text-gray-100">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={!canNext}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-semibold",
                  "border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed",
                  "dark:border-gray-800 dark:text-gray-200 dark:hover:bg-white/[0.04]"
                )}
              >
                {t("dashboard.stockAlert.next")}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <StockAlertUpdateModal
        open={open}
        productId={activeProductId}
        productName={activeProductName}
        onClose={() => setOpen(false)}
        onUpdated={() => {
          query.refetch();
        }}
      />
    </>
  );
}
