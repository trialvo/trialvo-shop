"use client";

import SortSelect from "@/components/catalog/SortSelect";
import { SortValue } from "@/components/catalog/types";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";

type Props = {
  value: SortValue;
  onChange: (value: SortValue) => void;
  count?: number;
};

const FavoritesHeader: React.FC<Props> = ({ value, onChange, count }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E5E5E5] pb-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-black min-[768px]:text-[22px]">
          {t("account.favorites.title")}
        </h1>
        {typeof count === "number" && count > 0 ? (
          <p className="mt-0.5 text-xs text-black/50">
            <span className="font-semibold tabular-nums text-black">{count}</span>{" "}
            item{count === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <div className="mb-0.5 shrink-0">
        <SortSelect value={value} onChange={onChange} />
      </div>
    </div>
  );
};

export default FavoritesHeader;
