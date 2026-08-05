"use client";

import SafeImage from "@/components/ui/SafeImage";
import { ModalShell } from "@/components/shared/ModalShell";
import { IMAGE_URL } from "@/config/env";
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
import { ArrowRight, AlertCircle, Clock, Loader2, Search, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

// ── Props ───────────────────────────────────────────────────────────────────

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchInputBarProps {
  query: string;
  isFetching: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onQueryChange: (val: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClear: () => void;
  onClose: () => void;
}

interface SearchResultItemProps {
  product: SearchSuggestion;
  isHighlighted: boolean;
  onSelect: () => void;
}

interface SearchResultsProps {
  results: SearchSuggestion[];
  highlightIndex: number;
  searchHref: string;
  onClose: () => void;
}

interface SearchSuggestionsProps {
  query: string;
  trendingNames: readonly string[];
  recentSearches: string[];
  onPick: (s: string) => void;
}

interface EmptyResultsProps {
  query: string;
}

interface SearchErrorStateProps {
  onRetry: () => void;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SearchInputBar({
  query,
  isFetching,
  inputRef,
  onQueryChange,
  onKeyDown,
  onClear,
  onClose,
}: SearchInputBarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 flex items-center gap-2.5 bg-secondary/60 border border-border/60 rounded-xl px-3.5 py-2.5 focus-within:border-accent transition-colors">
        <Search size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          maxLength={MAX_SEARCH_QUERY_LENGTH}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search products, brands…"
          autoFocus
          aria-label="Search"
          aria-autocomplete="list"
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/60 text-[15px] focus:outline-none tracking-wide"
        />
        {isFetching && (
          <Loader2 size={15} className="text-muted-foreground animate-spin shrink-0" aria-hidden="true" />
        )}
        {query && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="w-5 h-5 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
          >
            <X size={11} aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close search"
        className="shrink-0 flex items-center gap-1.5 text-accent hover:text-accent/80 font-medium tracking-wide transition-colors active:scale-95 cursor-pointer"
      >
        <span className="sm:hidden text-[13px]">Cancel</span>
        <span className="hidden sm:flex w-8 h-8 items-center justify-center rounded-full border border-border/60 bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
          <X size={15} aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}

function SearchResultItem({ product: p, isHighlighted, onSelect }: SearchResultItemProps) {
  const rawPath = p.thumbnail || p.images?.[0]?.path || "";
  const imgSrc = rawPath ? `${IMAGE_URL}${rawPath.startsWith("/") ? "" : "/"}${rawPath}` : "";
  return (
    <Link
      href={getProductHref(p.slug)}
      onClick={onSelect}
      id={`search-result-${p.id}`}
      role="option"
      aria-selected={isHighlighted}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
        isHighlighted ? "bg-secondary ring-1 ring-accent/20" : "hover:bg-secondary"
      }`}
    >
      <div className="w-11 h-14 bg-secondary rounded-md overflow-hidden shrink-0">
        <SafeImage
          src={imgSrc}
          alt={p.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground truncate font-medium">{p.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm font-semibold text-foreground">৳{p.price_range?.min ?? 0}</span>
          {p.price_range && p.price_range.max > p.price_range.min && (
            <span className="text-xs text-muted-foreground">- ৳{p.price_range.max}</span>
          )}
        </div>
      </div>
      <ArrowRight size={14} className="text-muted-foreground/40 shrink-0" aria-hidden="true" />
    </Link>
  );
}

function SearchResults({ results, highlightIndex, searchHref, onClose }: SearchResultsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
          Results ({results.length})
        </p>
        <Link
          href={searchHref}
          onClick={onClose}
          className="text-[10px] tracking-[0.15em] uppercase text-accent hover:text-accent/80 font-medium transition-colors flex items-center gap-1 cursor-pointer"
        >
          View All <ArrowRight size={10} aria-hidden="true" />
        </Link>
      </div>
      <div
        role="listbox"
        aria-label="Search results"
        className="space-y-0.5 max-h-[300px] overflow-y-auto overscroll-contain"
      >
        {results.map((p, i) => (
          <SearchResultItem
            key={p.id}
            product={p}
            isHighlighted={i === highlightIndex}
            onSelect={onClose}
          />
        ))}
      </div>
    </div>
  );
}

function SearchSuggestions({ query, trendingNames, recentSearches, onPick }: SearchSuggestionsProps) {
  const filtered = query
    ? trendingNames.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : [...trendingNames];

  return (
    <>
      {!query && recentSearches.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium mb-2.5 flex items-center gap-1.5">
            <Clock size={12} aria-hidden="true" /> Recent
          </p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => onPick(s)}
                className="px-3.5 py-1.5 text-xs tracking-wide bg-secondary text-secondary-foreground rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium mb-2.5 flex items-center gap-1.5">
          <TrendingUp size={12} aria-hidden="true" /> {query ? "Suggestions" : "Trending"}
        </p>
        <div className="space-y-0.5">
          {filtered.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => onPick(s)}
              className="w-full text-left px-3 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-secondary rounded-lg transition-all duration-150 flex items-center justify-between group cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Search size={13} className="text-muted-foreground/40" aria-hidden="true" />
                {s}
              </span>
              <ArrowRight
                size={12}
                className="text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-all duration-200"
                aria-hidden="true"
              />
            </button>
          ))}
          {query && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-2">
              No suggestions for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function EmptyResults({ query }: EmptyResultsProps) {
  return (
    <div className="py-8 text-center" role="status" aria-live="polite">
      <Search size={32} className="text-muted-foreground/20 mx-auto mb-3" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        No results found for &ldquo;
        <span className="text-foreground font-medium">{query}</span>
        &rdquo;
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
    </div>
  );
}

function SearchErrorState({ onRetry }: SearchErrorStateProps) {
  return (
    <div className="py-8 text-center" role="alert">
      <AlertCircle size={32} className="text-muted-foreground/30 mx-auto mb-3" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        Something went wrong
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 px-4 py-1.5 text-xs font-medium text-accent hover:text-accent/80 bg-accent/10 hover:bg-accent/15 rounded-full transition-colors cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const searchState = useSearchState({ debounceMs: 300 });
  const router = useRouter();

  const {
    query,
    debouncedQuery,
    highlightIndex,
    results,
    isError,
    isFetching,
    trendingNames,
    recent,
    handleQueryChange,
    handleClear,
    saveRecent,
    setHighlightIndex,
    inputRef,
    showResults,
    showEmpty,
  } = searchState;

  // Reset state when overlay opens
  useEffect(() => {
    if (isOpen) {
      handleClear();
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isOpen, handleClear, inputRef]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();

        if (results.length > 0 && highlightIndex >= 0) {
          saveRecent(results[highlightIndex].name);
          onClose();
          router.push(getProductHref(results[highlightIndex].slug));
          return;
        }

        const nextQuery = normalizeSearchQuery(query);
        if (nextQuery) {
          saveRecent(nextQuery);
          onClose();
          router.push(getShopSearchHref(nextQuery));
        }
        return;
      }

      if (!results.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
      }
    },
    [highlightIndex, onClose, query, router, results, saveRecent, setHighlightIndex],
  );

  // Compute active descendant ID for accessibility
  const activeDescendantId =
    showResults && highlightIndex >= 0 && results[highlightIndex]
      ? `search-result-${results[highlightIndex].id}`
      : undefined;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Search"
      containerClassName="fixed inset-0 z-[60]"
      panelClassName="relative bg-background border-b border-border shadow-2xl"
      panelOpenClassName="opacity-100 translate-y-0"
      panelClosedClassName="opacity-0 -translate-y-3"
      showCloseButton={false}
      closeDurationMs={250}
    >
      <div className="max-w-[700px] mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <SearchInputBar
          query={query}
          isFetching={isFetching}
          inputRef={inputRef}
          onQueryChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onClear={handleClear}
          onClose={onClose}
        />

        <div className="border-t border-border mt-4 pt-4">
          {isError ? (
            <SearchErrorState onRetry={handleClear} />
          ) : showResults && results.length > 0 ? (
            <SearchResults
              results={results}
              highlightIndex={highlightIndex}
              searchHref={getShopSearchHref(debouncedQuery)}
              onClose={onClose}
            />
          ) : showEmpty ? (
            <EmptyResults query={debouncedQuery} />
          ) : (
            <SearchSuggestions
              query={query}
              trendingNames={trendingNames}
              recentSearches={recent}
              onPick={handleQueryChange}
            />
          )}
        </div>
      </div>
    </ModalShell>
  );
};

export default SearchOverlay;
