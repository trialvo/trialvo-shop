"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, toPublicUrl } from "@/lib/utils";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import * as React from "react";
import { CiImageOff } from "react-icons/ci";
import { FiSearch, FiX } from "react-icons/fi";
import { LuSearchX } from "react-icons/lu";
import { useAnalytics } from "@/lib/analytics/useAnalytics";

export type ProductSearchSuggestion = {
  id: string | number;
  name: string;
  image?: string | null;
  price: number;
  oldPrice?: number | null;
  offerText?: string | null;
  href: string;
};

type Props = {
  value: string;
  onChange: (next: string) => void;

  onSubmit?: () => void;
  onClear?: () => void;

  placeholder?: string;
  className?: string;

  suggestions?: ProductSearchSuggestion[];
  isLoading?: boolean;

  onPickSuggestion?: (item: ProductSearchSuggestion) => void;

  skeletonCount?: number;
  maxHeightPx?: number;
};

function money(n: number): string {
  const num = Number(n);
  if (!Number.isFinite(num)) return "BDT 0.00";
  return `BDT ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SuggestionRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <Skeleton className="h-11 w-11 shrink-0 rounded-none" />

      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4 rounded-none" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16 rounded-none" />
          <Skeleton className="h-3 w-12 rounded-none" />
        </div>
      </div>

      <div className="w-20 text-right">
        <Skeleton className="ml-auto h-3 w-16 rounded-none" />
      </div>
    </div>
  );
};

const SearchField: React.FC<Props> = React.memo(
  ({
    value,
    onChange,
    onSubmit,
    onClear,
    placeholder = "Search Here...",
    className,

    suggestions = [],
    isLoading = false,
    onPickSuggestion,

    skeletonCount = 6,
    maxHeightPx = 320,
  }) => {
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const { trackSearch } = useAnalytics();

    const [open, setOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState<number>(-1);

    const query = value ?? "";
    const hasQuery = query.trim().length > 0;

    const list = React.useMemo(() => (Array.isArray(suggestions) ? suggestions : []), [suggestions]);

    React.useEffect(() => {
      if (!hasQuery) {
        setOpen(false);
        setActiveIndex(-1);
        return;
      }
      setOpen(true);
    }, [hasQuery]);

    React.useEffect(() => {
      const onDocDown = (e: MouseEvent) => {
        const el = wrapperRef.current;
        if (!el) return;
        if (!el.contains(e.target as Node)) {
          setOpen(false);
          setActiveIndex(-1);
        }
      };

      document.addEventListener("mousedown", onDocDown);
      return () => document.removeEventListener("mousedown", onDocDown);
    }, []);

    const handleClear = React.useCallback(() => {
      onChange("");
      onClear?.();
      setOpen(false);
      setActiveIndex(-1);
    }, [onChange, onClear]);

    const pick = React.useCallback(
      (item: ProductSearchSuggestion) => {
        onPickSuggestion?.(item);

        try {
          if (typeof window !== "undefined" && item.href) window.location.href = item.href;
        } catch {
          // ignore
        }

        setOpen(false);
        setActiveIndex(-1);
      },
      [onPickSuggestion],
    );

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (open && activeIndex >= 0 && activeIndex < list.length) {
          e.preventDefault();
          pick(list[activeIndex]);
          return;
        }
        onSubmit?.();
        if (query.trim()) trackSearch(query.trim());
      }

      if (e.key === "Escape") {
        e.preventDefault();
        if (open) {
          setOpen(false);
          setActiveIndex(-1);
        } else {
          handleClear();
        }
      }

      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(activeIndex + 1, list.length - 1);
        setActiveIndex(next);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = Math.max(activeIndex - 1, -1);
        setActiveIndex(next);
      }
    };

    const showDropdown = open && hasQuery;

    return (
      <div ref={wrapperRef} className={cn("relative flex-1", className)}>
        <div className="flex h-full items-center px-3">
          <FiSearch className="mr-2 h-5 w-5 text-black/45" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "h-full border-transparent! bg-transparent! rounded-none px-0",
              "placeholder:text-sm placeholder:text-black/45",
              "focus:border-transparent! focus:outline-none! focus:ring-0! focus:ring-offset-0! focus:shadow-none!",
              "focus-visible:border-transparent! focus-visible:outline-none! focus-visible:ring-0! focus-visible:ring-offset-0!",
              "active:border-transparent! active:outline-none!",
              "hover:border-transparent!",
            )}
            onKeyDown={onKeyDown}
            onFocus={() => {
              if (hasQuery) setOpen(true);
            }}
          />

          <Button
            type="button"
            variant="ghost"
            onClick={handleClear}
            aria-label="Clear search"
            className={cn(
              "ml-2 h-7 w-7 rounded-none p-0",
              "hover:bg-black/5",
              hasQuery ? "opacity-100" : "pointer-events-none opacity-0",
              "transition-opacity duration-200",
            )}
          >
            <FiX className="h-5 w-5 text-black/60" />
          </Button>
        </div>

        <div
          className={cn(
            "absolute -left-26 sm:left-0 right-0 top-full z-30 mt-1",
            "transition-all duration-200 ease-out",
            showDropdown ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
          )}
        >
          <div className="rounded-none border-0 bg-white shadow-[6px_0_18px_rgba(0,0,0,0.06)]">
            {isLoading ? (
              <div className="py-1" style={{ maxHeight: maxHeightPx, overflow: "hidden" }}>
                {Array.from({ length: skeletonCount }).map((_, idx) => (
                  <SuggestionRowSkeleton key={`sk-${idx}`} />
                ))}
              </div>
            ) : list.length > 0 ? (
              <ul className="py-1" style={{ maxHeight: maxHeightPx, overflow: "auto" }}>
                {list.map((item, idx) => {
                  const isActive = idx === activeIndex;

                  const img =
                    typeof item.image === "string" && item.image.trim().length > 0
                      ? toPublicUrl(item.image) ?? item.image
                      : null;

                  const hasDiscount =
                    typeof item.oldPrice === "number" &&
                    Number.isFinite(item.oldPrice) &&
                    item.oldPrice > item.price;

                  return (
                    <li key={`${item.id}-${idx}`} className="group cursor-pointer">
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pick(item)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2 text-left",
                          "transition-colors cursor-pointer",
                          isActive ? "bg-black/5" : "bg-white",
                        )}
                      >
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden  border border-[#EDEDED] bg-[#F6F6F6] group-hover:border-[#636363] transition-all">
                          {img ? (
                            <ImageWithFallback src={img} alt={item.name} fill sizes="44px" className="object-cover" />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-xs text-black/50">
                              <CiImageOff className="h-6 w-6 text-foreground/50" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-black">{item.name}</p>

                          <div className="mt-1 flex items-center gap-2">
                            {item.offerText ? (
                              <span className="inline-flex items-center rounded-none bg-black px-2 py-0.5 text-[11px] font-semibold text-white">
                                {item.offerText}
                              </span>
                            ) : null}

                            {hasDiscount ? (
                              <span className="text-[11px] font-medium text-black/60 line-through">
                                {money(item.oldPrice as number)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-black">{money(item.price)}</p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex items-start gap-2 px-3 py-3">
                <LuSearchX className="mt-0.5 h-4 w-4 text-black/50" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-black">No match found</p>
                  <p className="text-xs text-black/60">Try a different keyword or check spelling.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

SearchField.displayName = "SearchField";

export default SearchField;
