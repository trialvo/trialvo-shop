"use client";

import { Label } from "@/components/ui/label";
import React from "react";
import SelectDropdown, { SelectDropdownOption } from "../common/form/SelectDropdown";
import type { SortValue } from "./types";
import { useTranslation } from "@/hooks/useTranslation";

export type SortSelectProps = {
  value: SortValue;
  onChange: (value: SortValue) => void;
};

const SortSelect: React.FC<SortSelectProps> = ({ value, onChange }) => {
  const { t } = useTranslation();

  const sortOptions: SelectDropdownOption<SortValue>[] = [
    { value: "featured", label: t("catalog.sort.featured") },
    { value: "name_asc", label: t("catalog.sort.nameAsc") },
    { value: "name_desc", label: t("catalog.sort.nameDesc") },
    { value: "price_asc", label: t("catalog.sort.priceAsc") },
    { value: "price_desc", label: t("catalog.sort.priceDesc") },
    { value: "date_desc", label: t("catalog.sort.dateDesc") },
    { value: "date_asc", label: t("catalog.sort.dateAsc") },
  ];

  return (
    <div className="flex items-center gap-1">
      <Label className="text-sm font-semibold text-black">{t("catalog.sortBy")}</Label>

      <div className="w-48">
        <SelectDropdown
          value={value}
          onChange={onChange}
          options={sortOptions}
          placeholder={t("catalog.sort.featured")}
          searchPlaceholder={t("catalog.sortBy")}
          emptyText={t("catalog.noProducts")}
          triggerClassName="h-9 w-full justify-between rounded-none border-0 p-0 shadow-none text-left"
          contentClassName="w-48"
          listMaxHeightClassName="max-h-64"
          side="bottom"
          sideOffset={-2}
          closeOnSelect={true}
        />
      </div>
    </div>
  );
};

export default SortSelect;