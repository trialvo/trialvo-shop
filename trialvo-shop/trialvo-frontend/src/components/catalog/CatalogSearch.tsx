import type { FormEvent } from "react";
import { Search, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CatalogSearchProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClear?: () => void;
  className?: string;
};

/** Theme-aware catalog search — stays readable in light and dark */
export function CatalogSearch({
  value,
  onChange,
  onSubmit,
  onClear,
  className,
}: Readonly<CatalogSearchProps>) {
  const { language } = useLanguage();

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={cn(
        "flex w-full items-center gap-2 rounded-xl border border-border bg-card p-1.5 shadow-sm",
        "focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/20",
        className,
      )}
    >
      <label className="sr-only" htmlFor="catalog-search">
        {language === "bn" ? "প্রোডাক্ট খুঁজুন" : "Search products"}
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
        <Search
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          id="catalog-search"
          type="search"
          name="q"
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={
            language === "bn"
              ? "প্রোডাক্ট, ক্যাটাগরি খুঁজুন…"
              : "Search products or categories…"
          }
          className={cn(
            "h-10 w-full min-w-0 bg-transparent text-sm text-foreground outline-none",
            "placeholder:text-muted-foreground",
            "[&::-webkit-search-cancel-button]:appearance-none",
          )}
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={language === "bn" ? "সার্চ মুছুন" : "Clear search"}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <Button
        type="submit"
        className="h-10 shrink-0 rounded-lg bg-accent px-5 font-semibold text-accent-foreground hover:bg-accent/90"
      >
        {language === "bn" ? "খুঁজুন" : "Search"}
      </Button>
    </form>
  );
}

export default CatalogSearch;
