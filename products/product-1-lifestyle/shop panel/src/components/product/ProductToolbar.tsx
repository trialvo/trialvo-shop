"use client";

import { SlidersHorizontal, LayoutGrid, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = "featured" | "az" | "za" | "price-asc" | "price-desc" | "newest" | "oldest";

export const sortLabels: Record<SortOption, string> = {
  featured:     "Featured",
  az:           "A → Z",
  za:           "Z → A",
  "price-asc":  "Price: Low to High",
  "price-desc": "Price: High to Low",
  newest:       "Newest First",
  oldest:       "Oldest First",
};

interface ProductToolbarProps {
  title: string;
  count: number;
  sortBy: SortOption;
  gridCols: 2 | 3;
  activeFilterCount: number;
  onSortChange: (sort: SortOption) => void;
  onGridChange: (cols: 2 | 3) => void;
  onOpenMobileFilters: () => void;
}

export function ProductToolbar({
  title,
  count,
  sortBy,
  gridCols,
  activeFilterCount,
  onSortChange,
  onGridChange,
  onOpenMobileFilters,
}: ProductToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      {/* Left: title + count */}
      <div>
        <h1 className="font-display text-xl lg:text-2xl font-bold tracking-wide text-foreground">
          {title}
        </h1>
        <p className="text-[12px] text-muted-foreground mt-0.5 tracking-wide">
          {count} product{count !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        {/* Mobile filter button */}
        <button
          type="button"
          onClick={onOpenMobileFilters}
          className={cn(
            "lg:hidden flex items-center gap-1.5 h-9 px-4 rounded-full text-[12px] font-semibold tracking-wide cursor-pointer transition-all",
            "border border-border bg-background hover:border-accent/40 hover:bg-secondary"
          )}
        >
          <SlidersHorizontal size={13} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Grid toggle */}
        <div className="hidden sm:flex items-center rounded-full border border-border overflow-hidden h-9 bg-background">
          <button
            type="button"
            onClick={() => onGridChange(2)}
            className={cn(
              "w-9 h-full flex items-center justify-center transition-colors cursor-pointer",
              gridCols === 2 ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="2-column grid"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            onClick={() => onGridChange(3)}
            className={cn(
              "w-9 h-full flex items-center justify-center transition-colors cursor-pointer",
              gridCols === 3 ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="3-column grid"
          >
            <Grid3X3 size={14} />
          </button>
        </div>

        {/* Sort — Shadcn Select */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted-foreground hidden sm:inline tracking-wide">Sort:</span>
          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
            <SelectTrigger className="w-[155px] h-9 text-[12px] rounded-full border-border cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([key, label]) => (
                <SelectItem key={key} value={key} className="text-[12px] cursor-pointer">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
