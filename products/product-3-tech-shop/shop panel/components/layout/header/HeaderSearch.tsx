"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import { Clock, Search, TrendingUp, X } from "lucide-react";
import { useProductSearch } from "@/hooks/useProductSearch";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useTrendingSearches } from "@/hooks/useTrendingSearches";
import { buildShopSearchHref } from "@/lib/security/search";
import { AppInput } from "@/components/shared/AppInput";
import { RightArrowIcon } from "@/components/shared/RightArrowIcon";
import { ClearRecentSearchesDialog } from "@/components/layout/header/ClearRecentSearchesDialog";

type HeaderSearchProps = Readonly<{
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onNavigated?: () => void;
  /** Called when the suggestion panel should close (escape, outside click, scroll). */
  onClose?: () => void;
}>;

const HeaderSearch = ({
  className = "relative w-full",
  inputClassName,
  placeholder = "Search for gadgets, accessories...",
  autoFocus = false,
  onNavigated,
  onClose,
}: HeaderSearchProps): ReactElement => {
  const router = useRouter();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const { recent, remember, forget, clear } = useRecentSearches();
  const { trending, trendingLoading } = useTrendingSearches(8);

  const { suggestions, isSearching, canSearch, query } = useProductSearch(
    searchQuery,
    { limit: 6, minLength: 2, enabled: open },
  );

  const closePanel = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  // Outside click closes suggestions (but not while confirm dialog is open)
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (confirmClearOpen) return;
      if (!containerRef.current?.contains(event.target as Node)) {
        closePanel();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [closePanel, confirmClearOpen]);

  // Page scroll closes open search; scrolling inside the panel must not
  useEffect(() => {
    if (!open || confirmClearOpen) return;

    const onScroll = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Node &&
        containerRef.current?.contains(target)
      ) {
        return;
      }
      closePanel();
    };

    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open, confirmClearOpen, closePanel]);

  const navigateToSearch = (value?: string) => {
    const term = (value ?? searchQuery).trim();
    const href = buildShopSearchHref(term);
    if (term) remember(term);
    setSearchQuery(term);
    closePanel();
    router.push(href);
    onNavigated?.();
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigateToSearch();
  };

  const handleConfirmClear = () => {
    clear();
    setConfirmClearOpen(false);
    setOpen(true);
  };

  const showIdlePanel = open && !canSearch;
  const showResultsPanel = open && canSearch;
  const showClear = searchQuery.length > 0;

  return (
    <div ref={containerRef} className={className}>
      <form onSubmit={handleSubmit} role="search" className="relative w-full">
        {/* type="text" avoids the native WebKit search cancel (second X) */}
        <AppInput
          type="text"
          name="q"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          maxLength={100}
          placeholder={placeholder}
          value={searchQuery}
          sanitize="search"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          leftIcon={<Search className="h-4 w-4" />}
          onFocus={() => setOpen(true)}
          onValueChange={(value) => {
            setSearchQuery(value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              if (confirmClearOpen) {
                setConfirmClearOpen(false);
                return;
              }
              closePanel();
            }
          }}
          className={["pr-10", inputClassName].filter(Boolean).join(" ")}
          containerClassName="w-full"
        />
        {showClear ? (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            onClick={() => {
              setSearchQuery("");
              setOpen(true);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </form>

      {showIdlePanel ? (
        <div
          id={listId}
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-sm border border-border bg-card shadow-xl overflow-hidden"
        >
          <div className="max-h-[min(70vh,420px)] overflow-y-auto overscroll-contain">
            {recent.length > 0 ? (
              <section className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Recent searches
                  </p>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setConfirmClearOpen(true);
                    }}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <ul className="space-y-0.5">
                  {recent.map((term) => (
                    <li key={term} className="flex items-center group">
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-2.5 px-2 py-2 text-sm text-left rounded-sm hover:bg-secondary transition-colors min-w-0"
                        onClick={() => navigateToSearch(term)}
                      >
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{term}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${term}`}
                        className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-opacity"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          forget(term);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2.5 px-1">
                <TrendingUp className="h-3.5 w-3.5" /> Trending now
              </p>
              {trendingLoading && trending.length === 0 ? (
                <div className="flex flex-wrap gap-2 px-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-7 w-20 rounded-full bg-secondary animate-pulse"
                    />
                  ))}
                </div>
              ) : trending.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1 py-2">
                  Start typing to search products
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 px-1">
                  {trending.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => navigateToSearch(term)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/80 text-foreground hover:bg-primary/10 hover:text-primary border border-border/60 transition-colors"
                    >
                      <TrendingUp className="h-3 w-3 text-accent" />
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}

      {showResultsPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-sm border border-border bg-card shadow-xl overflow-hidden"
        >
          {isSearching ? (
            <div className="px-4 py-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-sm bg-secondary" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-3/4 bg-secondary rounded-sm" />
                    <div className="h-3 w-16 bg-secondary rounded-sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No products found for &ldquo;{query}&rdquo;
              </p>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                onClick={() => navigateToSearch()}
              >
                Search shop anyway
                <RightArrowIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto overscroll-contain py-1">
              {suggestions.map((product) => (
                <li key={product.id} role="option">
                  <Link
                    href={`/product/${product.slug}`}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/80 transition-colors"
                    onClick={() => {
                      remember(query);
                      closePanel();
                      onNavigated?.();
                    }}
                  >
                    <img
                      src={product.image}
                      alt=""
                      className="h-11 w-11 rounded-sm object-cover bg-secondary shrink-0 border border-border/50"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate leading-snug">
                        {product.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-primary">
                          ৳{product.price.toLocaleString()}
                        </span>
                        {product.brand ? (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {product.brand}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-secondary border-t border-border"
                  onClick={() => navigateToSearch()}
                >
                  <span>View all results for &ldquo;{query}&rdquo;</span>
                  <RightArrowIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            </ul>
          )}
        </div>
      ) : null}

      <ClearRecentSearchesDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        onConfirm={handleConfirmClear}
        count={recent.length}
      />
    </div>
  );
};

export default HeaderSearch;
