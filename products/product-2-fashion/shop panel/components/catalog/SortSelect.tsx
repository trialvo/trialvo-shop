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
    <div className="flex min-w-0 items-center gap-2">
      <Label className="hidden shrink-0 text-sm font-medium text-black/55 sm:block">
        {t("catalog.sortBy")}
      </Label>

      <div className="w-[9.5rem] min-[400px]:w-44 sm:w-52">
        <SelectDropdown
          value={value}
          onChange={onChange}
          options={sortOptions}
          placeholder={t("catalog.sort.featured")}
          searchable={false}
        />
      </div>
    </div>
  );
};

export default SortSelect;
