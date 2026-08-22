"use client";

import type { ProductSearchSuggestion } from "@/components/header-search/SearchField";
import type { HeaderSearchCategory } from "@/components/header-search/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useHandleFavoriteClick } from "@/hooks/useHandleFavoriteClick";
import { useFavorite } from "@/hooks/useFavorite";
import { cn, toPublicUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiHeart, FiSearch, FiShoppingBag, FiX } from "react-icons/fi";

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
  viewport?: "desktop" | "mobile";
};

function useViewportActive(viewport?: "desktop" | "mobile"): boolean {
  const [active, setActive] = React.useState(false);

  React.useLayoutEffect(() => {
    if (!viewport) {
      setActive(true);
      return;
    }
    const query = window.matchMedia(
      viewport === "desktop" ? "(min-width: 768px)" : "(max-width: 767px)",
    );
    const sync = () => setActive(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [viewport]);

  return active;
}

const ACCENT = "#E31C3D";

function money(n: number): string {
  const num = Number(n);
  if (!Number.isFinite(num)) return "BDT 0.00";
  return `BDT ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function brandFromName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? name;
  return first.toUpperCase();
}

function titleFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return parts.slice(1).join(" ");
}

const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("shrink-0", className)}>
    <Skeleton className="aspect-[2/3] w-full rounded-none" />
    <Skeleton className="mx-auto mt-3 h-3 w-16 rounded-none" />
    <Skeleton className="mx-auto mt-2 h-3 w-12 rounded-none" />
  </div>
);

type ProductTileProps = {
  item: ProductSearchSuggestion;
  onPick: (item: ProductSearchSuggestion) => void;
  className?: string;
  active?: boolean;
};

const ProductTile: React.FC<ProductTileProps> = ({ item, onPick, className, active }) => {
  const handleFavoriteClick = useHandleFavoriteClick();
  const { isAuthenticated } = useFavorite();
  const [isFavourite, setIsFavourite] = React.useState(item.isFavourite === true);

  React.useEffect(() => {
    setIsFavourite(item.isFavourite === true);
  }, [item.id, item.isFavourite]);

  const img =
    typeof item.image === "string" && item.image.trim().length > 0
      ? (toPublicUrl(item.image) ?? item.image)
      : null;
  const hasDiscount =
    typeof item.oldPrice === "number" &&
    Number.isFinite(item.oldPrice) &&
    item.oldPrice > item.price;

  const goToDetails = () => onPick(item);

  return (
    <div
      role="link"
      tabIndex={0}
      onMouseDown={(e) => e.preventDefault()}
      onClick={goToDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDetails();
        }
      }}
      className={cn(
        "group flex w-full cursor-pointer flex-col text-center",
        active && "opacity-95",
        className,
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#f3f3f3]">
        {img ? (
          <Image
            src={img}
            alt={item.name}
            fill
            sizes="180px"
            className="object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FiShoppingBag className="h-6 w-6 text-[#c4c4c4]" />
          </div>
        )}

        {item.offerText ? (
          <div className="absolute inset-x-0 bottom-0 bg-black/35 px-2 py-1.5">
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
              {item.offerText}
            </span>
          </div>
        ) : null}

        <button
          type="button"
          aria-label={isFavourite ? "Remove from favorites" : "Add to favorites"}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const productId = Number(item.id);
            if (!Number.isFinite(productId) || productId <= 0) return;
            handleFavoriteClick({ id: productId, is_favourite: isFavourite });
            if (isAuthenticated) setIsFavourite((prev) => !prev);
          }}
          className="absolute bottom-2 right-2 z-10 grid h-8 w-8 place-items-center text-white drop-shadow transition-transform hover:scale-110"
        >
          <FiHeart
            className={cn("h-4 w-4", isFavourite && "fill-white")}
            strokeWidth={1.5}
          />
        </button>
      </div>

      <div className="mt-2.5 min-w-0 px-1">
        <p className="truncate text-[11px] font-bold uppercase tracking-[0.04em] text-[#191919]">
          {brandFromName(item.name)}
        </p>
        <p className="mt-0.5 truncate text-[12px] font-normal text-[#191919]">
          {titleFromName(item.name)}
        </p>
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <span className="text-[12px] font-bold text-[#191919]">{money(item.price)}</span>
          {hasDiscount && item.oldPrice != null ? (
            <span className="text-[11px] text-[#767676] line-through">{money(item.oldPrice)}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

/** Shopbop search drawer — right panel, trending + bestseller carousel */
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
  viewport,
}: SearchPopupProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const bodyScrollRef = React.useRef<HTMLDivElement>(null);
  const viewportActive = useViewportActive(viewport);
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);
  const [bodyScrolling, setBodyScrolling] = React.useState(false);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  const hasQuery = query.trim().length > 0;
  const list = Array.isArray(suggestions) ? suggestions : [];

  const selectedLabel = React.useMemo(() => {
    const found = categories.find((c) => c.value === category);
    if (found && found.value !== "all") return found.label;
    const first = categories.find((c) => c.value !== "all");
    return first?.label ?? "All";
  }, [categories, category]);

  const trending = React.useMemo(
    () => categories.filter((c) => c.value !== "all").slice(0, 12),
    [categories],
  );

  const updateScrollState = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useLayoutEffect(() => {
    setPortalTarget(document.body);
  }, []);

  React.useLayoutEffect(() => {
    if (!viewportActive) return;

    if (open) {
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbar > 0) {
        document.body.style.paddingRight = `${scrollbar}px`;
      }
      document.body.style.overflow = "hidden";
      return;
    }

    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  }, [open, viewportActive]);

  React.useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, []);

  React.useEffect(() => {
    if (!viewportActive || !open) {
      setActiveIndex(-1);
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 320);
    return () => window.clearTimeout(timer);
  }, [open, viewportActive]);

  React.useEffect(() => {
    const el = bodyScrollRef.current;
    if (!el || !open) {
      setBodyScrolling(false);
      return;
    }
    let timer = 0;
    const onScroll = () => {
      setBodyScrolling(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setBodyScrolling(false), 800);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open || hasQuery) return;
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [open, hasQuery, list.length, isLoading, updateScrollState]);

  const pick = React.useCallback((item: ProductSearchSuggestion) => {
    try {
      if (typeof window !== "undefined" && item.href) window.location.href = item.href;
    } catch {
      // navigation error
    }
  }, []);

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

  const scrollByCard = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-product-card]");
    const step = card ? card.offsetWidth + 8 : el.clientWidth * 0.7;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const placeholder =
    selectedLabel && selectedLabel !== "All"
      ? `Search ${selectedLabel}'s`
      : "Search";

  if (!viewportActive || !portalTarget) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[1100] overflow-hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[3px]"
        style={{
          opacity: open ? 1 : 0,
          transition: "opacity 320ms ease-out",
        }}
        onClick={onClose}
        aria-hidden
      />

      <div
        data-search-panel
        dir="ltr"
        className={cn(
          "fixed top-0 right-0 bottom-0 flex h-full w-full flex-col bg-white",
          "min-[576px]:w-[520px] min-[576px]:max-w-full",
          "min-[768px]:w-[560px]",
          "min-[992px]:w-[620px]",
          "min-[1200px]:w-[680px]",
          "min-[1400px]:w-[720px]",
          "shadow-[-8px_0_40px_rgba(0,0,0,0.08)]",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          "motion-reduce:transition-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Close */}
        <div className="mb-3 flex shrink-0 justify-end px-3 pt-3 min-[576px]:mb-4 min-[576px]:px-4 min-[576px]:pt-4 min-[768px]:px-5 min-[992px]:mb-5 min-[992px]:px-6 min-[1200px]:px-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full text-[#191919]",
              "bg-transparent transition-[background-color,transform,color] duration-300 ease-out",
              "hover:bg-black/[0.06] hover:text-black active:scale-95 active:bg-black/[0.1]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
              "min-[992px]:h-10 min-[992px]:w-10",
            )}
          >
            <FiX className="h-5 w-5 min-[992px]:h-[22px] min-[992px]:w-[22px]" strokeWidth={1.5} />
          </button>
        </div>

        <div
          ref={bodyScrollRef}
          className={cn(
            "search-drawer-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-8 min-[576px]:px-4 min-[576px]:pb-10 min-[768px]:px-5 min-[992px]:px-6 min-[1200px]:px-7",
            bodyScrolling && "is-scrolling",
          )}
        >
          {/* Search bar — category + input + icon */}
          <div className="flex h-11 items-stretch overflow-hidden rounded-md border border-[#d9d9d9] bg-white min-[576px]:h-12 min-[1200px]:h-[52px]">
            <div className="relative flex shrink-0 items-center border-r border-[#e5e5e5] bg-[#f3eee8]">
              <select
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                aria-label="Search category"
                className="h-full max-w-[96px] cursor-pointer appearance-none bg-transparent py-0 pl-2.5 pr-7 text-[12px] font-medium text-[#191919] outline-none min-[576px]:max-w-[118px] min-[576px]:pl-3 min-[576px]:pr-8 min-[576px]:text-[13px] min-[992px]:max-w-[140px]"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.value === "all" ? "All" : cat.label}
                  </option>
                ))}
              </select>
              <FiChevronDown
                className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#191919] min-[576px]:right-2.5"
                strokeWidth={1.5}
              />
            </div>

            <div className="relative flex min-w-0 flex-1 items-center">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  onQueryChange(e.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="h-full min-w-0 flex-1 bg-transparent px-2.5 pr-9 text-[13px] text-[#191919] outline-none placeholder:text-[#9a9a9a] min-[576px]:px-3 min-[576px]:pr-10 min-[576px]:text-[14px]"
              />
              <FiSearch
                className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#191919] min-[576px]:right-3"
                strokeWidth={1.5}
              />
            </div>
          </div>

          {!hasQuery ? (
            <>
              {/* Trending searches */}
              {trending.length > 0 ? (
                <div className="mt-4 rounded-md bg-[#f5f5f5] px-3 py-3.5 min-[576px]:mt-5 min-[576px]:px-4 min-[576px]:py-4 min-[768px]:px-5 min-[768px]:py-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#191919] min-[576px]:text-[12px]">
                    Shoppers are currently searching for...
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 min-[576px]:mt-3 min-[576px]:gap-x-4 min-[576px]:gap-y-2.5 min-[768px]:grid-cols-3 min-[992px]:grid-cols-4">
                    {trending.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => {
                          onQueryChange(cat.label);
                        }}
                        className="truncate text-left text-[12px] text-[#191919] underline underline-offset-2 transition-opacity hover:opacity-60 min-[576px]:text-[13px]"
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Recent best sellers carousel */}
              <div className="mt-6 min-[576px]:mt-8">
                <div className="flex items-end justify-between gap-2 min-[576px]:gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#191919] min-[576px]:text-[11px]">
                      Don&apos;t miss our
                    </p>
                    <h2 className="mt-1 font-serif text-[22px] font-bold leading-none tracking-[-0.02em] text-[#191919] min-[576px]:text-[26px] min-[768px]:text-[28px] min-[992px]:text-[30px]">
                      Recent Best Sellers
                    </h2>
                  </div>
                  <Link
                    href="/"
                    className="shrink-0 pb-0.5 text-[12px] font-medium underline underline-offset-2 min-[576px]:pb-1 min-[576px]:text-[13px]"
                    style={{ color: ACCENT }}
                  >
                    Shop All
                  </Link>
                </div>

                <div className="relative mt-4 min-[576px]:mt-5">
                  {canPrev ? (
                    <button
                      type="button"
                      aria-label="Previous products"
                      onClick={() => scrollByCard(-1)}
                      className="absolute left-0 top-[28%] z-10 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full text-white shadow-md min-[576px]:h-9 min-[576px]:w-9 min-[992px]:h-10 min-[992px]:w-10"
                      style={{ backgroundColor: ACCENT }}
                    >
                      <FiChevronLeft className="h-4 w-4 min-[576px]:h-5 min-[576px]:w-5" strokeWidth={2} />
                    </button>
                  ) : null}
                  {canNext || list.length > 2 ? (
                    <button
                      type="button"
                      aria-label="Next products"
                      onClick={() => scrollByCard(1)}
                      className="absolute right-0 top-[28%] z-10 grid h-8 w-8 translate-x-1/2 place-items-center rounded-full text-white shadow-md min-[576px]:h-9 min-[576px]:w-9 min-[992px]:h-10 min-[992px]:w-10"
                      style={{ backgroundColor: ACCENT }}
                    >
                      <FiChevronRight className="h-4 w-4 min-[576px]:h-5 min-[576px]:w-5" strokeWidth={2} />
                    </button>
                  ) : null}

                  <div
                    ref={scrollerRef}
                    className="flex gap-1.5 overflow-x-auto scroll-smooth pb-2 scrollbar-none min-[576px]:gap-2"
                  >
                    {isLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <ProductCardSkeleton
                            key={i}
                            className="w-[46%] min-w-[46%] min-[576px]:w-[42%] min-[576px]:min-w-[42%] min-[768px]:w-[34%] min-[768px]:min-w-[34%] min-[992px]:w-[31%] min-[992px]:min-w-[31%]"
                          />
                        ))
                      : list.map((item, idx) => (
                          <div
                            key={`${item.id}-${idx}`}
                            data-product-card
                            className="w-[46%] min-w-[46%] shrink-0 min-[576px]:w-[42%] min-[576px]:min-w-[42%] min-[768px]:w-[34%] min-[768px]:min-w-[34%] min-[992px]:w-[31%] min-[992px]:min-w-[31%]"
                          >
                            <ProductTile item={item} onPick={pick} />
                          </div>
                        ))}
                    {!isLoading && list.length === 0 ? (
                      <p className="py-8 text-[13px] text-[#767676]">No products to show yet.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-5 min-[576px]:mt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#191919] min-[576px]:text-[12px]">
                Search results
              </p>
              <p className="mt-1 text-[14px] text-[#191919] min-[576px]:text-[15px]">
                Results for &ldquo;{query.trim()}&rdquo;
              </p>

              {isLoading ? (
                <div className="mt-4 grid grid-cols-2 gap-2 min-[576px]:mt-5 min-[768px]:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : list.length > 0 ? (
                <ul className="mt-4 grid grid-cols-2 gap-2 min-[576px]:mt-5 min-[768px]:grid-cols-3">
                  {list.map((item, idx) => (
                    <li key={`${item.id}-${idx}`}>
                      <ProductTile
                        item={item}
                        onPick={pick}
                        active={idx === activeIndex}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center px-4 py-12 text-center min-[576px]:py-14">
                  <div
                    className="grid h-16 w-16 place-items-center rounded-full bg-[#f5f5f5] min-[576px]:h-[72px] min-[576px]:w-[72px]"
                    aria-hidden
                  >
                    <svg
                      viewBox="0 0 48 48"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 min-[576px]:h-9 min-[576px]:w-9"
                    >
                      <circle cx="21" cy="21" r="11.25" stroke="#191919" strokeWidth="1.75" />
                      <path d="M29.5 29.5 38 38" stroke="#191919" strokeWidth="1.75" strokeLinecap="round" />
                      <path d="M17.25 21h7.5" stroke="#767676" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="mt-5 text-[15px] font-medium tracking-[0.01em] text-[#191919] min-[576px]:text-[16px]">
                    We couldn&apos;t find a match
                  </p>
                  <p className="mt-2 max-w-[280px] text-[13px] leading-5 text-[#767676]">
                    No products matched &ldquo;{query.trim()}&rdquo;. Try another keyword or check the spelling.
                  </p>
                  <button
                    type="button"
                    onClick={() => onQueryChange("")}
                    className="mt-5 text-[13px] underline underline-offset-2"
                    style={{ color: ACCENT }}
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    portalTarget,
  );
}
