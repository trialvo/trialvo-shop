"use client";

import { SlidersHorizontal, X } from "lucide-react";

import type { MegaSaleSortOption } from "@/hooks/useMegaSale";

const sortOptions: { label: string; value: MegaSaleSortOption }[] = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Best Rating", value: "rating" },
];

interface MegaSaleFiltersProps {
  categories: string[];
  category: string;
  sort: MegaSaleSortOption;
  showFilters: boolean;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: MegaSaleSortOption) => void;
  onToggleFilters: () => void;
}

export function MegaSaleFilters({
  categories,
  category,
  sort,
  showFilters,
  onCategoryChange,
  onSortChange,
  onToggleFilters,
}: MegaSaleFiltersProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
          {categories.map((cat) => (
            <button key={cat} onClick={() => onCategoryChange(cat)} className={`whitespace-nowrap px-3 sm:px-4 py-2 text-[10px] tracking-[0.15em] uppercase transition-colors rounded ${category === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"}`}>{cat}</button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <select value={sort} onChange={(event) => onSortChange(event.target.value as MegaSaleSortOption)} className="text-xs border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:border-accent">
            {sortOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
          </select>
        </div>
        <button onClick={onToggleFilters} className="md:hidden text-foreground">{showFilters ? <X size={20} /> : <SlidersHorizontal size={20} />}</button>
      </div>
      {showFilters && (
        <div className="md:hidden mb-6 p-4 bg-secondary">
          <select value={sort} onChange={(event) => onSortChange(event.target.value as MegaSaleSortOption)} className="w-full text-xs border border-border bg-background text-foreground px-3 py-2">
            {sortOptions.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
          </select>
        </div>
      )}
    </>
  );
}
