import type { LucideIcon } from "lucide-react";
import {
  Gift,
  LayoutGrid,
  Shirt,
  ShoppingCart,
  Smartphone,
  Watch,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { localize } from "@/lib/localize";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Category } from "@/hooks/useCategories";

const ICON_MAP: Record<string, LucideIcon> = {
  ShoppingCart,
  Shirt,
  Gift,
  Watch,
  Smartphone,
};

/**
 * Squared buttons rather than pills, so the filters read as controls instead of
 * badges. The selected state carries the accent fill.
 */
function chipClass(selected: boolean) {
  return cn(
    "inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium",
    "transition-[background-color,border-color,box-shadow] duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    selected
      ? "border-accent bg-accent text-accent-foreground shadow-card"
      : "border-border bg-card text-foreground shadow-card hover:border-accent/40 hover:text-accent-strong",
  );
}

export type CatalogCategoryChipsProps = {
  categories: Category[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  isLoading?: boolean;
};

/** Horizontal API-driven category chips for the catalog */
export function CatalogCategoryChips({
  categories,
  selectedSlug,
  onSelect,
  isLoading = false,
}: Readonly<CatalogCategoryChipsProps>) {
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-hidden" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`chip-skel-${i}`} className="h-10 w-28 rounded-lg" />
        ))}
      </div>
    );
  }

  const allLabel = language === "bn" ? "সবগুলো" : "All";

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="listbox"
      aria-label={language === "bn" ? "ক্যাটাগরি ফিল্টার" : "Category filters"}
    >
      <button
        type="button"
        role="option"
        aria-selected={!selectedSlug}
        onClick={() => onSelect("")}
        className={chipClass(!selectedSlug)}
      >
        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
        {allLabel}
      </button>

      {categories.map((category) => {
        const selected = selectedSlug === category.slug;
        const Icon = ICON_MAP[category.icon || ""] ?? ShoppingCart;
        const name = localize(category.name, language, category.slug);
        const count = category.product_count;

        return (
          <button
            key={category.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(category.slug)}
            className={chipClass(selected)}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{name}</span>
            {typeof count === "number" ? (
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums sm:text-[11px]",
                  selected ? "text-accent-foreground/75" : "text-muted-foreground",
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default CatalogCategoryChips;
