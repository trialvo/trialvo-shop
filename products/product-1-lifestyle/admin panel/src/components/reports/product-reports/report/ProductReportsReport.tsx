"use client";

import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Download, FileDown, Search, RefreshCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";

import { getMainCategories, getSubCategories, getChildCategories } from "@/api/categories.api";
import { getProductMetricsReport } from "@/api/product-metrics.api";

import type { TimePeriodKey, ProductReportRow, ReportStatus } from "../types";
import { exportProductReportAsCsv, exportProductReportAsPrintablePdf } from "../exportUtils";
import { formatIsoDateTimeToDate, getPeriodRange, parseMoney } from "../reportUtils";
import ProductReportsTable from "./ProductReportsTable";
import { toSelectOptions, unwrapList } from "../categoryListUtils";

type Props = { period: TimePeriodKey };

type SelectOption = { value: string; label: string };

const LIMIT_OPTIONS: SelectOption[] = [
  { value: "10", label: "10 rows" },
  { value: "20", label: "20 rows" },
  { value: "50", label: "50 rows" },
  { value: "100", label: "100 rows" },
];

function useStatusOptions() {
  const { t } = useTranslation();
  return [
    { value: "all", label: t("reports.common.allOrderStatus") },
    { value: "active", label: t("reports.productReport.active") },
    { value: "inactive", label: t("reports.productReport.inactive") },
  ];
}

function toRow(apiRow: any): ProductReportRow {
  const buying = parseMoney(apiRow.metrics?.total_buying_price);
  const selling = parseMoney(apiRow.metrics?.total_selling_price);
  const discount = parseMoney(apiRow.metrics?.total_item_discount);
  const netRevenue = parseMoney(apiRow.metrics?.net_revenue);
  const profit = netRevenue - buying;
  const sku = String(apiRow.sku ?? apiRow.slug ?? "-");
  const slug = String(apiRow.slug ?? apiRow.sku ?? "-");

  const main = apiRow.categories?.main?.name ? String(apiRow.categories.main.name) : "";
  const sub = apiRow.categories?.sub?.name ? String(apiRow.categories.sub.name) : "";
  const child = apiRow.categories?.child?.name ? String(apiRow.categories.child.name) : "";

  const categoryPath = [main, sub, child].filter(Boolean).join(" > ") || "-";

  return {
    id: String(apiRow.id),
    name: String(apiRow.name ?? "-"),
    slug,
    sku, // fallback if sku not provided
    categoryPath,
    stockQty: Number(apiRow.stock ?? apiRow.stockQty ?? 0), // report API may not include, fallback 0
    soldQty: Number(apiRow.metrics?.quantity_sold ?? 0),
    buying,
    selling,
    discount,
    netRevenue,
    revenue: netRevenue,
    cost: buying,
    profit,
    status: apiRow.is_active ? "active" : "inactive",
    updatedAt: formatIsoDateTimeToDate(apiRow.last_updated),
  };
}

function moneyBDT(n: number) {
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} BDT`;
}

const ProductReportsReport: React.FC<Props> = ({ period }) => {
  const { t } = useTranslation();
  const STATUS_OPTIONS = useStatusOptions();
  const range = React.useMemo(() => getPeriodRange(period), [period]);

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"all" | ReportStatus>("all");

  // dependent category filters
  const [mainId, setMainId] = React.useState<string>("all");
  const [subId, setSubId] = React.useState<string>("all");
  const [childId, setChildId] = React.useState<string>("all");

  const [limit, setLimit] = React.useState<number>(20);
  const [offset, setOffset] = React.useState<number>(0);

  // ✅ reset logic
  React.useEffect(() => {
    setSubId("all");
    setChildId("all");
    setOffset(0);
  }, [mainId]);

  React.useEffect(() => {
    setChildId("all");
    setOffset(0);
  }, [subId]);

  React.useEffect(() => {
    setOffset(0);
  }, [status, limit]);

  // ✅ search debounce (UI smoother)
  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  // ======================
  // Categories (YOUR API)
  // ======================

  const mainQuery = useQuery({
    queryKey: ["categories", "main"],
    queryFn: () => getMainCategories({ limit: 5000, offset: 0 } as any),
  });

  const subQuery = useQuery({
    queryKey: ["categories", "sub", mainId],
    queryFn: () => getSubCategories({ main_category_id: Number(mainId), limit: 5000, offset: 0 } as any),
    enabled: mainId !== "all",
  });

  const childQuery = useQuery({
    queryKey: ["categories", "child", subId],
    queryFn: () => getChildCategories({ sub_category_id: Number(subId), limit: 5000, offset: 0 } as any),
    enabled: subId !== "all",
  });

  const mainOptions = React.useMemo(() => {
    const items = unwrapList<any>(mainQuery.data);
    return toSelectOptions(items, t("reports.productReport.allMainCategories"));
  }, [mainQuery.data]);

  const subOptions = React.useMemo(() => {
    const items = unwrapList<any>(subQuery.data);
    return toSelectOptions(items, t("reports.productReport.allSubCategories"));
  }, [subQuery.data]);

  const childOptions = React.useMemo(() => {
    const items = unwrapList<any>(childQuery.data);
    return toSelectOptions(items, t("reports.productReport.allChildCategories"));
  }, [childQuery.data]);

  // ======================
  // Report API
  // ======================

  const reportQuery = useQuery({
    queryKey: [
      "product-metrics",
      "report",
      range.startDate,
      range.endDate,
      debouncedSearch,
      status,
      mainId,
      subId,
      childId,
      limit,
      offset,
    ],
    queryFn: async () => {
      const params: any = {
        startDate: range.startDate,
        endDate: range.endDate,
        limit,
        offset,
      };

      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (status !== "all") params.status = status === "active";
      if (mainId !== "all") params.main_category_id = Number(mainId);
      if (subId !== "all") params.sub_category_id = Number(subId);
      if (childId !== "all") params.child_category_id = Number(childId);

      return getProductMetricsReport(params);
    },
    placeholderData: keepPreviousData,
  });

  const rows: ProductReportRow[] = React.useMemo(() => {
    const apiRows = reportQuery.data?.data ?? [];
    return apiRows.map(toRow);
  }, [reportQuery.data]);

  const meta = reportQuery.data?.meta;
  const note = reportQuery.data?.note;

  const totals = React.useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.revenue += r.revenue;
        acc.cost += r.cost;
        acc.profit += r.profit;
        return acc;
      },
      { revenue: 0, cost: 0, profit: 0 }
    );
  }, [rows]);

  const total = meta?.total ?? 0;
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const currentPage = Math.floor((meta?.offset ?? offset) / safeLimit) + 1;

  function clearFilters() {
    setSearch("");
    setStatus("all");
    setMainId("all");
    setSubId("all");
    setChildId("all");
    setLimit(20);
    setOffset(0);
  }

  async function exportAll(kind: "csv" | "pdf") {
    const params: any = {
      startDate: range.startDate,
      endDate: range.endDate,
      limit: 5000,
      offset: 0,
    };

    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (status !== "all") params.status = status === "active";
    if (mainId !== "all") params.main_category_id = Number(mainId);
    if (subId !== "all") params.sub_category_id = Number(subId);
    if (childId !== "all") params.child_category_id = Number(childId);

    const all = await getProductMetricsReport(params);
    const allRows = (all.data ?? []).map(toRow);

    if (kind === "csv") exportProductReportAsCsv(allRows);
    else exportProductReportAsPrintablePdf(allRows, "Product Report");
  }

  return (
    <div className="mt-6 space-y-5">
      {/* Toolbar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{t("reports.common.allReports")}</div>
            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {t("reports.common.range")}: {range.startDate} → {range.endDate} • {t("reports.common.total")}: {total}
            </div>
            {note ? <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{note}</div> : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10"
              startIcon={<RefreshCcw className="h-4 w-4" />}
              onClick={() => reportQuery.refetch()}
              type="button"
            >
              {t("reports.common.refresh")}
            </Button>

            <Button variant="outline" className="h-10" onClick={clearFilters} type="button">
              {t("reports.common.reset")}
            </Button>
          </div>
        </div>

        {/* Controls: ✅ fixed layout */}
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* Search */}
          <div className="lg:col-span-4">
            <div className="relative">
              <Input
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder={t("reports.productReport.searchProduct")}
                className="h-11 rounded-xl border-gray-200 bg-white pr-10 dark:border-gray-800 dark:bg-gray-950"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Status */}
          <div className="lg:col-span-2">
            <Select
              options={STATUS_OPTIONS}
              defaultValue={status}
              onChange={(v) => setStatus(v as any)}
              className="h-11 rounded-xl border-gray-200 dark:border-gray-800"
            />
          </div>

          {/* Main */}
          <div className="lg:col-span-2">
            <Select
              options={mainOptions}
              defaultValue={mainId}
              onChange={(v) => setMainId(String(v))}
              className="h-11 rounded-xl border-gray-200 dark:border-gray-800"
            />
          </div>

          {/* Sub */}
          <div className="lg:col-span-2">
            <Select
              options={subOptions}
              defaultValue={subId}
              onChange={(v) => setSubId(String(v))}
              disabled={mainId === "all" || subQuery.isLoading}
              className={cn("h-11 rounded-xl border-gray-200 dark:border-gray-800", mainId === "all" && "opacity-60")}
            />
          </div>

          {/* Child */}
          <div className="lg:col-span-2">
            <Select
              options={childOptions}
              defaultValue={childId}
              onChange={(v) => setChildId(String(v))}
              disabled={subId === "all" || childQuery.isLoading}
              className={cn("h-11 rounded-xl border-gray-200 dark:border-gray-800", subId === "all" && "opacity-60")}
            />
          </div>
        </div>

        {/* Export + Pagination */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              options={LIMIT_OPTIONS}
              defaultValue={String(limit)}
              onChange={(v) => setLimit(Number(v))}
              className="h-11 w-full rounded-xl border-gray-200 dark:border-gray-800 sm:w-[160px]"
            />

            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t("reports.common.page")} {currentPage} {t("reports.common.of")} {totalPages}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-10"
                disabled={currentPage <= 1 || reportQuery.isFetching}
                onClick={() => setOffset(Math.max(0, offset - safeLimit))}
                type="button"
              >
                {t("reports.common.prev")}
              </Button>

              <Button
                variant="outline"
                className="h-10"
                disabled={currentPage >= totalPages || reportQuery.isFetching}
                onClick={() => setOffset(offset + safeLimit)}
                type="button"
              >
                {t("reports.common.next")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              className="h-11"
              startIcon={<Download className="h-4 w-4" />}
              onClick={() => exportAll("csv")}
              type="button"
            >
              {t("reports.common.exportExcel")}
            </Button>

            <Button
              variant="outline"
              className="h-11"
              startIcon={<FileDown className="h-4 w-4" />}
              onClick={() => exportAll("pdf")}
              type="button"
            >
              {t("reports.common.exportPdf")}
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryBox label={t("reports.productReport.totalRevenue")} value={totals.revenue} />
          <SummaryBox label={t("reports.productReport.totalCost")} value={totals.cost} />
          <SummaryBox label={t("reports.productReport.totalProfit")} value={totals.profit} tone={totals.profit >= 0 ? "success" : "danger"} />
        </div>

        {/* Errors */}
        {(mainQuery.isError || subQuery.isError || childQuery.isError) && (
          <div className="mt-4 rounded-xl border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
            {t("reports.common.failedLoad")}
          </div>
        )}

        {reportQuery.isError && (
          <div className="mt-4 rounded-xl border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-300">
            {t("reports.common.failedLoad")}
          </div>
        )}
      </div>

      {/* Table */}
      <ProductReportsTable rows={rows} isLoading={reportQuery.isLoading || reportQuery.isFetching} />
    </div>
  );
};

function SummaryBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger" | "default";
}) {
  const cls =
    tone === "success"
      ? "text-success-700 dark:text-success-400"
      : tone === "danger"
        ? "text-error-700 dark:text-error-400"
        : "text-gray-900 dark:text-white";

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</div>
      <div className={cn("mt-1 text-lg font-extrabold", cls)}>{moneyBDT(value)}</div>
    </div>
  );
}

export default ProductReportsReport;
