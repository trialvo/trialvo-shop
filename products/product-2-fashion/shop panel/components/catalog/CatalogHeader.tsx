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
    <div className={cn("sticky top-10 py-2 bg-white sm:top-17.5 z-30 mb-1.5 sm:mb-6", className)}>
      <div className="hidden items-center justify-between gap-4 min-[500px]:flex">
        <h1 className="text-2xl font-semibold text-black">{title}</h1>
        <SortSelect value={sort} onChange={onSortChange} />
      </div>

      <div className="flex flex-col gap-3 min-[500px]:hidden">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch(openDrawer({ key: "filters" }))}
            className={cn(
              "h-9 rounded-none border-transparent p-0! text-sm font-medium text-black shadow-none hover:bg-transparent",
              "hover:bg-none"
            )}
          >
            <FaSliders className="h-4 w-4" />
            {t("catalog.filter")}
          </Button>
          <SortSelect value={sort} onChange={onSortChange} />
        </div>
      </div>
    </div>
  );
};

export default CatalogHeader;