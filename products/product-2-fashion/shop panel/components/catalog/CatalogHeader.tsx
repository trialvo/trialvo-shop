"use client";

import React from "react";
import SortSelect from "./SortSelect";
import type { SortValue } from "./types";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAppDispatch } from "@/redux/hooks";
import { openDrawer } from "@/redux/slices/drawerManagerSlice";
import { FaSliders } from "react-icons/fa6";
import { useTranslation } from "@/hooks/useTranslation";

export type CatalogHeaderProps = {
  title: string;
  sort: SortValue;
  onSortChange: (value: SortValue) => void;
  className?: string;
};

const CatalogHeader: React.FC<CatalogHeaderProps> = ({
  title,
  sort,
  onSortChange,
  className,
}) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "mb-4 border-b border-[#E5E5E5] bg-white py-3 sm:sticky sm:top-17.5 sm:z-30 sm:mb-6",
        className,
      )}
    >
      <div className="flex items-end justify-between gap-3">
        <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight text-black min-[768px]:text-[22px]">
          {title}
        </h1>
        <div className="hidden shrink-0 min-[500px]:block">
          <SortSelect value={sort} onChange={onSortChange} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 min-[500px]:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => dispatch(openDrawer({ key: "filters" }))}
          className="h-9 rounded-none border-transparent p-0! text-sm font-medium text-black shadow-none hover:bg-transparent"
        >
          <FaSliders className="h-4 w-4" />
          {t("catalog.filter")}
        </Button>
        <SortSelect value={sort} onChange={onSortChange} />
      </div>
    </div>
  );
};

export default CatalogHeader;
