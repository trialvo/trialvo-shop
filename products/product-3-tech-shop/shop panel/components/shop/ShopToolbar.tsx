"use client";

import type { ReactElement } from "react";
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { AppSelect } from "@/components/shared/AppSelect";
import type { AppSelectOption } from "@/lib/ui/appSelect";
import { cn } from "@/lib/utils";

export type ShopSortValue =
  | "default"
  | "price-low"
  | "price-high"
  | "rating"
  | "discount"
  | "bestseller"
  | "newest";

export const SHOP_SORT_OPTIONS: AppSelectOption<ShopSortValue>[] = [
  { value: "default", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "bestseller", label: "Best sellers" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
  { value: "discount", label: "Best discount" },
];

type ShopToolbarProps = Readonly<{
  resultCount: number;
  isLoading?: boolean;
  sortBy: ShopSortValue;
  onSortChange: (value: ShopSortValue) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
}>;

/**
 * Shop results toolbar — count, sort dropdown, view toggle, mobile filters.
 */
export function ShopToolbar({
  resultCount,
  isLoading = false,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenFilters,
  activeFilterCount = 0,
}: ShopToolbarProps): ReactElement {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Loading products…
          </span>
        ) : (
          <>
            <span className="font-semibold text-foreground">
              {resultCount.toLocaleString()}
            </span>{" "}
            {resultCount === 1 ? "product" : "products"}
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onOpenFilters ? (
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            className="relative h-9 gap-2 lg:hidden"
            onClick={onOpenFilters}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            Filters
            {activeFilterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-sm bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </AppButton>
        ) : null}

        <div className="w-[min(100%,200px)] sm:w-[200px]">
          <AppSelect<ShopSortValue>
            value={sortBy}
            onChange={(v) => onSortChange((v || "default") as ShopSortValue)}
            options={SHOP_SORT_OPTIONS}
            searchable={false}
            layer="page"
            placeholder="Sort by"
            triggerClassName="h-9 text-xs"
          />
        </div>

        <div
          className="hidden items-center overflow-hidden rounded-sm border border-border bg-card sm:inline-flex"
          role="toolbar"
          aria-label="View mode"
        >
          <button
            type="button"
            title="Grid view"
            aria-pressed={viewMode === "grid"}
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "flex h-9 w-9 items-center justify-center transition-colors",
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            title="List view"
            aria-pressed={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
            className={cn(
              "flex h-9 w-9 items-center justify-center border-l border-border transition-colors",
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <List className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

type ShopActiveFiltersProps = Readonly<{
  chips: ReadonlyArray<{ id: string; label: string; onRemove: () => void }>;
  onClearAll: () => void;
}>;

export function ShopActiveFilters({
  chips,
  onClearAll,
}: ShopActiveFiltersProps): ReactElement | null {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        Active:
      </span>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onRemove}
          className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {chip.label}
          <X className="h-3 w-3 opacity-60" aria-hidden />
          <span className="sr-only">Remove {chip.label}</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

export default ShopToolbar;
