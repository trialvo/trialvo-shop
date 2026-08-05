// src/components/products/all-products/modals/StockVariantsModal.tsx
"use client";

import React from "react";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";

import BaseModal from "./BaseModal";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { getColors } from "@/api/colors.api";
import { getVariants } from "@/api/variants.api";
import {
  getProductVariationsByProduct,
  updateProductVariation,
  type ProductVariationEntity,
} from "@/api/product-variations.api";

type Props = {
  open: boolean;
  productId: number | null;
  productName?: string;
  onClose: () => void;
  onUpdated?: () => void;
};

type Option = { value: string; label: string };

function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function safeNumber(v: string, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function sumStock(rows: { stock: number }[]) {
  return (rows ?? []).reduce((s, r) => s + Math.max(0, Number(r.stock ?? 0)), 0);
}

export default function StockVariantsModal({ open, productId, productName, onClose, onUpdated }: Props) {
  const { t } = useTranslation();
  const enabled = open && !!productId;

  const variationsQuery = useQuery({
    queryKey: ["productVariations", productId],
    queryFn: () => getProductVariationsByProduct(Number(productId)),
    enabled,
    retry: 1,
  });

  const { data: colorsRes } = useQuery({
    queryKey: ["colors-all"],
    queryFn: () => getColors({ limit: 9999 }),
    staleTime: 60_000,
  });

  const { data: variantsRes } = useQuery({
    queryKey: ["variants-all"],
    queryFn: () => getVariants({ limit: 500 }),
    staleTime: 60_000,
  });

  const colorsRaw = React.useMemo(() => unwrapList<any>(colorsRes), [colorsRes]);
  const variantsRaw = React.useMemo(() => unwrapList<any>(variantsRes?.data ?? variantsRes), [variantsRes]);

  const colorNameById = React.useMemo(
    () => new Map(colorsRaw.map((c: any) => [Number(c.id), String(c.name ?? c.title ?? `#${c.id}`)])),
    [colorsRaw],
  );

  const variantNameById = React.useMemo(
    () => new Map(variantsRaw.map((v: any) => [Number(v.id), String(v.name ?? `#${v.id}`)])),
    [variantsRaw],
  );

  const rows = variationsQuery.data ?? [];

  const [draftStock, setDraftStock] = React.useState<Record<number, number>>({});
  const [draftFreeDelivery, setDraftFreeDelivery] = React.useState<Record<number, boolean | null>>({});

  React.useEffect(() => {
    if (!enabled) return;
    const nextStock: Record<number, number> = {};
    const nextFD: Record<number, boolean | null> = {};
    for (const r of rows) {
      nextStock[r.id] = Number(r.stock ?? 0);
      nextFD[r.id] = r.free_delivery != null ? Boolean(r.free_delivery) : null;
    }
    setDraftStock(nextStock);
    setDraftFreeDelivery(nextFD);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, variationsQuery.data]);

  const updateStockMutation = useMutation({
    mutationFn: async (row: ProductVariationEntity) => {
      if (!productId) throw new Error("Missing product");
      const nextStock = Math.max(0, Number(draftStock[row.id] ?? row.stock ?? 0));

      return updateProductVariation(row.id, {
        product_id: Number(productId),
        color_id: row.color_id,
        variant_id: row.variant_id,
        buying_price: row.buying_price,
        selling_price: row.selling_price,
        discount: row.discount,
        stock: nextStock,
        sku: row.sku,
        free_delivery: draftFreeDelivery[row.id] !== undefined ? draftFreeDelivery[row.id] : null,
      });
    },
    onSuccess: async () => {
      toast.success(t("products.stockVariants.stockUpdated"));
      await variationsQuery.refetch();
      onUpdated?.();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? t("products.stockVariants.failedUpdate");
      toast.error(msg);
    },
  });

  const totalStock = sumStock(rows);
  const totalVariants = rows.length;

  const busy = variationsQuery.isFetching || updateStockMutation.isPending;

  return (
    <BaseModal
      open={open}
      onClose={() => {
        if (busy) return;
        onClose();
      }}
      title={t("products.stockVariants.title")}
      description={t("products.stockVariants.description")}
      widthClassName="w-[980px]"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {t("products.stockVariants.productLabel")}: <span className="font-semibold text-gray-900 dark:text-white">{productName ?? "-"}</span>
            {"  "}• {t("products.stockVariants.totalVariants")}: <span className="font-semibold">{totalVariants}</span>
            {"  "}• {t("products.stockVariants.totalStock")}: <span className="font-semibold">{totalStock}</span>
          </div>

          <Button variant="outline" className="h-11" onClick={onClose} disabled={busy}>
            {t("common.close")}
          </Button>
        </div>
      }
    >
      {variationsQuery.isLoading ? (
        <div className="py-14 text-center text-sm text-gray-500 dark:text-gray-400">{t("products.stockVariants.loadingVariations")}</div>
      ) : variationsQuery.isError ? (
        <div className="py-14 text-center text-sm text-error-600">{t("products.stockVariants.failedLoadVariations")}</div>
      ) : rows.length === 0 ? (
        <div className="py-14 text-center text-sm text-gray-500 dark:text-gray-400">{t("products.stockVariants.noVariations")}</div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[980px] border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
                {[t("products.stockVariants.color"), t("products.stockVariants.variant"), t("products.stockVariants.sku"), t("products.stockVariants.buying"), t("products.stockVariants.selling"), t("products.stockVariants.discount"), "Free Del.", t("products.stockVariants.stock"), t("products.stockVariants.action")].map((h) => (
                  <TableCell key={h} isHeader className="px-4 py-4 text-left text-xs font-semibold text-brand-500">
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((r) => {
                const color = colorNameById.get(Number(r.color_id)) ?? `#${r.color_id}`;
                const variant = variantNameById.get(Number(r.variant_id)) ?? `#${r.variant_id}`;
                const val = draftStock[r.id] ?? Number(r.stock ?? 0);

                return (
                  <TableRow key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                    <TableCell className="px-4 py-4">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{color}</span>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{variant}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">ID: {r.variant_id}</span>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.sku}</span>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.buying_price}</span>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.selling_price}</span>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.discount}</span>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <select
                        value={draftFreeDelivery[r.id] === null || draftFreeDelivery[r.id] === undefined ? "inherit" : draftFreeDelivery[r.id] ? "free" : "paid"}
                        onChange={(e) => {
                          const v = e.target.value;
                          setDraftFreeDelivery(p => ({ ...p, [r.id]: v === "inherit" ? null : v === "free" }));
                        }}
                        className="w-[110px] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                      >
                        <option value="inherit">🔗 Inherit</option>
                        <option value="free">🚚 Free</option>
                        <option value="paid">💳 Paid</option>
                      </select>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <div className="w-[120px]">
                        <Input
                          type="number"
                          value={val}
                          onChange={(e) =>
                            setDraftStock((p) => ({
                              ...p,
                              [r.id]: Math.max(0, safeNumber(e.target.value, p[r.id] ?? 0)),
                            }))
                          }
                        />
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4">
                      <Button
                        size="icon"
                        className={cn("h-10 w-10")}
                        ariaLabel="Save stock"
                        onClick={() => updateStockMutation.mutate(r)}
                        disabled={updateStockMutation.isPending}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </BaseModal>
  );
}
