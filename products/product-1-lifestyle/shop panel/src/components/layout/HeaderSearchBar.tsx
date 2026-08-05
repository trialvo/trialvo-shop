"use client";

import {
  useSearchState,
  MAX_SEARCH_QUERY_LENGTH,
} from "@/hooks/useSearch";
import type { SearchSuggestion } from "@/lib/api/product/search-types";
import {
  getProductHref,
  getShopSearchHref,
  normalizeSearchQuery,
} from "@/lib/routes";
import { cn } from "@/lib/utils";
import { DROPDOWN_PANEL_CLASSES, DROPDOWN_ITEM_CLASSES } from "@/lib/theme";
import { AlertCircle, ArrowRight, Clock, Loader2, Search, SlidersHorizontal, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import SafeImage from "@/components/ui/SafeImage";
import { IMAGE_URL } from "@/config/env";

/** Resolve a product image path to a full URL. */
function toSearchImageUrl(thumbnail: string | null, images?: ReadonlyArray<{ path: string }>): string {
  const raw = thumbnail || images?.[0]?.path || "";
  if (!raw) return "";
  return `${IMAGE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

// ── Sub-component props ─────────────────────────────────────────────────────

interface DropdownErrorStateProps {
  onRetry: () => void;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function DropdownErrorState({ onRetry }: DropdownErrorStateProps) {
  return (
    <div className="py-8 px-4 text-center" role="alert">
      <AlertCircle size={28} className="text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-sm font-medium text-foreground">
        Something went wrong
      </p>
      <p className="text-xs text-muted-foreground mt-1">Please try again</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors cursor-pointer"
      >
        Try Again
      </button>
    </div>
  );
}

/* ── Component ──────────────────────────────────────────────────────── */
export function HeaderSearchBar() {
  const searchState = useSearchState({ debounceMs: 280 });
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    query,
    debouncedQuery,
    highlightIndex,
    results,
    isLoading,
    isError,
    isFetching,
    trendingNames,
    recent,
    handleQueryChange,
    handleClear,
    saveRecent,
    clearRecent,
    setHighlightIndex,
    inputRef,
  } = searchState;

  /* Reset highlight when query changes */
  useEffect(() => { setHighlightIndex(-1); }, [query, setHighlightIndex]);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Escape closes dropdown */
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") { setIsFocused(false); inputRef.current?.blur(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inputRef]);

  /* Close dropdown on page scroll */
  useEffect(() => {
    if (!isFocused) return;

    const onScroll = () => {
      setIsFocused(false);
      inputRef.current?.blur();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isFocused, inputRef]);

  const hasResults   = results.length > 0 && debouncedQuery.length >= 2;
  const noResults    = debouncedQuery.length >= 2 && !isLoading && results.length === 0;
  const showDropdown = isFocused;

  const handleSearch = useCallback(() => {
    const q = normalizeSearchQuery(query);
    if (!q) return;

    saveRecent(q);
    setIsFocused(false);
    router.push(getShopSearchHref(q));
  }, [query, router, saveRecent]);

  /* Keyboard navigation */
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (hasResults && results.length > 0 && highlightIndex >= 0 && results[highlightIndex]) {
          const selectedProduct = results[highlightIndex];
          saveRecent(selectedProduct.name);
          setIsFocused(false);
          router.push(getProductHref(selectedProduct.slug));
          return;
        }

        handleSearch();
        return;
      }

      if (!hasResults || results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, -1));
      }
    },
    [handleSearch, hasResults, highlightIndex, results, router, saveRecent, setHighlightIndex],
  );

  const handleSuggestionClick = (term: string) => {
    const normalizedTerm = normalizeSearchQuery(term);
    if (!normalizedTerm) return;

    saveRecent(normalizedTerm);
    handleQueryChange(normalizedTerm);
    setIsFocused(false);
    router.push(getShopSearchHref(normalizedTerm));
  };

  const isSpinning = isFetching && debouncedQuery.length >= 2;

  // Compute active descendant ID for accessibility
  const activeDescendantId =
    hasResults && highlightIndex >= 0 && results[highlightIndex]
      ? `header-search-result-${results[highlightIndex].id}`
      : undefined;

  return (
    <div
      ref={containerRef}
      className="flex-1 max-w-[600px] mx-4 xl:mx-8 relative"
    >
      {/* ── Search input pill ── */}
      <div
        className={cn(
          "flex h-10 xl:h-11 rounded-full overflow-hidden",
          "border-2 transition-all duration-200",
          "bg-background shadow-sm",
          isFocused
            ? "border-accent shadow-md shadow-accent/10"
            : "border-border hover:border-accent/50"
        )}
      >
        {/* Leading icon */}
        <span className="flex items-center pl-4 text-muted-foreground shrink-0">
          {isSpinning
            ? <Loader2 size={15} className="animate-spin text-accent" />
            : <Search size={15} className={cn("transition-colors", isFocused && "text-accent")} />
          }
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          maxLength={MAX_SEARCH_QUERY_LENGTH}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, brands, categories…"
          autoComplete="off"
          spellCheck={false}
          aria-label="Search"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-activedescendant={activeDescendantId}
          className="flex-1 px-3 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none min-w-0 tracking-wide"
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => { handleClear(); inputRef.current?.focus(); }}
            className="flex items-center px-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X size={13} />
          </button>
        )}

        {/* Divider */}
        <span className="w-px bg-border/60 my-2 shrink-0" />

        {/* Search CTA button */}
        <button
          type="button"
          onClick={handleSearch}
          className={cn(
            "flex items-center gap-1.5 px-4 xl:px-5 shrink-0 cursor-pointer",
            "bg-accent hover:bg-accent/90 active:bg-accent/80",
            "text-accent-foreground text-xs font-semibold tracking-wide",
            "transition-colors rounded-r-full"
          )}
          aria-label="Search"
        >
          <Search size={13} />
          <span className="hidden xl:inline">Search</span>
        </button>
      </div>

      {/* ── Dropdown panel ── */}
      {showDropdown && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 z-[60] mt-1.5",
            DROPDOWN_PANEL_CLASSES,
            "overflow-hidden",
          )}
          role="listbox"
        >
          {/* ── Has query — show live results ── */}
          {debouncedQuery.length >= 2 ? (
            <>
              {isError ? (
                <DropdownErrorState onRetry={handleClear} />
              ) : hasResults && results.length > 0 ? (
                <div>
                  {/* Results header */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                      Products ({results.length})
                    </p>
                    <Link
                      href={getShopSearchHref(debouncedQuery)}
                      onClick={() => setIsFocused(false)}
                      className="flex items-center gap-1 text-[10px] tracking-wide uppercase text-accent hover:text-accent/80 font-semibold transition-colors"
                    >
                      See all <ArrowRight size={10} />
                    </Link>
                  </div>

                  {/* Result rows */}
                  <ul className="max-h-[280px] overflow-y-auto px-2 pb-2">
                    {results.slice(0, 6).map((p: SearchSuggestion, i: number) => (
                      <li key={p.id}>
                        <Link
                          href={getProductHref(p.slug)}
                          onClick={() => {
                            saveRecent(p.name);
                            setIsFocused(false);
                          }}
                          id={`header-search-result-${p.id}`}
                          className={cn(
                            DROPDOWN_ITEM_CLASSES, "px-3 py-2 group",
                            i === highlightIndex
                              ? "bg-accent/8 text-accent"
                              : "hover:bg-secondary"
                          )}
                          role="option"
                          aria-selected={i === highlightIndex}
                        >
                          {/* Product image */}
                          <div className="w-10 h-12 rounded-lg overflow-hidden shrink-0 bg-secondary">
                            <SafeImage
                              src={toSearchImageUrl(p.thumbnail, p.images)}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-foreground truncate">{p.name}</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                              <span className="text-sm font-bold text-foreground">৳{p.price_range?.min ?? 0}</span>
                              {p.price_range && p.price_range.max > p.price_range.min && (
                                <span className="text-xs text-muted-foreground">- ৳{p.price_range.max}</span>
                              )}
                            </div>
                          </div>
                          <ArrowRight size={13} className="text-muted-foreground/30 group-hover:text-accent shrink-0 transition-colors" />
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {/* Full search CTA */}
                  <div className="border-t border-border mx-4 mb-3 pt-2.5">
                    <Link
                      href={getShopSearchHref(debouncedQuery)}
                      onClick={() => setIsFocused(false)}
                      className={cn(DROPDOWN_ITEM_CLASSES, "justify-center w-full py-2 text-[12px] font-semibold tracking-wide text-accent hover:bg-accent/8 cursor-pointer")}
                    >
                      <Search size={12} />
                      Search for &quot;{debouncedQuery}&quot;
                    </Link>
                  </div>
                </div>
              ) : noResults ? (
                /* No results state */
                <div className="py-8 px-4 text-center">
                  <Search size={28} className="text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">
                    No results for &ldquo;{debouncedQuery}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different term or browse all products</p>
                  <Link
                    href="/shop"
                    onClick={() => setIsFocused(false)}
                    className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-semibold hover:bg-accent/20 transition-colors cursor-pointer"
                  >
                    Browse All <ArrowRight size={11} />
                  </Link>
                </div>
              ) : (
                /* Loading skeleton */
                <div className="px-4 py-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-12 rounded-lg bg-secondary shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-secondary rounded w-3/4" />
                        <div className="h-2 bg-secondary rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* ── No query — show recent + trending ── */
            <div className="p-3 space-y-3">
              {/* Recent searches */}
              {recent.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-1 mb-1.5">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                      <Clock size={11} /> Recent
                    </p>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {recent.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSuggestionClick(term)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary hover:bg-accent/10 hover:text-accent text-[12px] text-foreground/70 transition-all duration-150 cursor-pointer"
                      >
                        <Clock size={10} className="opacity-50" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div>
                <p className="flex items-center gap-1.5 px-1 mb-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                  <TrendingUp size={11} /> Trending
                </p>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {trendingNames.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSuggestionClick(term)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-accent/40 hover:bg-accent/8 hover:text-accent text-[12px] text-foreground/70 transition-all duration-150 cursor-pointer"
                    >
                      <TrendingUp size={10} className="opacity-50" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick browse links */}
              <div className="border-t border-border pt-2.5 px-1">
                <p className="flex items-center gap-1.5 mb-2 text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                  <SlidersHorizontal size={11} /> Browse by Category
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(["Men", "Women", "Kids", "Footwear", "Fragrance", "Accessories"] as const).map((cat) => (
                    <Link
                      key={cat}
                      href={`/shop?category=${encodeURIComponent(cat)}`}
                      onClick={() => setIsFocused(false)}
                      className="px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-[11px] font-semibold hover:bg-accent/85 transition-colors cursor-pointer"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
