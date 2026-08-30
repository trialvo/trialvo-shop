import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

export type CatalogActiveChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

export type CatalogActiveFiltersProps = {
  chips: CatalogActiveChip[];
  onClearAll: () => void;
};

/** Removable active filter chips */
export function CatalogActiveFilters({
  chips,
  onClearAll,
}: Readonly<CatalogActiveFiltersProps>) {
  const { language } = useLanguage();

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {language === "bn" ? "সক্রিয় ফিল্টার" : "Active filters"}
      </span>
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.onRemove}
          className="group inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-accent/40 hover:text-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={
            language === "bn"
              ? `${chip.label} সরান`
              : `Remove ${chip.label}`
          }
        >
          <span>{chip.label}</span>
          <X className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-accent-strong" />
        </button>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-8 px-2 text-xs text-muted-foreground"
      >
        {language === "bn" ? "সব মুছুন" : "Clear all"}
      </Button>
    </div>
  );
}

export default CatalogActiveFilters;
