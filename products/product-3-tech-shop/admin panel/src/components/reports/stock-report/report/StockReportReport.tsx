// src/components/reports/stock-report/report/StockReportReport.tsx
"use client";

import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Download, FileDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { api } from "@/api/client";

import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";

import type { TimePeriodKey, StockCategoryLevel, StockCategoryReportRow } from "../types";
import { getPeriodRange, safeNumber } from "../stockUtils";
import { exportStockCategoryAsCsv, exportStockCategoryAsPrintablePdf } from "../exportUtils";


// ✅ You already have category API (use existing)
import { getMainCategories, getSubCategories, getChildCategories } from "@/api/categories.api";

// ✅ Stock category summary API you already have
import { getItemMetricsCategoryStockSummery, type CategoryStockSummeryRes } from "@/api/item-metrics.api";
import StockCategoryTable from "./StockReportTable";

type Props = { period: TimePeriodKey };

/** =========================
 *  Product metrics report (endpoint you provided)
 *  ========================= */
type ProductMetricsReportParams = {
  startDate: string;
  endDate: string;
  limit: number;
  offset: number;
  main_category_id?: number;
  sub_category_id?: number;
  child_category_id?: number;
  status?: boolean;
  search?: string;
};

type ProductMetricsReportRes = {
  success: true;
  timeframe: string;
  meta: { total: number; limit: number; offset: number };
  note?: string;
  data: Array<{
    id: number;
    name: string;
    slug: string;
    last_updated: string; // ISO
    is_active: boolean;
    categories: {
      main?: { id: number; name: string } | null;
      sub?: { id: number; name: string } | null;
      child?: { id: number; name: string } | null;
    };
    metrics: {
      quantity_sold: number;
      total_buying_price: string;
      total_selling_price: string;
      total_item_discount: string;
      net_revenue: string;
    };
  }>;
};

async function getProductMetricsReport(params: ProductMetricsReportParams) {
  const res = await api.get<ProductMetricsReportRes>("/admin/product-metrics/report", { params });
  return res.data;
}

/** =========================
 *  helpers
 *  ========================= */
function unwrapList<T>(payload: any, key?: string): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (key && Array.isArray(payload?.[key])) return payload[key] as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  if (Array.isArray(payload?.rows)) return payload.rows as T[];
  if (Array.isArray(payload?.results)) return payload.results as T[];
  if (Array.isArray(payload?.result)) return payload.result as T[];
  return [];
}

function normalize(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function moneyBDT(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}

function escapeCsvValue(value: string): string {
  const v = value.replace(/\r\n|\r|\n/g, " ");
  if (/[",]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function exportProductMetricsAsCsv(rows: ProductMetricsReportRes["data"], filename = "product-metrics-report.csv") {
  const header = [
    "SL",
    "Product",
    "Main Category",
    "Sub Category",
    "Child Category",
    "Qty Sold",
    "Buying Total",
    "Selling Total",
    "Item Discount",
    "Net Revenue",
    "Active",
    "Last Updated",
  ];
  const lines = [header.join(",")];

  rows.forEach((r, idx) => {
    lines.push(
      [
        String(idx + 1),
        escapeCsvValue(String(r.name ?? "")),
        escapeCsvValue(String(r.categories?.main?.name ?? "-")),
        escapeCsvValue(String(r.categories?.sub?.name ?? "-")),
        escapeCsvValue(String(r.categories?.child?.name ?? "-")),
        String(safeNumber(r.metrics?.quantity_sold)),
        String(r.metrics?.total_buying_price ?? "0.00"),
        String(r.metrics?.total_selling_price ?? "0.00"),
        String(r.metrics?.total_item_discount ?? "0.00"),
        String(r.metrics?.net_revenue ?? "0.00"),
        r.is_active ? "true" : "false",
        escapeCsvValue(String(r.last_updated ?? "")),
      ].join(",")
    );
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportProductMetricsAsPrintablePdf(rows: ProductMetricsReportRes["data"], title = "Product Metrics Report") {
  const stamp = new Date().toLocaleString();

  const bodyRows = rows
    .map(
      (r, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${String(r.name ?? "")}</td>
          <td>${String(r.categories?.main?.name ?? "-")}</td>
          <td>${String(r.categories?.sub?.name ?? "-")}</td>
          <td>${String(r.categories?.child?.name ?? "-")}</td>
          <td style="text-align:right">${safeNumber(r.metrics?.quantity_sold)}</td>
          <td style="text-align:right">${String(r.metrics?.total_buying_price ?? "0.00")}</td>
          <td style="text-align:right">${String(r.metrics?.total_selling_price ?? "0.00")}</td>
          <td style="text-align:right">${String(r.metrics?.total_item_discount ?? "0.00")}</td>
          <td style="text-align:right">${String(r.metrics?.net_revenue ?? "0.00")}</td>
          <td>${r.is_active ? "Yes" : "No"}</td>
          <td>${String(r.last_updated ?? "")}</td>
        </tr>
      `
    )
    .join("");

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        :root { color-scheme: light; }
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
        h1 { margin: 0 0 6px; font-size: 20px; }
        .meta { color: #6b7280; font-size: 12px; margin-bottom: 18px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
        th { background: #f9fafb; text-transform: uppercase; letter-spacing: .06em; font-size: 11px; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">Generated: ${stamp} • Rows: ${rows.length}</div>
      <table>
        <thead>
          <tr>
            <th>SL</th>
            <th>Product</th>
            <th>Main</th>
            <th>Sub</th>
            <th>Child</th>
            <th>Qty</th>
            <th>Buying</th>
            <th>Selling</th>
            <th>Discount</th>
            <th>Net</th>
            <th>Active</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </body>
  </html>
  `;

  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) return;

  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

/** =========================
 *  map category summary -> table rows
 *  ========================= */
function buildCategoryRows(
  res: CategoryStockSummeryRes | undefined,
  level: StockCategoryLevel,
  selected: { mainId?: number; subId?: number; childId?: number }
): StockCategoryReportRow[] {
  const mains = res?.data?.main_categories ?? [];
  const subs = res?.data?.sub_categories ?? [];
  const childs = res?.data?.child_categories ?? [];

  let list: Array<{ name: string; metrics: any }> = [];

  if (level === "main") {
    list = mains.map((m) => ({ name: m.name, metrics: m.metrics }));
  } else if (level === "sub") {
    if (typeof selected.mainId === "number") {
      list = subs
        .filter((s) => Number(s.main_category_id) === selected.mainId)
        .map((s) => ({ name: s.name, metrics: s.metrics }));
    } else {
      list = subs.map((s) => ({ name: s.name, metrics: s.metrics }));
    }
  } else {
    // child
    if (typeof selected.subId === "number") {
      list = childs
        .filter((c) => Number(c.sub_category_id) === selected.subId)
        .map((c) => ({ name: c.name, metrics: c.metrics }));
    } else if (typeof selected.mainId === "number") {
      list = childs
        .filter((c) => Number(c.main_category_id) === selected.mainId)
        .map((c) => ({ name: c.name, metrics: c.metrics }));
    } else {
      list = childs.map((c) => ({ name: c.name, metrics: c.metrics }));
    }
  }

  return list.map((x, idx) => ({
    sl: idx + 1,
    name: x.name,
    totalSku: safeNumber(x.metrics?.total_variations),
    inStock: safeNumber(x.metrics?.in_stock),
    lowStock: safeNumber(x.metrics?.low_stock),
    outOfStock: safeNumber(x.metrics?.out_of_stock),
  }));
}

export default function StockReportReport({ period }: Props) {
  const { t } = useTranslation();
  const range = React.useMemo(() => getPeriodRange(period), [period]);

  /** view mode */
  const [view, setView] = React.useState<"category" | "product">("category");

  /** common category filters */
  const [mainId, setMainId] = React.useState<string>("");
  const [subId, setSubId] = React.useState<string>("");
  const [childId, setChildId] = React.useState<string>("");

  /** category summary report level */
  const [level, setLevel] = React.useState<StockCategoryLevel>("main");

  /** product report controls */
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "active" | "inactive">("all");
  const [limit, setLimit] = React.useState<number>(20);
  const [offset, setOffset] = React.useState<number>(0);

  // reset dependent selects
  React.useEffect(() => {
    setSubId("");
    setChildId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainId]);

  React.useEffect(() => {
    setChildId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subId]);

  // when filters change on product view, reset pagination
  React.useEffect(() => {
    setOffset(0);
  }, [view, period, mainId, subId, childId, status, search, limit]);

  /** categories (use existing endpoints) */
  const mainQuery = useQuery({
    queryKey: ["categories", "main", "stock-report"],
    queryFn: () => getMainCategories({ limit: 500, offset: 0 } as any),
    staleTime: 60_000,
  });

  const subQuery = useQuery({
    queryKey: ["categories", "sub", "stock-report", mainId || "all"],
    queryFn: () =>
      getSubCategories(
        mainId
          ? ({ main_category_id: Number(mainId), limit: 500, offset: 0 } as any)
          : ({ limit: 500, offset: 0 } as any)
      ),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const childQuery = useQuery({
    queryKey: ["categories", "child", "stock-report", subId || "all"],
    queryFn: () =>
      getChildCategories(
        subId
          ? ({ sub_category_id: Number(subId), limit: 500, offset: 0 } as any)
          : ({ limit: 500, offset: 0 } as any)
      ),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const mainList = React.useMemo(() => unwrapList<any>(mainQuery.data, "data"), [mainQuery.data]);
  const subList = React.useMemo(() => unwrapList<any>(subQuery.data, "data"), [subQuery.data]);
  const childList = React.useMemo(() => unwrapList<any>(childQuery.data, "data"), [childQuery.data]);

  const mainOptions = React.useMemo(
    () => [{ value: "", label: t("reports.productReport.allMainCategories") }, ...mainList.map((m: any) => ({ value: String(m.id), label: String(m.name) }))],
    [mainList]
  );
  const subOptions = React.useMemo(
    () => [{ value: "", label: t("reports.productReport.allSubCategories") }, ...subList.map((s: any) => ({ value: String(s.id), label: String(s.name) }))],
    [subList]
  );
  const childOptions = React.useMemo(
    () => [{ value: "", label: t("reports.productReport.allChildCategories") }, ...childList.map((c: any) => ({ value: String(c.id), label: String(c.name) }))],
    [childList]
  );

  /** category stock summary */
  const categorySummeryQuery = useQuery({
    queryKey: ["item-metrics", "category-stock-summery", range.startDate, range.endDate],
    queryFn: () =>
      getItemMetricsCategoryStockSummery({
        startDate: range.startDate,
        endDate: range.endDate,
        limit: 500,
        offset: 0,
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    enabled: view === "category",
  });

  const selectedIds = React.useMemo(
    () => ({
      mainId: mainId ? Number(mainId) : undefined,
      subId: subId ? Number(subId) : undefined,
      childId: childId ? Number(childId) : undefined,
    }),
    [mainId, subId, childId]
  );

  const categoryRows = React.useMemo(() => {
    const rows = buildCategoryRows(categorySummeryQuery.data, level, selectedIds);
    // quick client-side search (optional)
    const q = normalize(search);
    if (!q) return rows;
    return rows.filter((r) => normalize(r.name).includes(q));
  }, [categorySummeryQuery.data, level, selectedIds, search]);

  /** product metrics report */
  const productQuery = useQuery({
    queryKey: [
      "product-metrics",
      "report",
      range.startDate,
      range.endDate,
      limit,
      offset,
      mainId || "all",
      subId || "all",
      childId || "all",
      status,
      search,
    ],
    queryFn: () =>
      getProductMetricsReport({
        startDate: range.startDate,
        endDate: range.endDate,
        limit,
        offset,
        ...(mainId ? { main_category_id: Number(mainId) } : {}),
        ...(subId ? { sub_category_id: Number(subId) } : {}),
        ...(childId ? { child_category_id: Number(childId) } : {}),
        ...(status === "all" ? {} : { status: status === "active" }),
        ...(search.trim() ? { search: search.trim() } : {}),
      }),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
    enabled: view === "product",
  });

  const totalProducts = safeNumber(productQuery.data?.meta?.total);
  const canPrev = offset > 0;
  const canNext = offset + limit < totalProducts;

  return (
    <div className="mt-6 space-y-5">
      {/* Header + mode switch + filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{t("reports.common.allReports")}</div>
            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {t("reports.common.range")}: {range.startDate} → {range.endDate}
              {view === "product" && productQuery.data?.note ? ` • ${productQuery.data.note}` : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
            {/* view switch */}
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-950">
              <button
                type="button"
                onClick={() => setView("category")}
                className={cn(
                  "h-10 px-4 rounded-xl text-sm font-semibold transition",
                  view === "category"
                    ? "bg-brand-500 text-white shadow-theme-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/[0.04]"
                )}
              >
                {t("reports.stockReport.categoryStock")}
              </button>
              <button
                type="button"
                onClick={() => setView("product")}
                className={cn(
                  "h-10 px-4 rounded-xl text-sm font-semibold transition",
                  view === "product"
                    ? "bg-brand-500 text-white shadow-theme-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/[0.04]"
                )}
              >
                {t("reports.productReport.title")}
              </button>
            </div>
          </div>
        </div>

        {/* Filters row */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative w-full lg:w-[340px]">
              <Input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder={view === "product" ? t("reports.productReport.searchProduct") : t("reports.stockReport.searchCategory")}
                className="h-11 rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 pr-10"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Category selectors */}
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              <Select
                options={mainOptions}
                defaultValue={mainId}
                onChange={(v) => setMainId(String(v))}
                className="h-11 rounded-xl border-gray-200 dark:border-gray-800"
              />
              <Select
                options={subOptions}
                defaultValue={subId}
                onChange={(v) => setSubId(String(v))}
                className="h-11 rounded-xl border-gray-200 dark:border-gray-800"
              />
              <Select
                options={childOptions}
                defaultValue={childId}
                onChange={(v) => setChildId(String(v))}
                className="h-11 rounded-xl border-gray-200 dark:border-gray-800"
              />
            </div>

            {/* View-specific filters */}
            {view === "category" ? (
              <Select
                options={[
                  { value: "main", label: t("reports.stockReport.mainLevel") },
                  { value: "sub", label: t("reports.stockReport.subLevel") },
                  { value: "child", label: t("reports.stockReport.childLevel") },
                ]}
                defaultValue={level}
                onChange={(v) => setLevel(v as StockCategoryLevel)}
                className="h-11 rounded-xl border-gray-200 dark:border-gray-800"
              />
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select
                  options={[
                    { value: "all", label: t("reports.common.allOrderStatus") },
                    { value: "active", label: t("reports.productReport.active") },
                    { value: "inactive", label: t("reports.productReport.inactive") },
                  ]}
                  defaultValue={status}
                  onChange={(v) => setStatus(v as any)}
                  className="h-11 rounded-xl border-gray-200 dark:border-gray-800"
                />
                <Select
                  options={[
                    { value: "10", label: "10 / page" },
                    { value: "20", label: "20 / page" },
                    { value: "50", label: "50 / page" },
                  ]}
                  defaultValue={String(limit)}
                  onChange={(v) => setLimit(Number(v))}
                  className="h-11 rounded-xl border-gray-200 dark:border-gray-800"
                />
              </div>
            )}
          </div>

          {/* Exports */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            {view === "category" ? (
              <>
                <Button
                  variant="outline"
                  className="h-11"
                  startIcon={<Download className="h-4 w-4" />}
                  type="button"
                  onClick={() => exportStockCategoryAsCsv(categoryRows)}
                >
                  {t("reports.common.exportExcel")}
                </Button>
                <Button
                  variant="outline"
                  className="h-11"
                  startIcon={<FileDown className="h-4 w-4" />}
                  type="button"
                  onClick={() => exportStockCategoryAsPrintablePdf(categoryRows, "Stock Category Report")}
                >
                  {t("reports.common.exportPdf")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="h-11"
                  startIcon={<Download className="h-4 w-4" />}
                  type="button"
                  onClick={() => exportProductMetricsAsCsv(productQuery.data?.data ?? [])}
                >
                  {t("reports.common.exportExcel")}
                </Button>
                <Button
                  variant="outline"
                  className="h-11"
                  startIcon={<FileDown className="h-4 w-4" />}
                  type="button"
                  onClick={() => exportProductMetricsAsPrintablePdf(productQuery.data?.data ?? [], "Product Metrics Report")}
                >
                  {t("reports.common.exportPdf")}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Loading / Error */}
        {view === "category" && categorySummeryQuery.isError && (
          <div className="mt-4 rounded-xl border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
            {String((categorySummeryQuery.error as any)?.message || "Failed to load category stock summary")}
          </div>
        )}

        {view === "product" && productQuery.isError && (
          <div className="mt-4 rounded-xl border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
            {String((productQuery.error as any)?.message || "Failed to load product report")}
          </div>
        )}
      </div>

      {/* Body */}
      {view === "category" ? (
        <StockCategoryTable rows={categoryRows} isLoading={categorySummeryQuery.isLoading} />
      ) : (
        <div className="space-y-3">
          {/* pagination bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t("reports.common.total")}: {totalProducts.toLocaleString()} • {t("reports.common.showing")} {Math.min(offset + 1, totalProducts)}-
              {Math.min(offset + limit, totalProducts)}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-10"
                type="button"
                disabled={!canPrev || productQuery.isFetching}
                onClick={() => setOffset((p) => Math.max(0, p - limit))}
              >
                {t("reports.common.prev")}
              </Button>
              <Button
                variant="outline"
                className="h-10"
                type="button"
                disabled={!canNext || productQuery.isFetching}
                onClick={() => setOffset((p) => p + limit)}
              >
                {t("reports.common.next")}
              </Button>
            </div>
          </div>

          {/* product table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="w-full overflow-hidden rounded-xl">
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <table className="min-w-[1200px] w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-950">
                      {[
                        "SL",
                        "Product",
                        "Category",
                        "Qty Sold",
                        "Buying",
                        "Selling",
                        "Discount",
                        "Net Revenue",
                        "Active",
                        "Updated",
                      ].map((h) => (
                        <th
                          key={h}
                          className={cn(
                            "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider",
                            "text-gray-500 dark:text-gray-400",
                            h === "Qty Sold" || h === "Buying" || h === "Selling" || h === "Discount" || h === "Net Revenue"
                              ? "text-right"
                              : ""
                          )}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {productQuery.isLoading &&
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={`sk-${i}`} className="border-t border-gray-100 dark:border-gray-800">
                          {Array.from({ length: 10 }).map((__, j) => (
                            <td key={`sk-${i}-${j}`} className="px-4 py-4">
                              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
                            </td>
                          ))}
                        </tr>
                      ))}

                    {!productQuery.isLoading &&
                      (productQuery.data?.data ?? []).map((r, idx) => {
                        const cat = [
                          r.categories?.main?.name,
                          r.categories?.sub?.name,
                          r.categories?.child?.name,
                        ]
                          .filter(Boolean)
                          .join(" > ");

                        return (
                          <tr
                            key={String(r.id)}
                            className="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.04]"
                          >
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {offset + idx + 1}
                            </td>

                            <td className="px-4 py-3">
                              <div className="min-w-0">
                                <div className="max-w-[420px] truncate text-sm font-semibold text-gray-900 dark:text-white">
                                  {r.name}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">#{r.id}</div>
                              </div>
                            </td>

                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                              {cat || "-"}
                            </td>

                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                              {safeNumber(r.metrics?.quantity_sold).toLocaleString()}
                            </td>

                            <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-200">
                              {moneyBDT(r.metrics?.total_buying_price)}
                            </td>

                            <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-200">
                              {moneyBDT(r.metrics?.total_selling_price)}
                            </td>

                            <td className="px-4 py-3 text-right text-sm text-amber-700 dark:text-amber-400">
                              {moneyBDT(r.metrics?.total_item_discount)}
                            </td>

                            <td className="px-4 py-3 text-right text-sm font-semibold text-success-700 dark:text-success-400">
                              {moneyBDT(r.metrics?.net_revenue)}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold",
                                  r.is_active
                                    ? "border-success-500/20 bg-success-500/10 text-success-700 dark:text-success-400"
                                    : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
                                )}
                              >
                                {r.is_active ? t("reports.productReport.active") : t("reports.productReport.inactive")}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                              {r.last_updated ? new Date(r.last_updated).toLocaleString() : "-"}
                            </td>
                          </tr>
                        );
                      })}

                    {!productQuery.isLoading && (productQuery.data?.data ?? []).length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                          {t("reports.common.noData")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
