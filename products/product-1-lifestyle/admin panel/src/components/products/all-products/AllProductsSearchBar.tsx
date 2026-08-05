"use client";

import React from "react";
import { Search, X } from "lucide-react";

import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";

type AllProductsSearchBarProps = {
  value: string;
  placeholder: string;
  onValueChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
  searchAriaLabel?: string;
  clearAriaLabel?: string;
};

const AllProductsSearchBar: React.FC<AllProductsSearchBarProps> = ({
  value,
  placeholder,
  onValueChange,
  onSearch,
  onClear,
  searchAriaLabel = "Search",
  clearAriaLabel = "Clear search",
}) => {
  const hasSearchValue = value.trim().length > 0;

  return (
    <div className="flex w-full min-w-0 lg:w-[420px]">
      <div className="relative w-full min-w-0">
        <Input
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearch();
            }
            if (e.key === "Escape" && hasSearchValue) {
              e.preventDefault();
              onClear();
            }
          }}
          autoComplete="off"
          placeholder={placeholder}
          className={`h-11 rounded-l-xl rounded-r-none border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 ${hasSearchValue ? "pr-10" : ""}`}
        />
        {hasSearchValue ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            aria-label={clearAriaLabel}
            title={clearAriaLabel}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <Button
        variant="primary"
        className="h-11 rounded-l-none rounded-r-xl bg-brand-500 px-4 hover:bg-brand-600"
        startIcon={<Search className="h-4 w-4" />}
        onClick={onSearch}
        type="button"
        ariaLabel={searchAriaLabel}
      />
    </div>
  );
};

export default AllProductsSearchBar;
