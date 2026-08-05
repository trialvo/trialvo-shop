"use client";

import * as React from "react";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { cn } from "@/lib/utils";
import {
  getModalBackdropStyle,
  getModalDialogStyle,
  useModalTransition,
} from "@/components/ui/modal/useModalTransition";

import { getProduct, type ProductSingleVariation } from "@/api/products.api";
import { updateProductVariation, type ProductVariationPayload } from "@/api/product-variations.api";
import { toPublicUrl } from "@/utils/toPublicUrl";

type Props = {
  open: boolean;
  productId: number | null;
  productName?: string;
  onClose: () => void;
  onUpdated?: () => void;
};

function safeInt(v: unknown, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function formatBDT(n: number): string {
  if (!Number.isFinite(n)) return "৳0";
  const formatted = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }).format(n);
  return `৳${formatted}`;
}

function getFirstImage(product: any) {
  const path = product?.images?.[0]?.path;
  return typeof path === "string" && path ? toPublicUrl(path) : null;
}

export default function StockAlertUpdateModal({ open, productId, productName, onClose, onUpdated }: Props) {
  const { t } = useTranslation();
  const enabled = open && !!productId;
  const { isMounted, isVisible, handleTransitionEnd } = useModalTransition(open);

  const productQuery = useQuery({
    queryKey: ["stock-alert-product", productId],
    queryFn: () => getProduct(Number(productId)),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

  const product = productQuery.data?.product;
  const variations: ProductSingleVariation[] = product?.variations ?? [];

  // draft[variationId] = newStock
  const [draft, setDraft] = React.useState<Record<number, number>>({});

  React.useEffect(() => {
    if (!open) return;

    const next: Record<number, number> = {};
    variations.forEach((v) => {
      next[v.id] = safeInt(v.stock, 0);
    });
    setDraft(next);
  }, [open, productId, variations]); // ok (variations is stable enough for reset per open)

  const changedCount = React.useMemo(() => {
    let count = 0;
    for (const v of variations) {
      const cur = safeInt(v.stock, 0);
      const next = safeInt(draft[v.id], cur);
      if (next !== cur) count += 1;
    }
    return count;
  }, [draft, variations]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("Product not loaded");
      if (!variations.length) return;

      const jobs = variations
        .map((v) => {
          const currentStock = safeInt(v.stock, 0);
          const nextStock = safeInt(draft[v.id], currentStock);
          if (nextStock === currentStock) return null;

          const payload: ProductVariationPayload = {
            product_id: product.id,
            color_id: v.color.id,
            variant_id: v.variant.id,
            buying_price: v.buying_price,
            selling_price: v.selling_price,
            discount: v.discount,
            stock: nextStock,
            sku: v.sku,
          };

          return updateProductVariation(v.id, payload);
        })
        .filter(Boolean) as Promise<any>[];

      if (!jobs.length) return;

      const results = await Promise.allSettled(jobs);
      const failed = results.filter((r) => r.status === "rejected");

      if (failed.length) {
        throw new Error(`${failed.length} variation update failed`);
      }
    },
    onSuccess: () => {
      toast.success(t("dashboard.stockUpdate.updateSuccess"));
      onUpdated?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t("dashboard.stockUpdate.updateFailed"));
    },
  });

  if (!isMounted) return null;

  const image = product ? getFirstImage(product) : null;

  return (
    <div className="fixed inset-0 z-[999999999] flex items-center justify-center">
      {/* overlay */}
      <button
        type="button"
        style={getModalBackdropStyle(isVisible)}
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (updateMutation.isPending) return;
          onClose();
        }}
        aria-label={t("dashboard.stockUpdate.close")}
      />

      {/* modal */}
      <div
        onTransitionEnd={handleTransitionEnd}
        style={getModalDialogStyle(isVisible)}
        className="relative w-[94%] max-w-[980px] overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
              {t("dashboard.stockUpdate.title")}
            </h3>
            <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
              {product?.name ?? productName ?? (productId ? `${t("dashboard.stockUpdate.productLabel")} #${productId}` : t("dashboard.stockUpdate.productLabel"))}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              if (updateMutation.isPending) return;
              onClose();
            }}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* body */}
        <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
          {productQuery.isLoading ? (
            <div className="space-y-3">
              <div className="h-16 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.04]" />
              <div className="h-56 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.04]" />
            </div>
          ) : productQuery.isError ? (
            <div className="py-10 text-center text-sm text-error-600">{t("dashboard.stockUpdate.loadFailed")}</div>
          ) : !product ? (
            <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("dashboard.stockUpdate.noProduct")}
            </div>
          ) : (
            <div className="space-y-5">
              {/* top info */}
              <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg ring-1 ring-gray-200 dark:ring-gray-800">
                    {image ? (
                      <img src={image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gray-200 dark:bg-gray-800" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{product.name}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t("dashboard.stockUpdate.totalVariations")}: {variations.length}
                      {typeof product?.summary?.total_stock === "number"
                        ? ` • ${t("dashboard.stockUpdate.totalStock")}: ${product.summary.total_stock}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold",
                      changedCount > 0
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
                    )}
                  >
                    {changedCount > 0 ? t("dashboard.stockUpdate.changed", { count: changedCount }) : t("dashboard.stockUpdate.noChanges")}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      const next: Record<number, number> = {};
                      variations.forEach((v) => {
                        next[v.id] = safeInt(v.stock, 0);
                      });
                      setDraft(next);
                    }}
                    disabled={updateMutation.isPending}
                  >
                    {t("dashboard.stockUpdate.reset")}
                  </Button>
                </div>
              </div>

              {/* table */}
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-12 gap-2 bg-gray-50 px-4 py-3 text-xs font-semibold text-gray-700 dark:bg-white/[0.04] dark:text-gray-200">
                  <div className="col-span-4">{t("dashboard.stockUpdate.tableVariant")}</div>
                  <div className="col-span-4">{t("dashboard.stockUpdate.tableSku")}</div>
                  <div className="col-span-2 text-center">{t("dashboard.stockUpdate.tableCurrent")}</div>
                  <div className="col-span-2 text-right">{t("dashboard.stockUpdate.tableNewStock")}</div>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {variations.map((v) => {
                    const currentStock = safeInt(v.stock, 0);
                    const nextStock = safeInt(draft[v.id], currentStock);
                    const changed = nextStock !== currentStock;

                    return (
                      <div key={v.id} className="grid grid-cols-12 items-center gap-2 px-4 py-3">
                        <div className="col-span-4 min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {v.color?.name ?? t("dashboard.stockUpdate.color")} • {v.variant?.name ?? t("dashboard.stockUpdate.variant")}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t("dashboard.stockUpdate.finalPrice")}: {formatBDT(Number(v.final_price ?? v.selling_price))}
                          </p>
                        </div>

                        <div className="col-span-4 min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{v.sku}</p>
                        </div>

                        <div className="col-span-2 text-center">
                          <span
                            className={cn(
                              "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold",
                              currentStock <= 0
                                ? "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-300"
                                : currentStock <= 5
                                  ? "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300"
                                  : "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300",
                            )}
                          >
                            {currentStock}
                          </span>
                        </div>

                        <div className="col-span-2 flex justify-end">
                          <Input
                            type="number"
                            value={String(nextStock)}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const val = safeInt(e.target.value, currentStock);
                              setDraft((p) => ({ ...p, [v.id]: val }));
                            }}
                            className={cn(
                              "h-9 w-24 rounded-md border bg-white text-right dark:bg-gray-950",
                              changed ? "border-brand-500 focus:border-brand-500" : "border-gray-200 dark:border-gray-800",
                            )}
                            min={0}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {!variations.length ? (
                    <div className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t("dashboard.stockUpdate.noVariations")}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              if (updateMutation.isPending) return;
              onClose();
            }}
          >
            {t("dashboard.stockUpdate.cancel")}
          </Button>

          <Button
            variant="primary"
            type="button"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || changedCount === 0 || productQuery.isLoading}
            className="bg-brand-500 hover:bg-brand-600"
          >
            {updateMutation.isPending ? t("dashboard.stockUpdate.saving") : t("dashboard.stockUpdate.saveChanges")}
          </Button>
        </div>
      </div>
    </div>
  );
}
