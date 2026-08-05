"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import SortSelect from "@/components/catalog/SortSelect";
import type { SortValue } from "@/components/catalog/types";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import MegaSaleBanner from "@/components/megasale/MegaSaleBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { useBanner } from "@/hooks/useBanner";
import { useStorefrontVisibility } from "@/hooks/useStorefrontVisibility";
import { useTranslation } from "@/hooks/useTranslation";
import {
  storefrontVisibilityService,
  storefrontVisibilityKeys,
  type MegaSaleProductItem,
  type FilterCounts,
  type PaginationInfo,
} from "@/lib/api/storefront/service";
import { getLocalName, toPublicUrl } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { FiClock, FiSearch, FiTag } from "react-icons/fi";
import { useInfiniteQuery } from "@tanstack/react-query";

// ─── Types & Helpers ──────────────────────────────────────────────────────────

type CountdownParts = {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type MegaSaleStockFilter = "all" | "in_stock" | "discounted" | "new_arrivals";

const parseTargetMs = (raw: string | null | undefined): number | null => {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  const trimmed = raw.trim();

  const directTs = Date.parse(trimmed);
  if (Number.isFinite(directTs)) return directTs;

  const isoLikeTs = Date.parse(trimmed.replace(" ", "T"));
  if (Number.isFinite(isoLikeTs)) return isoLikeTs;

  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(trimmed);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4] ?? 0);
  const minutes = Number(match[5] ?? 0);
  const seconds = Number(match[6] ?? 0);
  const parsed = new Date(year, month - 1, day, hours, minutes, seconds, 0).getTime();

  return Number.isFinite(parsed) ? parsed : null;
};

const getCountdownParts = (targetMs: number, nowMs: number): CountdownParts => {
  const diff = targetMs - nowMs;
  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { expired: false, days, hours, minutes, seconds };
};

const pad2 = (value: number): string => String(value).padStart(2, "0");

const formatMoney = (value: number): string => {
  const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
  return `BDT ${safe.toLocaleString()}`;
};

const resolveCountdownTarget = (
  targetMs: number | null | undefined,
  fallbackTargetMs: number | null | undefined,
  nowMs: number,
): number | null => {
  if (typeof targetMs === "number" && Number.isFinite(targetMs) && targetMs > nowMs) {
    return targetMs;
  }
  if (
    typeof fallbackTargetMs === "number" &&
    Number.isFinite(fallbackTargetMs) &&
    fallbackTargetMs > nowMs
  ) {
    return fallbackTargetMs;
  }
  return null;
};

// ─── Countdown Block ──────────────────────────────────────────────────────────

const CountdownBlock: React.FC<{
  label: string;
  targetMs: number | null;
  nowMs: number;
  compact?: boolean;
  tone?: "light" | "dark";
}> = ({ label, targetMs, nowMs, compact = false, tone = "light" }) => {
  if (!targetMs) return null;

  const countdown = getCountdownParts(targetMs, nowMs);

  const chipsClass = compact
    ? "grid grid-cols-4 gap-1.5"
    : "grid grid-cols-4 gap-2";

  const chipClass = compact
    ? tone === "dark"
      ? "border border-white/25 bg-white/10 px-1.5 py-1 text-center"
      : "border border-[#E4E4E4] bg-white px-1.5 py-1 text-center"
    : tone === "dark"
      ? "border border-white/25 bg-white/10 px-2 py-1.5 text-center"
      : "border border-[#E3E3E3] bg-white px-2 py-1.5 text-center";

  const containerClass = compact
    ? tone === "dark"
      ? "border border-white/30 bg-black/45 px-2 py-1.5 backdrop-blur-[2px]"
      : "border border-[#E5E5E5] bg-[#FBFBFB] px-2 py-1.5"
    : tone === "dark"
      ? "border border-white/30 bg-black/45 px-3 py-2 backdrop-blur-[2px]"
      : "border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2";

  const textStrongClass = tone === "dark" ? "text-white" : "text-[#111111]";
  const textMutedClass = tone === "dark" ? "text-white/75" : "text-[#777777]";
  const labelClass = tone === "dark" ? "text-white/85" : "text-[#5B5B5B]";

  return (
    <div className={containerClass}>
      <p
        className={`mb-1 font-semibold uppercase tracking-[0.08em] ${labelClass} ${
          compact ? "text-[10px]" : "text-[11px]"
        }`}
      >
        {label}
      </p>
      <div className={chipsClass}>
        <div className={chipClass}>
          <p className={`font-semibold ${textStrongClass} ${compact ? "text-xs" : "text-sm"}`}>
            {pad2(countdown.days)}
          </p>
          <p className={`text-[10px] ${textMutedClass}`}>D</p>
        </div>
        <div className={chipClass}>
          <p className={`font-semibold ${textStrongClass} ${compact ? "text-xs" : "text-sm"}`}>
            {pad2(countdown.hours)}
          </p>
          <p className={`text-[10px] ${textMutedClass}`}>H</p>
        </div>
        <div className={chipClass}>
          <p className={`font-semibold ${textStrongClass} ${compact ? "text-xs" : "text-sm"}`}>
            {pad2(countdown.minutes)}
          </p>
          <p className={`text-[10px] ${textMutedClass}`}>M</p>
        </div>
        <div className={chipClass}>
          <p className={`font-semibold ${textStrongClass} ${compact ? "text-xs" : "text-sm"}`}>
            {pad2(countdown.seconds)}
          </p>
          <p className={`text-[10px] ${textMutedClass}`}>S</p>
        </div>
      </div>
    </div>
  );
};

// ─── Skeletons & Disabled State ───────────────────────────────────────────────

const MegaSalePageSkeleton: React.FC<{ productSkeletonCount: number }> = ({ productSkeletonCount }) => {
  return (
    <section className="container mx-auto px-4 py-6 sm:px-0">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mega Sale" }]} />

      <div className="mt-4 overflow-hidden border border-[#E5E5E5] bg-white">
        <Skeleton className="h-54 w-full rounded-none sm:h-72" />
        <div className="space-y-3 p-4 sm:p-6">
          <Skeleton className="h-7 w-64 rounded-none" />
          <Skeleton className="h-4 w-full max-w-2xl rounded-none" />
          <Skeleton className="h-4 w-80 rounded-none" />
          <Skeleton className="h-20 w-full max-w-sm rounded-none" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: productSkeletonCount }).map((_, index) => (
          <div key={`megasale-product-skeleton-${index}`} className="space-y-2">
            <Skeleton className="h-18 w-full rounded-none" />
            <Skeleton className="h-52 w-full rounded-none" />
            <Skeleton className="h-5 w-4/5 rounded-none" />
            <Skeleton className="h-5 w-2/5 rounded-none" />
          </div>
        ))}
      </div>
    </section>
  );
};

const MegaSaleDisabledState: React.FC = () => {
  return (
    <section className="container mx-auto px-4 py-6 sm:px-0">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mega Sale" }]} />

      <div className="mt-6 border-2 border-dashed border-[#E5E5E5] bg-[#FAFAFA] py-18 text-center">
        <p className="text-base font-semibold text-[#232323]">Mega Sale unavailable</p>
        <div className="mt-5 flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center border border-[#D6D6D6] bg-white px-4 text-sm font-semibold text-[#333333] hover:bg-[#F6F6F6]"
          >
            Back Home
          </Link>
        </div>
      </div>
    </section>
  );
};

// ─── Sort Mapping ─────────────────────────────────────────────────────────────

const SORT_TO_API: Record<SortValue, string> = {
  featured: "serial",
  date_desc: "date_desc",
  date_asc: "date_asc",
  price_asc: "price_asc",
  price_desc: "price_desc",
  name_asc: "name_asc",
  name_desc: "name_desc",
};

const PAGE_SIZE = 20;

// ─── Main Component ──────────────────────────────────────────────────────────

const MegaSalePageClient: React.FC = () => {
  const { visibility, showMegaSale, visibilityLoading } = useStorefrontVisibility();
  const { language } = useTranslation();

  const canLoadMegaSaleData = showMegaSale && !visibilityLoading;

  const { banners, bannersLoading } = useBanner(
    { zone: "Campaign", limit: 12, offset: 0 },
    { enabled: canLoadMegaSaleData },
  );

  // Countdown timers
  const campaignTargetMs = React.useMemo(
    () => parseTargetMs(visibility.megasale_campaign_end_at),
    [visibility.megasale_campaign_end_at],
  );

  const [nowMs, setNowMs] = React.useState<number>(() => Date.now());
  const effectiveCampaignTargetMs = React.useMemo(
    () => resolveCountdownTarget(campaignTargetMs, null, nowMs),
    [campaignTargetMs, nowMs],
  );
  // Product countdown also uses campaign timer (default_end_at was removed in V2-037)
  const effectiveProductTargetMs = React.useMemo(
    () => resolveCountdownTarget(campaignTargetMs, null, nowMs),
    [campaignTargetMs, nowMs],
  );

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Campaign expired = campaign timer was set and has passed
  const campaignExpired = campaignTargetMs != null && campaignTargetMs > 0 && nowMs >= campaignTargetMs;

  // Search,  filter, sort state
  const [searchText, setSearchText] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [stockFilter, setStockFilter] = React.useState<MegaSaleStockFilter>("all");
  const [sort, setSort] = React.useState<SortValue>("featured");

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Infinite query for products
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: productsLoading,
  } = useInfiniteQuery({
    queryKey: storefrontVisibilityKeys.products({
      search: debouncedSearch,
      stock_filter: stockFilter,
      sort_by: SORT_TO_API[sort] || "serial",
    }),
    queryFn: async ({ pageParam = 1 }) => {
      return storefrontVisibilityService.getProducts({
        page: pageParam as number,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        stock_filter: stockFilter !== "all" ? stockFilter : undefined,
        sort_by: SORT_TO_API[sort] || "serial",
      });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
    enabled: canLoadMegaSaleData,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const allProducts = React.useMemo<MegaSaleProductItem[]>(() => {
    if (!data?.pages) return [];
    const products = data.pages.flatMap((page) => page.products);
    // Filter out products whose individual timers have expired
    return products.filter((product) => {
      if (!product.product_end_at) return true; // no individual timer → always show
      const productTargetMs = parseTargetMs(product.product_end_at);
      if (productTargetMs == null) return true; // unparseable → show
      return productTargetMs > nowMs; // only show if timer hasn't expired
    });
  }, [data?.pages, nowMs]);

  // Filter counts from the first page (always reflects full dataset)
  const filterCounts = React.useMemo<FilterCounts>(() => {
    return data?.pages?.[0]?.filter_counts ?? { all: 0, in_stock: 0, discounted: 0, new_arrivals: 0 };
  }, [data?.pages]);

  const totalProducts = data?.pages?.[0]?.pagination?.total ?? 0;

  const filterOptions = React.useMemo<
    Array<{ value: MegaSaleStockFilter; label: string; count: number }>
  >(
    () => [
      { value: "all", label: "All", count: filterCounts.all },
      { value: "in_stock", label: "In Stock", count: filterCounts.in_stock },
      { value: "discounted", label: "Discounted", count: filterCounts.discounted },
      { value: "new_arrivals", label: "New", count: filterCounts.new_arrivals },
    ],
    [filterCounts],
  );

  // Infinite scroll sentinel
  const loadMoreRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const resolveProductTimerTargetMs = React.useCallback(
    (productEndAt: string | null): number | null => {
      const productSpecificTargetMs = parseTargetMs(productEndAt);
      return resolveCountdownTarget(productSpecificTargetMs, effectiveProductTargetMs, nowMs);
    },
    [effectiveProductTargetMs, nowMs],
  );

  const campaignBanner = React.useMemo(() => {
    if (!Array.isArray(banners) || banners.length === 0) return null;
    return banners.find((banner) => banner?.featured) ?? banners[0] ?? null;
  }, [banners]);
  const campaignBannerImage = campaignBanner?.img_path ? toPublicUrl(campaignBanner.img_path) : null;
  const campaignBannerHref =
    typeof campaignBanner?.path === "string" && campaignBanner.path.trim().length > 0
      ? campaignBanner.path
      : "/megasale";

  if (visibilityLoading) {
    return <MegaSalePageSkeleton productSkeletonCount={8} />;
  }

  if (!showMegaSale || campaignExpired) {
    return <MegaSaleDisabledState />;
  }

  return (
    <section className="container mx-auto px-4 py-6 sm:px-0 sm:py-7">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mega Sale" }]} />

      <MegaSaleBanner
        loading={bannersLoading}
        bannerImage={campaignBannerImage}
        bannerHref={campaignBannerHref}
        bannerTitle={campaignBanner?.title}
        countdown={
          <CountdownBlock
            label="Campaign"
            targetMs={effectiveCampaignTargetMs}
            nowMs={nowMs}
            tone="dark"
          />
        }
      />

      <div className="mt-5 border border-[#DBDBDB] bg-[#FAFAF9] p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-md">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#858585]" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search products"
                className="h-11 w-full rounded-none border border-[#CFCFCF] bg-white pl-9 pr-3 text-sm text-[#1F1F1F] outline-none transition-colors placeholder:text-[#8A8A8A] focus:border-[#111111]"
              />
            </div>

            <div className="flex items-center gap-2">
                <SortSelect value={sort} onChange={setSort} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[#E3E3E3] pt-3">
            {filterOptions.map((option) => {
              const active = stockFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStockFilter(option.value)}
                  className={`inline-flex h-9 items-center gap-1.5 border px-3 text-xs font-semibold tracking-[0.01em] transition-colors ${
                    active
                      ? "border-black bg-black text-white shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
                      : "border-[#D2D2D2] bg-white text-[#3A3A3A] hover:border-[#AFAFAF] hover:bg-[#F5F5F5] hover:text-[#111111]"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-[#909090]"}`} />
                  <span>{option.label}</span>
                  <span
                    className={`inline-flex min-w-5 items-center justify-center px-1.5 text-[11px] ${
                      active ? "bg-white/20 text-white" : "bg-[#EEEEEE] text-[#555555]"
                    }`}
                  >
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#2A2A2A]">
          <FiTag className="h-4 w-4" />
          {totalProducts} Products
        </div>
      </div>

      {productsLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`megasale-product-grid-skeleton-${index}`} className="space-y-2">
              <Skeleton className="h-18 w-full rounded-none" />
              <Skeleton className="h-52 w-full rounded-none" />
              <Skeleton className="h-5 w-4/5 rounded-none" />
              <Skeleton className="h-5 w-2/5 rounded-none" />
            </div>
          ))}
        </div>
      ) : allProducts.length === 0 ? (
        <div className="mt-4 border-2 border-dashed border-[#E5E5E5] bg-[#FAFAFA] py-12 text-center">
          <p className="text-base font-semibold text-[#232323]">No products found</p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {allProducts.map((product) => {
              const name = getLocalName(product.name, product.name_bd ?? "", language);
              const image = product.thumbnail ? toPublicUrl(product.thumbnail) : null;
              const finalPrice = product.final_price;
              const oldPrice = product.selling_price;
              const detailsHref = `/products/${encodeURIComponent(product.slug)}/${product.id}/`;
              const discountChip = product.discount_percent > 0
                ? `${Math.min(product.discount_percent, 99)}% OFF`
                : "MEGA";
              const productTimerTargetMs = resolveProductTimerTargetMs(product.product_end_at);
              const hasDedicatedTimer = !!product.product_end_at;

              return (
                <article
                  key={`${product.product_sku_id}-${product.id}`}
                  className="group overflow-hidden border border-[#E8E8E8] bg-white transition-colors duration-200 hover:border-[#BCBCBC]"
                >
                  <Link href={detailsHref} className="relative block aspect-square overflow-hidden bg-[#F8F8F8]">
                    {image ? (
                      <ImageWithFallback
                        src={image}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#777777]">
                        Image unavailable
                      </div>
                    )}
                    <span className="absolute left-2 top-2 inline-flex h-6 items-center border border-black bg-black px-2 text-[10px] font-semibold tracking-[0.08em] text-white">
                      {discountChip}
                    </span>
                  </Link>

                  <div className="space-y-2.5 p-3">
                    <Link href={detailsHref}>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#1D1D1D]">
                        {name}
                      </h3>
                    </Link>

                    {product.color_name || product.variant_name ? (
                      <p className="text-[11px] text-[#8A8A8A]">
                        {[product.color_name, product.variant_name].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-end gap-2">
                      <span className="text-base font-semibold text-[#121212]">{formatMoney(finalPrice)}</span>
                      {oldPrice > finalPrice ? (
                        <span className="text-xs text-[#8B8B8B] line-through">{formatMoney(oldPrice)}</span>
                      ) : null}
                    </div>

                    <CountdownBlock
                      label={hasDedicatedTimer ? "Product Timer" : "Ends In"}
                      targetMs={productTimerTargetMs}
                      nowMs={nowMs}
                      compact
                    />

                    <Link
                      href={detailsHref}
                      className="inline-flex h-9 w-full items-center justify-center gap-1 border border-[#161616] bg-[#161616] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#2D2D2D]"
                    >
                      <FiClock className="h-3.5 w-3.5" />
                      View Product
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="mt-6 flex items-center justify-center py-4">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-sm text-[#888]">
                <span className="h-4 w-4 animate-spin border-2 border-[#ccc] border-t-[#333] rounded-full" />
                Loading more…
              </div>
            )}
            {!hasNextPage && allProducts.length > 0 && (
              <p className="text-xs text-[#AAA]">You have seen all products</p>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default MegaSalePageClient;
