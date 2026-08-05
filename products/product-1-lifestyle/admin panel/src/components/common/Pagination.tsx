import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";


import { cn } from "@/lib/utils";

type PageItem = number | "ellipsis";

export type PaginationProps = {
  totalItems: number;
  page: number; // 1-based
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  onPageSizeChange?: (nextPageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function buildPageItems(totalPages: number, page: number): PageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: PageItem[] = [];
  const showLeft = page > 3;
  const showRight = page < totalPages - 2;

  items.push(1);

  if (showLeft) items.push("ellipsis");

  const start = clamp(page - 1, 2, totalPages - 1);
  const end = clamp(page + 1, 2, totalPages - 1);

  for (let p = start; p <= end; p += 1) {
    if (p !== 1 && p !== totalPages) items.push(p);
  }

  if (showRight) items.push("ellipsis");

  items.push(totalPages);

  return items.filter((x, idx) => idx === 0 || x !== items[idx - 1]);
}

export default function Pagination({
  totalItems,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}: PaginationProps) {
  const { t } = useTranslation();
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / Math.max(1, pageSize))
  );
  const safePage = clamp(page, 1, totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(totalItems, safePage * pageSize);

  const items = useMemo(
    () => buildPageItems(totalPages, safePage),
    [totalPages, safePage]
  );

  const pageSizeSelectOptions = useMemo(
    () =>
      pageSizeOptions.map((n) => ({
        value: String(n),
        label: `${n} ${t("pagination.perPage")}`,
      })),
    [pageSizeOptions]
  );

  const go = (p: number) => onPageChange(clamp(p, 1, totalPages));

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white px-3 py-1.5",
        "dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: Summary text */}
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          <span className="font-semibold text-gray-600 dark:text-gray-300">
            {start}–{end}
          </span>{" "}
          {t("pagination.of")}{" "}
          <span className="font-semibold text-gray-600 dark:text-gray-300">
            {totalItems}
          </span>
        </p>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center gap-1">
          {/* Page size select */}
          {onPageSizeChange ? (
            <select
              value={String(pageSize)}
              onChange={(e) => {
                const next = Number(e.target.value);
                if (!Number.isFinite(next) || next <= 0) return;
                onPageSizeChange(next);
              }}
              className="h-7 rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-600 outline-none transition focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {pageSizeSelectOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : null}

          {/* Prev button */}
          <button
            type="button"
            onClick={() => go(safePage - 1)}
            disabled={safePage <= 1}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label={t("pagination.previousPage")}
          >
            <ChevronLeft size={14} />
          </button>

          {/* Page pills — desktop */}
          <div className="hidden items-center gap-0.5 sm:flex">
            {items.map((it, idx) => {
              if (it === "ellipsis") {
                return (
                  <span
                    key={`el-${idx}`}
                    className="inline-flex h-7 w-7 items-center justify-center text-gray-400 dark:text-gray-500"
                  >
                    <MoreHorizontal size={12} />
                  </span>
                );
              }

              const active = it === safePage;
              return (
                <button
                  key={it}
                  type="button"
                  onClick={() => go(it)}
                  className={cn(
                    "inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-[12px] font-semibold tabular-nums transition",
                    active
                      ? "border border-brand-500 bg-brand-500 text-white"
                      : "border border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-50 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                  )}
                  aria-label={t("pagination.page", { page: it })}
                >
                  {it}
                </button>
              );
            })}
          </div>

          {/* Compact mobile indicator */}
          <span className="inline-flex h-7 items-center rounded-md bg-gray-100 px-2 text-[11px] font-semibold tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300 sm:hidden">
            {safePage}/{totalPages}
          </span>

          {/* Next button */}
          <button
            type="button"
            onClick={() => go(safePage + 1)}
            disabled={safePage >= totalPages}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label={t("pagination.nextPage")}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
