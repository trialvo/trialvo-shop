"use client";

import * as React from "react";
import { Search, ShoppingBag, X } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media/url";
import { productService } from "@/lib/api/product/service";
import type { ProductListItem } from "@/lib/api/product/service";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";

interface ProductPickerSearchProps {
  slotLabel: string;
  slotBadge?: string;
  selected: ProductListItem | null;
  onSelect: (product: ProductListItem) => void;
  onClear: () => void;
  accent?: "primary" | "muted";
}

export default function ProductPickerSearch({
  slotLabel,
  slotBadge = "A",
  selected,
  onSelect,
  onClear,
  accent = "primary",
}: ProductPickerSearchProps) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [results, setResults] = React.useState<ProductListItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const debouncedQ = useDebouncedValue(query, 350);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!debouncedQ.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    productService
      .getProducts({ search: debouncedQ.trim(), limit: 8 })
      .then((res) => {
        if (!cancelled) setResults(res.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isPrimary = accent === "primary";

  if (selected) {
    const img = resolveMediaUrl(
      selected.images?.[0]?.path ?? selected.thumbnail,
    );
    const minPrice = selected.price_range?.min ?? 0;
    const maxPrice = selected.price_range?.max ?? 0;

    return (
      <div
        className={cn(
          "group relative h-full overflow-hidden rounded-sm border bg-card/95 p-3.5 shadow-product backdrop-blur-sm transition-all duration-300 hover:shadow-product-hover sm:p-4",
          isPrimary ? "border-primary/35" : "border-foreground/15",
        )}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            isPrimary ? "bg-primary" : "bg-foreground/50",
          )}
        />

        <div className="mb-3 flex items-center justify-between gap-2 pl-2">
          <span
            className={cn(
              "inline-flex h-7 min-w-7 items-center justify-center rounded-sm px-2 font-heading text-xs font-bold",
              isPrimary
                ? "bg-primary text-primary-foreground"
                : "bg-foreground text-background",
            )}
          >
            {slotBadge}
          </span>
          <span className="rounded-sm bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
            Locked in
          </span>
        </div>

        <div className="flex items-start gap-3 pl-2 sm:gap-3.5">
          <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-sm border border-border bg-secondary/50">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt={selected.name}
                className="absolute inset-0 h-full w-full object-contain p-1.5 transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-muted-foreground/50" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
              {selected.name}
            </p>
            <p className="mt-1.5 font-heading text-base font-bold text-primary">
              ৳{minPrice.toLocaleString()}
              {maxPrice > minPrice ? (
                <span className="text-sm font-semibold text-muted-foreground">
                  {" "}
                  – {maxPrice.toLocaleString()}
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {selected.variations?.length ?? 0} variations
            </p>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-sm border border-border p-2 text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
            aria-label="Remove product"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full overflow-visible rounded-sm border border-dashed border-primary/35 bg-card/70 p-3.5 shadow-product backdrop-blur-sm sm:p-4",
        open && "z-[70]",
      )}
    >
      <div className="mb-3.5 flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-sm font-heading text-sm font-bold",
            isPrimary
              ? "bg-primary text-primary-foreground"
              : "bg-foreground text-background",
          )}
        >
          {slotBadge}
        </span>
        <div>
          <p className="font-heading text-sm font-bold text-foreground">
            {slotLabel}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Search catalog to fill this slot
          </p>
        </div>
      </div>

      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={`Search for ${slotLabel.toLowerCase()}…`}
          className="h-11 rounded-sm border-border bg-card pl-9 shadow-none focus-visible:border-primary focus-visible:ring-primary/20"
        />
        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : null}
      </div>

      {open && (query.trim().length > 0 || results.length > 0) ? (
        <div className="absolute left-0 right-0 z-[80] mt-2 rounded-sm border border-border bg-card shadow-product-hover animate-compare-pop">
          {results.length === 0 && !loading ? (
            <p className="px-4 py-7 text-center text-sm text-muted-foreground">
              No match for “{query}”
            </p>
          ) : (
            <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-sm">
              {results.map((p) => {
                const pImg = resolveMediaUrl(
                  p.images?.[0]?.path ?? p.thumbnail,
                );
                const minP = p.price_range?.min ?? 0;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-primary/5"
                      onClick={() => {
                        onSelect(p);
                        setQuery("");
                        setOpen(false);
                      }}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-sm border border-border bg-secondary/40">
                        {pImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={pImg}
                            alt={p.name}
                            className="absolute inset-0 h-full w-full object-contain p-0.5"
                            loading="lazy"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground/50" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {p.name}
                        </p>
                        <p className="font-heading text-xs font-bold text-primary">
                          ৳{minP.toLocaleString()}
                        </p>
                      </div>
                      <span className="hidden rounded-sm bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary sm:inline">
                        Add
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
