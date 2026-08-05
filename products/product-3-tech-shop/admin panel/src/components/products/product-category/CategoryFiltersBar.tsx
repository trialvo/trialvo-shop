"use client";

import React, { useMemo } from "react";
import Select, { type Option } from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import { cn } from "@/lib/utils";
import type { CategoryEntity, MainCategory, SubCategory } from "./types";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

type Props = {
  tab: CategoryEntity;

  name: string;
  setName: (v: string) => void;

  status: boolean | "all";
  setStatus: (v: boolean | "all") => void;

  featured: boolean | "all";
  setFeatured: (v: boolean | "all") => void;

  priority: number | "all";
  setPriority: (v: number | "all") => void;

  limit: number;
  setLimit: (v: number) => void;

  offset: number;
  setOffset: (v: number) => void;

  total: number;

  mainCategoryId: number | "all";
  setMainCategoryId: (v: number | "all") => void;

  subCategoryId: number | "all";
  setSubCategoryId: (v: number | "all") => void;

  mainOptions: MainCategory[];
  subOptions: SubCategory[];
  loadingMainOptions: boolean;
  loadingSubOptions: boolean;
};

function buildPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  pages.push(1);
  if (currentPage > 4) pages.push("...");
  for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 3) pages.push("...");
  pages.push(totalPages);
  return pages;
}

export default function CategoryFiltersBar({
  tab,
  name,
  setName,
  status,
  setStatus,
  featured,
  setFeatured,
  priority,
  setPriority,
  limit,
  setLimit,
  offset,
  setOffset,
  total,
  mainCategoryId,
  setMainCategoryId,
  subCategoryId,
  setSubCategoryId,
  mainOptions,
  subOptions,
  loadingMainOptions,
  loadingSubOptions,
}: Props) {
  const { t } = useTranslation();

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;
  const pageFrom = total === 0 ? 0 : offset + 1;
  const pageTo = Math.min(offset + limit, total);

  const pageNumbers = useMemo(
    () => buildPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const statusSelectOptions: Option[] = [
    { label: t("common.all"), value: "all" },
    { label: t("common.enabled"), value: "true" },
    { label: t("common.disabled"), value: "false" },
  ];

  const featuredSelectOptions: Option[] = [
    { label: t("common.all"), value: "all" },
    { label: t("products.categories.featured"), value: "true" },
    { label: t("products.categories.notFeatured"), value: "false" },
  ];

  const prioritySelectOptions: Option[] = [
    { label: t("common.all"), value: "all" },
    { label: "Low (1)", value: "1" },
    { label: "Normal (2)", value: "2" },
    { label: "High (3)", value: "3" },
  ];

  const limitSelectOptions: Option[] = [5, 10, 20, 50].map((n) => ({
    label: `${n} / page`,
    value: String(n),
  }));

  const mainSelectOptions: Option[] = [
    { label: loadingMainOptions ? t("common.loading") : t("products.categories.allMainCategories"), value: "all" },
    ...mainOptions.map((m) => ({ label: `#${m.id} - ${m.name}`, value: String(m.id) })),
  ];

  const subSelectOptions: Option[] = [
    { label: loadingSubOptions ? t("common.loading") : t("products.categories.allSubCategories"), value: "all" },
    ...subOptions.map((s) => ({ label: `#${s.id} - ${s.name}`, value: String(s.id) })),
  ];

  return (
    <div>
      {/* Single filter row */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        {/* Search — wider */}
        <div className="min-w-[160px] flex-[2]">
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setOffset(0); }}
            placeholder={t("products.categories.searchPlaceholder")}
            startIcon={<Search size={14} />}
          />
        </div>

        {/* Parent filter (sub or child tab) */}
        {tab === "sub" && (
          <div className="min-w-[140px] flex-[2]">
            <Select
              value={mainCategoryId === "all" ? "all" : String(mainCategoryId)}
              options={mainSelectOptions}
              onChange={(v) => { setMainCategoryId(v === "all" ? "all" : Number(v)); setOffset(0); }}
            />
          </div>
        )}
        {tab === "child" && (
          <div className="min-w-[140px] flex-[2]">
            <Select
              value={subCategoryId === "all" ? "all" : String(subCategoryId)}
              options={subSelectOptions}
              onChange={(v) => { setSubCategoryId(v === "all" ? "all" : Number(v)); setOffset(0); }}
            />
          </div>
        )}

        {/* Status */}
        <div className="min-w-[110px] flex-1">
          <Select
            value={status === "all" ? "all" : status ? "true" : "false"}
            options={statusSelectOptions}
            onChange={(v) => { setStatus(v === "all" ? "all" : v === "true"); setOffset(0); }}
          />
        </div>

        {/* Featured */}
        <div className="min-w-[110px] flex-1">
          <Select
            value={featured === "all" ? "all" : featured ? "true" : "false"}
            options={featuredSelectOptions}
            onChange={(v) => { setFeatured(v === "all" ? "all" : v === "true"); setOffset(0); }}
          />
        </div>

        {/* Priority */}
        <div className="min-w-[100px] flex-1">
          <Select
            value={priority === "all" ? "all" : String(priority)}
            options={prioritySelectOptions}
            onChange={(v) => { setPriority(v === "all" ? "all" : Number(v)); setOffset(0); }}
          />
        </div>

        {/* Per page */}
        <div className="min-w-[100px] flex-1">
          <Select
            value={String(limit)}
            options={limitSelectOptions}
            onChange={(v) => { setLimit(Number(v)); setOffset(0); }}
          />
        </div>
      </div>

      {/* Pagination bar */}
      <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 dark:border-gray-800 sm:flex-row">
        {/* Info */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {total === 0 ? "No results" : (
            <>
              Showing{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">{pageFrom}–{pageTo}</span>
              {" "}of{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-200">{total}</span>
            </>
          )}
        </p>

        {/* Page numbers */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* Prev */}
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition",
                currentPage === 1
                  ? "cursor-not-allowed border-gray-100 text-gray-300 dark:border-gray-800 dark:text-gray-700"
                  : "border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:text-brand-400",
              )}
              aria-label="Previous"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Page numbers */}
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="flex h-7 w-7 items-center justify-center text-xs text-gray-400 dark:text-gray-600">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setOffset((p - 1) * limit)}
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-medium transition",
                    p === currentPage
                      ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                      : "border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:text-brand-400",
                  )}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setOffset(offset + limit)}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition",
                currentPage === totalPages
                  ? "cursor-not-allowed border-gray-100 text-gray-300 dark:border-gray-800 dark:text-gray-700"
                  : "border-gray-200 text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-500 dark:hover:text-brand-400",
              )}
              aria-label="Next"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
