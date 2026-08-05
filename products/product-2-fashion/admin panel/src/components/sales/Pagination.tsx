import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/button/Button";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (nextPage: number) => void;
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function range(start: number, end: number) {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

function buildPages(page: number, totalPages: number) {
  if (totalPages <= 5) return range(1, totalPages);

  const pages: (number | "…")[] = [];
  const left = Math.max(2, page - 1);
  const right = Math.min(totalPages - 1, page + 1);

  pages.push(1);

  if (left > 2) pages.push("…");
  for (const p of range(left, right)) pages.push(p);
  if (right < totalPages - 1) pages.push("…");

  pages.push(totalPages);
  return pages;
}

const Pagination: React.FC<Props> = ({ page, pageSize, total, onPageChange, className }) => {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = clamp(page, 1, totalPages);
  const items = buildPages(safePage, totalPages);

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2 dark:border-gray-800 dark:bg-white/[0.02]", className)}>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        {t("sales.page")} <span className="font-semibold text-gray-800 dark:text-white">{safePage}</span> {t("sales.of")}{" "}
        <span className="font-semibold text-gray-800 dark:text-white">{totalPages}</span> •{" "}
        <span className="font-semibold text-gray-800 dark:text-white">{total}</span> {t("sales.items")}
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="xs"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          startIcon={<ChevronLeft size={14} />}
        >
          <span className="hidden sm:inline">{t("sales.prev")}</span>
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {items.map((it, idx) => {
            if (it === "…") {
              return (
                <span key={`dots-${idx}`} className="px-1 text-xs text-gray-400">
                  …
                </span>
              );
            }

            const active = it === safePage;
            return (
              <Button
                key={it}
                variant={active ? "primary" : "outline"}
                size="xs"
                onClick={() => onPageChange(it)}
                className="min-w-[28px] px-1.5"
              >
                {it}
              </Button>
            );
          })}
        </div>

        {/* Mobile compact indicator */}
        <span className="inline-flex h-7 items-center rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 sm:hidden">
          {safePage}/{totalPages}
        </span>

        <Button
          variant="outline"
          size="xs"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          endIcon={<ChevronRight size={14} />}
        >
          <span className="hidden sm:inline">{t("sales.next")}</span>
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
