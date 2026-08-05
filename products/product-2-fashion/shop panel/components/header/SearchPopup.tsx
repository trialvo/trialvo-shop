"use client";

import type { ProductSearchSuggestion } from "@/components/header-search/SearchField";
import type { HeaderSearchCategory } from "@/components/header-search/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, toPublicUrl } from "@/lib/utils";
import { XIcon } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { FiArrowRight, FiSearch, FiShoppingBag } from "react-icons/fi";

type SearchPopupProps = {
  open: boolean;
  onClose: () => void;
  categories: HeaderSearchCategory[];
  suggestions: ProductSearchSuggestion[];
  isLoading: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
};

function money(n: number): string {
  const num = Number(n);
  if (!Number.isFinite(num)) return "BDT 0";
  return `BDT ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SuggestionSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 px-5 py-3">
    <Skeleton className="h-12 w-12 shrink-0 rounded-none" />
    <div className="min-w-0 flex-1 space-y-2">
      <Skeleton className="h-3.5 w-3/5 rounded-sm" />
      <Skeleton className="h-3 w-2/5 rounded-sm" />
    </div>
    <Skeleton className="h-4 w-16 rounded-sm" />
  </div>
);

export default function SearchPopup({
  open,
  onClose,
  categories,
  suggestions,
  isLoading,
  query,
  onQueryChange,
  category,
  onCategoryChange,
}: SearchPopupProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const hasQuery = query.trim().length > 0;
  const list = Array.isArray(suggestions) ? suggestions : [];

  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => inputRef.current?.focus());
      });
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      setActiveIndex(-1);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const pick = React.useCallback((item: ProductSearchSuggestion) => {
    try {
      if (typeof window !== "undefined" && item.href)
        window.location.href = item.href;
    } catch {
      // navigation error
    }
    onClose();
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, list.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    }
    if (e.key === "Enter" && activeIndex >= 0 && activeIndex < list.length) {
      e.preventDefault();
      pick(list[activeIndex]);
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-start justify-center",
        "transition-all duration-300 ease-out",
        open
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/60",
          "transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 mt-[8vh] w-full max-w-[640px] sm:mt-[12vh]",
          "mx-3 sm:mx-4",
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "-translate-y-6 scale-95 opacity-0",
        )}
        data-search-panel
      >
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0px_25px_65px_-5px_rgba(0,0,0,0.25),0px_0px_0px_1px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-0">
            <FiSearch className="h-5 w-5 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="What are you looking for?"
              className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-black outline-none placeholder:text-gray-400"
            />
            {/* {hasQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQueryChange("");
                  inputRef.current?.focus();
                }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-black/[0.06] text-gray-500 transition hover:bg-black/10"
              >
                <FiX size={12} />
              </button>
            )} */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="flex h-7 w-7 items-center justify-center rounded-sm transition-all hover:bg-black/10 hover:opacity-100 opacity-70"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>

          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-black/[0.06] px-5 py-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => onCategoryChange(cat.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
                    category === cat.value
                      ? "bg-black text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-[50vh] min-h-[120px] overflow-y-auto overscroll-contain sm:max-h-[55vh]">
            {!hasQuery ? (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.03]">
                  <FiSearch className="h-5 w-5 text-gray-300" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-500">
                  Search across all products
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Type a product name, category, or keyword
                </p>
              </div>
            ) : isLoading ? (
              <>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SuggestionSkeleton key={i} />
                ))}
              </>
            ) : list.length > 0 ? (
              <ul>
                {list.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  const img =
                    typeof item.image === "string" && item.image.trim().length > 0
                      ? (toPublicUrl(item.image) ?? item.image)
                      : null;
                  const hasDiscount =
                    typeof item.oldPrice === "number" &&
                    Number.isFinite(item.oldPrice) &&
                    item.oldPrice > item.price;

                  return (
                    <li key={`${item.id}-${idx}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pick(item)}
                        className={cn(
                          "group flex w-full cursor-pointer items-center gap-4 px-5 py-3 text-left transition-colors duration-100",
                          isActive ? "bg-black/[0.03]" : "bg-white",
                        )}
                      >
                        <div
                          className={cn(
                            "relative h-13 w-13 shrink-0 overflow-hidden border bg-[#fafafa] transition-all duration-200",
                            isActive ? "border-black/15" : "border-black/[0.06]",
                          )}
                        >
                          {img ? (
                            <Image
                              src={img}
                              alt={item.name}
                              fill
                              sizes="52px"
                              className="object-contain p-.5"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <FiShoppingBag className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm transition-colors",
                              isActive ? "font-semibold text-black" : "font-medium text-gray-800",
                            )}
                          >
                            {item.name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-sm font-bold text-black">
                              {money(item.price)}
                            </span>
                            {hasDiscount && item.oldPrice != null && (
                              <span className="text-xs text-gray-400 line-through">
                                {money(item.oldPrice)}
                              </span>
                            )}
                            {item.offerText && (
                              <span className="bg-black px-1.5 py-px text-[10px] font-semibold text-white">
                                {item.offerText}
                              </span>
                            )}
                          </div>
                        </div>

                        <FiArrowRight
                          className={cn(
                            "h-4 w-4 shrink-0 transition-all duration-200",
                            isActive
                              ? "translate-x-0 text-black opacity-100"
                              : "-translate-x-1 text-gray-300 opacity-0",
                          )}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                  <FiSearch className="h-5 w-5 text-red-300" />
                </div>
                <p className="mt-4 text-sm font-medium text-gray-700">
                  No results for &quot;{query}&quot;
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Try a different keyword or browse categories above
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 border-t border-black/[0.06] px-5 py-2.5">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
              <kbd className="rounded border border-black/[0.06] bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium">esc</kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
