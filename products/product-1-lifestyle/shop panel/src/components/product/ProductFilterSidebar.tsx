"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import type { ProductColor } from "@/types";

export interface FilterState {
  priceRange: [number, number];
  priceBounds: [number, number];
  selectedSizes: string[];
  selectedColors: string[];
  selectedCategory: string;
  sizeSearch: string;
  colorSearch: string;
  categories: string[];
  allSizes: string[];
  allColors: ProductColor[];
  activeFilterCount: number;
  onPriceChange: (val: [number, number]) => void;
  onSizeToggle: (size: string) => void;
  onColorToggle: (color: string) => void;
  onCategoryChange: (cat: string) => void;
  onSizeSearch: (q: string) => void;
  onColorSearch: (q: string) => void;
  onClearAll: () => void;
  showHeader?: boolean;
}

/* ── Collapsible section ─────────────────────────────────────────── */
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/60 pb-5 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-1 cursor-pointer group"
      >
        <span className="text-[12px] font-bold tracking-[0.15em] uppercase text-foreground/70 group-hover:text-foreground transition-colors">
          {title}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-muted-foreground transition-transform duration-300 ease-in-out",
            open ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          open ? "max-h-[600px] opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export function ProductFilterSidebar({
  priceRange,
  priceBounds,
  selectedSizes,
  selectedColors,
  selectedCategory,
  sizeSearch,
  colorSearch,
  categories,
  allSizes,
  allColors,
  activeFilterCount,
  onPriceChange,
  onSizeToggle,
  onColorToggle,
  onCategoryChange,
  onSizeSearch,
  onColorSearch,
  onClearAll,
  showHeader = true,
}: FilterState) {
  const visibleCategories = useMemo(
    () => dedupeStrings(categories),
    [categories]
  );
  const visibleSizes = useMemo(() => dedupeStrings(allSizes), [allSizes]);
  const visibleColors = useMemo(() => dedupeColors(allColors), [allColors]);

  const filteredSizes = visibleSizes.filter((s) =>
    s.toLowerCase().includes(sizeSearch.toLowerCase())
  );
  const filteredColors = visibleColors.filter((c) =>
    c.name.toLowerCase().includes(colorSearch.toLowerCase())
  );

  return (
    <div className="bg-background rounded-2xl border border-border/60 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-accent" />
            <h3 className="text-sm font-bold tracking-wide text-foreground">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {activeFilterCount}
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-sale transition-colors cursor-pointer font-medium"
            >
              <X size={12} /> Clear all
            </button>
          )}
        </div>
      )}

      <div className="px-5 py-4 space-y-5">
        {/* ── Category ── */}
        <FilterSection title="Category">
          <div className="space-y-1">
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={cn(
                  "flex items-center justify-between w-full text-left px-3 py-2 rounded-lg text-[13px] transition-all duration-150 cursor-pointer",
                  selectedCategory === cat
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                )}
              >
                <span>{cat}</span>
                {selectedCategory === cat && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                )}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* ── Price Range ── */}
        <FilterSection title="Price Range">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-[13px] text-foreground font-medium text-center">
              ${priceRange[0]}
            </div>
            <span className="text-muted-foreground text-sm">–</span>
            <div className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-[13px] text-foreground font-medium text-center">
              ${priceRange[1]}
            </div>
          </div>
          <div className="pb-2">
            <Slider
              min={priceBounds[0]}
              max={priceBounds[1]}
              step={10}
              value={priceRange}
              onValueChange={(val) => onPriceChange(val as [number, number])}
              className="w-full"
            />
          </div>
        </FilterSection>

        {/* ── Size ── */}
        <FilterSection title="Size">
          <input
            type="text"
            placeholder="Search sizes…"
            value={sizeSearch}
            onChange={(e) => onSizeSearch(e.target.value)}
            className="w-full h-8 px-3 text-[12px] bg-secondary/50 border border-border rounded-lg focus:outline-none focus:border-accent mb-3 placeholder:text-muted-foreground"
          />
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {filteredSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onSizeToggle(size)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all duration-150 cursor-pointer",
                  selectedSizes.includes(size)
                    ? "bg-accent text-accent-foreground border-accent shadow-sm"
                    : "border-border text-foreground/70 hover:border-accent/50 hover:text-foreground bg-background"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* ── Color ── */}
        <FilterSection title="Color">
          <input
            type="text"
            placeholder="Search colors…"
            value={colorSearch}
            onChange={(e) => onColorSearch(e.target.value)}
            className="w-full h-8 px-3 text-[12px] bg-secondary/50 border border-border rounded-lg focus:outline-none focus:border-accent mb-3 placeholder:text-muted-foreground"
          />
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {filteredColors.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => onColorToggle(color.name)}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-1.5 rounded-lg text-[13px] transition-all duration-150 cursor-pointer",
                  selectedColors.includes(color.name)
                    ? "bg-accent/8 text-accent font-medium"
                    : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded-full border-2 shrink-0 transition-all",
                    selectedColors.includes(color.name)
                      ? "border-accent shadow-sm"
                      : "border-border/60"
                  )}
                  style={{ backgroundColor: color.value }}
                />
                {color.name}
                {selectedColors.includes(color.name) && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                )}
              </button>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  );
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const normalizedValue = value.trim();
    const key = normalizedValue.toLowerCase();
    if (!normalizedValue || seen.has(key)) continue;

    seen.add(key);
    deduped.push(normalizedValue);
  }

  return deduped;
}

function dedupeColors(colors: ProductColor[]): ProductColor[] {
  const seen = new Set<string>();
  const deduped: ProductColor[] = [];

  for (const color of colors) {
    const normalizedName = color.name.trim();
    const key = normalizedName.toLowerCase();
    if (!normalizedName || seen.has(key)) continue;

    seen.add(key);
    deduped.push({ name: normalizedName, value: color.value });
  }

  return deduped;
}
