"use client";

import * as React from "react";
import Image from "next/image";
import { FiSearch, FiShoppingBag, FiX } from "react-icons/fi";
import { toPublicUrl } from "@/lib/utils";
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
  accentColor = "bg-black",
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

    setLoading(true);
    productService
      .getProducts({ search: debouncedQ.trim(), limit: 8 })
      .then((res) => setResults(res.products ?? []))
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

  if (selected) {
    const img = toPublicUrl(selected.images?.[0]?.path ?? selected.thumbnail);
    const minPrice = selected.price_range?.min ?? 0;
    const maxPrice = selected.price_range?.max ?? 0;

    return (
      <div className="bg-white p-3.5 shadow-[0px_0px_10px_rgba(0,0,0,0.06)] sm:p-4">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-black/[0.06] bg-gray-50 sm:h-16 sm:w-16">
            {img ? (
              <Image
                src={img}
                alt={selected.name}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <FiShoppingBag className="h-5 w-5 text-gray-300" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-snug text-black">
              {selected.name}
            </p>
            <p className="mt-0.5 text-xs font-medium text-black">
              ৳{minPrice.toLocaleString()}
              {maxPrice > minPrice ? ` – ${maxPrice.toLocaleString()}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {selected.variations?.length ?? 0} variations
            </p>
          </div>

          <button
            onClick={onClear}
            className="shrink-0 border border-black/[0.08] p-1.5 text-gray-500 transition hover:bg-black hover:text-white"
            aria-label="Remove product"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className={`mt-3 h-0.5 w-full ${accentColor}`} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className={`${accentColor} mb-3 px-3.5 py-2.5 sm:px-4`}>
        <Label className="inline-flex items-center gap-2 text-sm font-semibold text-white mb-0!">
          <FiSearch size={14} />
          {slotLabel}
        </Label>
      </div>

      <div className="relative">
        <FiSearch
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search product name..."
          className="rounded-none pl-9"
        />

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin border-2 border-black border-t-transparent" />
          </div>
        )}
      </div>

      {open && (query.trim().length > 0 || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden border border-black/[0.08] bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.08)]">
          {results.length === 0 && !loading ? (
            <p className="px-4 py-3 text-center text-sm text-gray-400">
              No products found
            </p>
          ) : (
            <ul className="max-h-72 divide-y divide-black/[0.04] overflow-y-auto">
              {results.map((p) => {
                const pImg = toPublicUrl(
                  p.images?.[0]?.path ?? p.thumbnail,
                );
                const minP = p.price_range?.min ?? 0;

                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-black/[0.01]"
                      onClick={() => {
                        onSelect(p);
                        setQuery("");
                        setOpen(false);
                      }}
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-black/[0.06] bg-gray-50">
                        {pImg ? (
                          <Image
                            src={pImg}
                            alt={p.name}
                            fill
                            className="object-contain p-0.5"
                            sizes="40px"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            <FiShoppingBag className="h-4 w-4 text-gray-300" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-black">
                          {p.name}
                        </p>
                        <p className="text-xs font-medium text-black">
                          ৳{minP.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
