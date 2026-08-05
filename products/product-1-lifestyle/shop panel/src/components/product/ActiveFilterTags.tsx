"use client";

import { X, SlidersHorizontal } from "lucide-react";

interface ActiveFilterTagsProps {
  selectedCategory: string;
  selectedSizes: string[];
  selectedColors: string[];
  priceRange: [number, number];
  defaultPriceRange: [number, number];
  onRemoveCategory: () => void;
  onRemoveSize: (size: string) => void;
  onRemoveColor: (color: string) => void;
  onRemovePrice: () => void;
}

export function ActiveFilterTags({
  selectedCategory,
  selectedSizes,
  selectedColors,
  priceRange,
  defaultPriceRange,
  onRemoveCategory,
  onRemoveSize,
  onRemoveColor,
  onRemovePrice,
}: ActiveFilterTagsProps) {
  const hasPrice =
    priceRange[0] > defaultPriceRange[0] || priceRange[1] < defaultPriceRange[1];
  const hasFilters =
    selectedCategory !== "All" ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    hasPrice;

  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b border-border/60">
      <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] font-semibold text-muted-foreground shrink-0">
        <SlidersHorizontal size={11} /> Active:
      </span>

      {selectedCategory !== "All" && (
        <FilterTag label={selectedCategory} onRemove={onRemoveCategory} />
      )}
      {selectedSizes.map((s) => (
        <FilterTag key={s} label={`Size: ${s}`} onRemove={() => onRemoveSize(s)} />
      ))}
      {selectedColors.map((c) => (
        <FilterTag key={c} label={c} onRemove={() => onRemoveColor(c)} />
      ))}
      {hasPrice && (
        <FilterTag
          label={`$${priceRange[0]} – $${priceRange[1]}`}
          onRemove={onRemovePrice}
        />
      )}
    </div>
  );
}

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-[11px] font-semibold tracking-wide">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="w-4 h-4 rounded-full bg-accent/20 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-colors cursor-pointer"
      >
        <X size={9} />
      </button>
    </span>
  );
}
