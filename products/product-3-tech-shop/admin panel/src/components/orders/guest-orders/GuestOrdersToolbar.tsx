"use client";

import React from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

import type { SortBy } from "./types";

type Props = {
  sortOptions: Array<{ label: string; value: SortBy }>;
  sortBy: SortBy;
  onSortChange: (v: SortBy) => void;

  search: string;
  onSearchChange: (v: string) => void;

  onClear: () => void;
};

const GuestOrdersToolbar: React.FC<Props> = ({
  sortOptions,
  sortBy,
  onSortChange,
  search,
  onSearchChange,
  onClear,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Sort */}
      <div className="w-full md:w-[240px]">
        <Select
          options={sortOptions.map((o) => ({ value: o.value, label: o.label }))}
          placeholder={t("guestOrders.sortPlaceholder")}
          defaultValue={sortBy}
          onChange={(v) => onSortChange(v as SortBy)}
        />
      </div>

      {/* Search + Clear */}
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="relative w-full sm:w-[320px]">
          <Input
            startIcon={<Search size={16} className="text-gray-400" />}
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            placeholder={t("guestOrders.searchPlaceholder")}
            className="pl-9"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          className="h-11 rounded-lg font-semibold"
        >
          {t("guestOrders.clear")}
        </Button>
      </div>
    </div>
  );
};

export default GuestOrdersToolbar;
export { GuestOrdersToolbar };
