"use client";

import React from "react";
import SortSelect from "./SortSelect";
import type { SortValue } from "./types";

import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import { openDrawer } from "@/redux/slices/drawerManagerSlice";
import { FiSliders } from "react-icons/fi";
import { useTranslation } from "@/hooks/useTranslation";

export type CatalogHeaderProps = {
  title: string;
  sort: SortValue;
  onSortChange: (value: SortValue) => void;
  count?: number;
  filterCount?: number;
  className?: string;
};

const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  title,
  sort,
  onSortChange,
  count,
  filterCount = 0,
  className,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "mb-4 border-b border-[#E5E5E5] bg-white py-3 sm:mb-6",
        "sticky top-11 z-30 min-[576px]:top-12 min-[768px]:top-[var(--shop-header-offset,72px)]",
        "transition-[top] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        className,
      )}
    >
      <div className="flex flex-col gap-3 min-[640px]:flex-row min-[640px]:items-end min-[640px]:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight text-black min-[768px]:text-[22px]">
            {title}
          </h1>
          {typeof count === "number" ? (
            <p className="mt-0.5 text-xs text-black/50">
              {count} {t("catalog.products")}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 min-[640px]:justify-end">
          <button
            type="button"
            onClick={() => dispatch(openDrawer({ key: "filters" }))}
            className={cn(
              "inline-flex h-9 items-center gap-2 border border-[#E5E5E5] px-3 text-sm font-medium text-black",
              "hover:border-black lg:hidden",
            )}
          >
            <FiSliders className="h-4 w-4" />
            <span>{t("catalog.filter")}</span>
            {filterCount > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center bg-black px-1 text-[11px] font-semibold text-white">
                {filterCount}
              </span>
            ) : null}
          </button>

          <SortSelect value={sort} onChange={onSortChange} />
        </div>
      </div>
    </div>
  );
};

export default CatalogHeader;
