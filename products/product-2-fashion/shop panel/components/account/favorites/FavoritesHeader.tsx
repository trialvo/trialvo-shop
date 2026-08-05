"use client";

import SortSelect from "@/components/catalog/SortSelect";
import { SortValue } from "@/components/catalog/types";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";

type Props = {
  value: SortValue;
  onChange: (value: SortValue) => void;
};

const FavoritesHeader: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] bg-white p-2 sm:p-4">
      <h1 className="text-xl font-semibold sm:text-2xl sm:font-bold">{t("account.favorites.title")}</h1>
      <SortSelect value={value} onChange={onChange} />
    </div>
  );
};

export default FavoritesHeader;
