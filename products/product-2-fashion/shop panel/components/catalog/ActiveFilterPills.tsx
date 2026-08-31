"use client";

import type { FilterState } from "@/components/filters/FilterSidebar";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CATALOG_PRICE,
  isDefaultCatalogPrice,
} from "@/redux/slices/catalogFilterSlice";
import React from "react";
import { FiX } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";

export type ActiveFilterPillsProps = {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
  className?: string;
};

function formatPrice(n: number) {
  return `BDT ${Math.round(n).toLocaleString("en-US")}`;
}

const ActiveFilterPills: React.FC<ActiveFilterPillsProps> = ({
  filters,
  onChange,
  onClear,
  className,
}) => {
  const { t } = useTranslation();
  const priceActive = !isDefaultCatalogPrice(filters.price);
  const sizes = Array.from(filters.sizes);
  const colors = Array.from(filters.colors);
  const total = sizes.length + colors.length + (priceActive ? 1 : 0);

  if (total === 0) return null;

  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-center gap-2 border-b border-[#E5E5E5] pb-4",
        className,
      )}
    >
      {priceActive ? (
        <button
          type="button"
          onClick={() => onChange({ ...filters, price: { ...DEFAULT_CATALOG_PRICE } })}
          className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full bg-[#F3F1ED] py-0 pl-3 pr-2 text-[12px] font-medium text-[#191919] transition-colors hover:bg-[#EAE6DF]"
        >
          <span className="truncate">
            {t("catalog.price")}: {formatPrice(filters.price.min)} –{" "}
            {formatPrice(filters.price.max)}
          </span>
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[#6A6678] hover:text-[#191919]">
            <FiX className="h-3.5 w-3.5" />
          </span>
        </button>
      ) : null}

      {sizes.map((size) => (
        <button
          key={`size-${size}`}
          type="button"
          onClick={() => {
            const next = new Set(filters.sizes);
            next.delete(size);
            onChange({ ...filters, sizes: next });
          }}
          className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full bg-[#F3F1ED] py-0 pl-3 pr-2 text-[12px] font-medium text-[#191919] transition-colors hover:bg-[#EAE6DF]"
        >
          <span className="truncate">
            {t("catalog.size")}: {size}
          </span>
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[#6A6678] hover:text-[#191919]">
            <FiX className="h-3.5 w-3.5" />
          </span>
        </button>
      ))}

      {colors.map((color) => (
        <button
          key={`color-${color}`}
          type="button"
          onClick={() => {
            const next = new Set(filters.colors);
            next.delete(color);
            onChange({ ...filters, colors: next });
          }}
          className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full bg-[#F3F1ED] py-0 pl-3 pr-2 text-[12px] font-medium text-[#191919] transition-colors hover:bg-[#EAE6DF]"
        >
          <span className="truncate">
            {t("catalog.color")}: {color}
          </span>
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[#6A6678] hover:text-[#191919]">
            <FiX className="h-3.5 w-3.5" />
          </span>
        </button>
      ))}

      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-8 items-center rounded-full px-2.5 text-[12px] font-semibold text-[#5F5F5F] underline-offset-2 transition-colors hover:text-[#191919] hover:underline"
      >
        {t("catalog.clearFilters")}
      </button>
    </div>
  );
};

export default ActiveFilterPills;
