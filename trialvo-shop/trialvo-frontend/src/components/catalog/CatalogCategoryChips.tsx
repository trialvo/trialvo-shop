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
          <Skeleton key={`chip-skel-${i}`} className="h-10 w-28 rounded-full" />
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
        className={cn(
          "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
          !selectedSlug
            ? "border-accent bg-accent text-accent-foreground shadow-sm"
            : "border-border bg-card text-foreground hover:border-foreground/20 hover:bg-muted/60",
        )}
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
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              selected
                ? "border-accent bg-accent text-accent-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-foreground/20 hover:bg-muted/60",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{name}</span>
            {typeof count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                  selected
                    ? "bg-white/20 text-accent-foreground"
                    : "bg-muted text-muted-foreground",
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
