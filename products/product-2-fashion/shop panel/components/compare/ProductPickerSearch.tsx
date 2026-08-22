"use client";

import * as React from "react";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { FiSearch, FiShoppingBag, FiX } from "react-icons/fi";
import { cn, toPublicUrl } from "@/lib/utils";
import { productService } from "@/lib/api/product/service";
import type { ProductListItem } from "@/lib/api/product/service";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductPickerSearchProps {
  slotLabel: string;
  selected: ProductListItem | null;
  onSelect: (product: ProductListItem) => void;
  onClear: () => void;
  accentColor?: string;
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

export default function ProductPickerSearch({
  slotLabel,
  selected,
  onSelect,
  onClear,
  accentColor = "bg-primary",
}: ProductPickerSearchProps) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [results, setResults] = React.useState<ProductListItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const debouncedQ = useDebouncedValue(query, 350);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    if (!debouncedQ.trim()) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    productService
      .getProducts({ search: debouncedQ.trim(), limit: 8 })
      .then((res) => {
        setResults(res.products ?? []);
        setActiveIndex(-1);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQ]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = React.useCallback(
    (product: ProductListItem) => {
      onSelect(product);
      setQuery("");
      setOpen(false);
      setActiveIndex(-1);
    },
    [onSelect],
  );

  const showPanel = open && query.trim().length > 0;

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel || results.length === 0) {
      if (e.key === "Escape") setOpen(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      e.preventDefault();
      pick(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  React.useEffect(() => {
    if (activeIndex < 0) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-pick="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (selected) {
    const img = toPublicUrl(selected.images?.[0]?.path ?? selected.thumbnail);
    const minPrice = selected.price_range?.min ?? 0;
    const maxPrice = selected.price_range?.max ?? 0;

    return (
      <div className="overflow-hidden rounded-xl border border-black/8 bg-white p-3.5 shadow-[0_8px_24px_rgba(20,16,12,0.05)] min-[768px]:p-4">
        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
          {slotLabel}
        </p>
        <div className="flex items-start gap-3 min-[768px]:items-center min-[768px]:gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#f4efe8] min-[768px]:h-16 min-[768px]:w-16">
            {img ? (
              <ImageWithFallback
                src={img}
                alt={selected.name}
                fill
                sizes="64px"
                className="object-contain p-1"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FiShoppingBag className="h-5 w-5 text-[#C8C2BA]" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-snug text-[#191919]">
              {selected.name}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[#191919]">
              ৳{minPrice.toLocaleString()}
              {maxPrice > minPrice ? ` – ${maxPrice.toLocaleString()}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-[#8A8A8A]">
              {selected.variations?.length ?? 0} variations
            </p>
          </div>

          <button
            onClick={onClear}
            className="shrink-0 rounded-lg border border-black/10 p-1.5 text-[#767676] transition hover:bg-[#191919] hover:text-white"
            aria-label="Remove product"
          >
            <FiX size={16} />
          </button>
        </div>
        <div className={`mt-3 h-0.5 w-full rounded-full ${accentColor}`} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-white shadow-[0_8px_24px_rgba(20,16,12,0.05)] transition-[border-color,box-shadow] duration-200",
          showPanel ? "border-black/15 shadow-[0_16px_40px_rgba(20,16,12,0.12)]" : "border-black/8",
        )}
      >
        <div className="p-3.5 min-[768px]:p-4">
          <Label className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
            <FiSearch size={13} />
            {slotLabel}
          </Label>

          <div className="relative">
            <FiSearch
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]"
            />
            <Input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Search product name..."
              className="rounded-lg pl-9"
              role="combobox"
              aria-expanded={showPanel}
              aria-autocomplete="list"
            />

            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#191919] border-t-transparent" />
              </div>
            )}
          </div>
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            showPanel ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-black/6">
              {loading && results.length === 0 ? (
                <p className="px-4 py-3 text-center text-xs text-[#8A8A8A]">Searching…</p>
              ) : results.length === 0 ? (
                <p className="px-4 py-3 text-center text-xs text-[#8A8A8A]">No products found</p>
              ) : (
                <>
                  <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
                    {results.length} result{results.length === 1 ? "" : "s"}
                  </p>
                  <ul ref={listRef} className="max-h-72 overflow-y-auto pb-1.5" role="listbox">
                    {results.map((p, i) => {
                      const pImg = toPublicUrl(p.images?.[0]?.path ?? p.thumbnail);
                      const minP = p.price_range?.min ?? 0;
                      const isActive = i === activeIndex;

                      return (
                        <li key={p.id}>
                          <button
                            type="button"
                            data-pick={i}
                            role="option"
                            aria-selected={isActive}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150",
                              isActive ? "bg-[#F6F4F0]" : "hover:bg-[#FAF8F5]",
                            )}
                            onMouseEnter={() => setActiveIndex(i)}
                            onClick={() => pick(p)}
                          >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#f4efe8]">
                              {pImg ? (
                                <ImageWithFallback
                                  src={pImg}
                                  alt={p.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover object-center"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center">
                                  <FiShoppingBag className="h-4 w-4 text-[#C8C2BA]" />
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-[#191919]">{p.name}</p>
                              <p className="mt-0.5 text-xs text-[#767676]">৳{minP.toLocaleString()}</p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
