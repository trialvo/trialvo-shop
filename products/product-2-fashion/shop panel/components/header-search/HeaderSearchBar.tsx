"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import CategorySelect from "./CategorySelect";
import SearchField, { type ProductSearchSuggestion } from "./SearchField";
import type { HeaderSearchCategory, HeaderSearchSubmitPayload } from "./types";

type Props = {
  categories: HeaderSearchCategory[];
  category: string;
  onCategoryChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onDebouncedQueryChange?: (value: string) => void;
  onSubmit?: (payload: HeaderSearchSubmitPayload) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  isSuggestionsLoading?: boolean;
  suggestions?: ProductSearchSuggestion[];
};

function useDebouncedEffect(effect: () => void, deps: React.DependencyList, delay: number) {
  React.useEffect(() => {
    const t = window.setTimeout(effect, delay);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

const HeaderSearchBar: React.FC<Props> = ({
  categories,
  category,
  onCategoryChange,

  query,
  onQueryChange,

  onDebouncedQueryChange,
  onSubmit,

  placeholder,
  debounceMs = 250,
  className,

  isSuggestionsLoading = false,
  suggestions = [],
}) => {
  useDebouncedEffect(
    () => {
      onDebouncedQueryChange?.(query);
    },
    [query, category],
    debounceMs,
  );

  const handleClear = React.useCallback(() => {
    onQueryChange("");
    onDebouncedQueryChange?.("");
  }, [onQueryChange, onDebouncedQueryChange]);

  const handleSubmit = React.useCallback(() => {
    onSubmit?.({ query, category });
  }, [onSubmit, query, category]);

  return (
    <div
      className={cn("flex h-10 w-full items-stretch", "border border-[#3C3C434A] bg-white", className)}
      role="search"
      aria-label="Header search"
    >
      <CategorySelect categories={categories} value={category} onChange={onCategoryChange} />

      <SearchField
        value={query}
        onChange={onQueryChange}
        onSubmit={handleSubmit}
        onClear={handleClear}
        placeholder={placeholder}
        className=""
        isLoading={isSuggestionsLoading}
        suggestions={suggestions}
        onPickSuggestion={(item) => {
        }}
      />
    </div>
  );
};

export default HeaderSearchBar;
