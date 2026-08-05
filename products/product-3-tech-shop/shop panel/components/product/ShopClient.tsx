"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import Layout from "@/components/layout/Layout";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { ShopFiltersPanel } from "@/components/shop/ShopFiltersPanel";
import { ShopProductResults } from "@/components/shop/ShopProductResults";
import {
  ShopActiveFilters,
  ShopToolbar,
  type ShopSortValue,
} from "@/components/shop/ShopToolbar";
import { AppButton } from "@/components/shared/AppButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Product } from "@/data/products";
import { useInfiniteProducts } from "@/hooks/useProducts";
import { useMainCategories } from "@/hooks/useMainCategories";
import { useBrands } from "@/hooks/useBrands";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { toUIProduct } from "@/lib/adapters/product";
import { toNavMainCategories } from "@/lib/adapters/navCategory";
import {
  resolveShopCategory,
  sanitizeCategorySlug,
} from "@/lib/shop/categoryRoutes";
import {
  buildShopSearchParams,
  formatIdList,
  isClientOnlySort,
  parseShopSort,
  readShopFiltersFromSearchParams,
  SHOP_DEFAULT_MAX_PRICE,
  shopSortToApi,
} from "@/lib/shop/shopFilters";
import type { ProductListParams } from "@/lib/api/product/service";

/** Page size for shop infinite catalog — matches previous single-page limit. */
const SHOP_PAGE_SIZE = 40;

interface ShopClientProps {
  initialProducts: Product[];
  categoryParam: string | null;
  badgeParam: string | null;
  brandParam: string | null;
  searchParam: string | null;
}

export default function ShopClient({
  categoryParam,
  badgeParam,
  brandParam,
  searchParam,
}: ShopClientProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlFilters = useMemo(
    () => readShopFiltersFromSearchParams(searchParams),
    [searchParams],
  );

  // Prefer live URL; fall back to SSR props on first paint
  const categorySlug =
    sanitizeCategorySlug(urlFilters.category || categoryParam) || "";
  const activeBadge = urlFilters.badge ?? badgeParam;
  const activeSearch = urlFilters.search ?? searchParam;

  const [priceDraft, setPriceDraft] = useState<[number, number]>([
    urlFilters.minPrice,
    urlFilters.maxPrice,
  ]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Keep draft inputs in sync when URL price changes (back/forward, clear)
  useEffect(() => {
    setPriceDraft([urlFilters.minPrice, urlFilters.maxPrice]);
  }, [urlFilters.minPrice, urlFilters.maxPrice]);

  // Debounce slider/input → URL/API (Graduate Fashion pattern)
  const debouncedPrice = useDebouncedValue(priceDraft, 800);

  const { mainCategories, mainCategoriesLoading } = useMainCategories();
  const { brands, brandsLoading } = useBrands({ limit: 100, status: true });

  // Legacy ?brand=Samsung → resolve to brand_id once brands load
  useEffect(() => {
    if (!brandParam || urlFilters.brandIds.length > 0) return;
    if (!/^\d+$/.test(brandParam.trim())) {
      const match = brands.find(
        (b) => b.name.toLowerCase() === brandParam.trim().toLowerCase(),
      );
      if (!match) return;
      const next = buildShopSearchParams(searchParams, {
        brand_id: String(match.id),
        brand: null,
      });
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      return;
    }
    // Numeric legacy brand param
    const id = Number.parseInt(brandParam, 10);
    if (!Number.isFinite(id) || id <= 0) return;
    const next = buildShopSearchParams(searchParams, {
      brand_id: String(id),
      brand: null,
    });
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [
    brandParam,
    brands,
    urlFilters.brandIds.length,
    searchParams,
    router,
    pathname,
  ]);

  const patchUrl = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const next = buildShopSearchParams(searchParams, patch);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  const resolvedCategory = useMemo(
    () => resolveShopCategory(mainCategories, categorySlug),
    [mainCategories, categorySlug],
  );

  const navCategories = useMemo(
    () => toNavMainCategories(mainCategories),
    [mainCategories],
  );

  const sortBy = parseShopSort(urlFilters.sort || searchParams.get("sort"));

  // Pagination (limit/offset) is owned by useInfiniteProducts
  const apiParams = useMemo((): Omit<
    ProductListParams,
    "offset" | "page" | "limit"
  > => {
    const params: Omit<ProductListParams, "offset" | "page" | "limit"> = {
      status: true,
      ...shopSortToApi(isClientOnlySort(sortBy) ? "default" : sortBy),
    };

    if (activeSearch) params.search = activeSearch;

    if (activeBadge === "hot" || activeBadge === "new") params.featured = true;
    if (activeBadge === "bestseller" || activeBadge === "sale")
      params.best_deal = true;

    if (resolvedCategory?.child_category_id) {
      params.child_category_id = resolvedCategory.child_category_id;
    } else if (resolvedCategory?.sub_category_id) {
      params.sub_category_id = resolvedCategory.sub_category_id;
    } else if (resolvedCategory?.main_category_id) {
      params.main_category_id = resolvedCategory.main_category_id;
    }

    if (urlFilters.brandIds.length > 0) {
      params.brand_id = formatIdList(urlFilters.brandIds);
    }

    if (urlFilters.minPrice > 0) params.min_price = urlFilters.minPrice;
    if (urlFilters.maxPrice < SHOP_DEFAULT_MAX_PRICE) {
      params.max_price = urlFilters.maxPrice;
    }

    if (urlFilters.freeDelivery) params.free_delivery = true;
    if (urlFilters.inStock) params.in_stock = true;

    return params;
  }, [
    activeSearch,
    activeBadge,
    resolvedCategory,
    urlFilters.brandIds,
    urlFilters.minPrice,
    urlFilters.maxPrice,
    urlFilters.freeDelivery,
    urlFilters.inStock,
    sortBy,
  ]);

  const {
    products: apiProducts,
    total,
    isLoading: productsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteProducts(apiParams, { pageSize: SHOP_PAGE_SIZE });

  const displayProducts = useMemo(() => {
    let result = apiProducts.map((p) => toUIProduct(p));

    if (isClientOnlySort(sortBy)) {
      result = [...result];
      if (sortBy === "rating") {
        result.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === "discount") {
        result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
      }
    }

    return result;
  }, [apiProducts, sortBy]);

  const onLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const toggleBrand = useCallback(
    (brandId: number) => {
      const next = urlFilters.brandIds.includes(brandId)
        ? urlFilters.brandIds.filter((id) => id !== brandId)
        : [...urlFilters.brandIds, brandId];
      patchUrl({ brand_id: formatIdList(next) || null, brand: null });
    },
    [urlFilters.brandIds, patchUrl],
  );

  const clearFilters = () => {
    setPriceDraft([0, SHOP_DEFAULT_MAX_PRICE]);
    patchUrl({
      brand_id: null,
      brand: null,
      brands: null,
      min_price: null,
      max_price: null,
      free_delivery: null,
      in_stock: null,
      sort: null,
    });
  };

  // Push debounced price into the URL (drives the products API)
  useEffect(() => {
    const min = Math.max(0, debouncedPrice[0] || 0);
    const max =
      debouncedPrice[1] > 0 ? debouncedPrice[1] : SHOP_DEFAULT_MAX_PRICE;
    const safeMax = Math.max(min, max);

    const urlMin = urlFilters.minPrice;
    const urlMax = urlFilters.maxPrice;
    const nextMin = min > 0 ? min : 0;
    const nextMax =
      safeMax < SHOP_DEFAULT_MAX_PRICE ? safeMax : SHOP_DEFAULT_MAX_PRICE;

    if (nextMin === urlMin && nextMax === urlMax) return;

    patchUrl({
      min_price: nextMin > 0 ? String(nextMin) : null,
      max_price: nextMax < SHOP_DEFAULT_MAX_PRICE ? String(nextMax) : null,
    });
  }, [debouncedPrice, urlFilters.minPrice, urlFilters.maxPrice, patchUrl]);

  const setSortBy = (value: ShopSortValue) => {
    patchUrl({ sort: value === "default" ? null : value });
  };

  const activeCategoryName = resolvedCategory?.name ?? null;

  const pageTitle = (() => {
    if (activeSearch) return `Search: “${activeSearch}”`;
    if (categorySlug) return activeCategoryName ?? "Shop";
    if (activeBadge) {
      return `${activeBadge.charAt(0).toUpperCase()}${activeBadge.slice(1)} products`;
    }
    if (urlFilters.brandIds.length === 1) {
      const b = brands.find((x) => x.id === urlFilters.brandIds[0]);
      if (b) return `${b.name} collection`;
    }
    return "All products";
  })();

  const activeFilterCount =
    (categorySlug ? 1 : 0) +
    urlFilters.brandIds.length +
    (urlFilters.minPrice > 0 || urlFilters.maxPrice < SHOP_DEFAULT_MAX_PRICE
      ? 1
      : 0) +
    (urlFilters.freeDelivery ? 1 : 0) +
    (urlFilters.inStock ? 1 : 0);

  const filterChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];

    if (activeCategoryName && categorySlug) {
      chips.push({
        id: `cat-${categorySlug}`,
        label: activeCategoryName,
        onRemove: () => patchUrl({ category: null }),
      });
    }

    for (const id of urlFilters.brandIds) {
      const brand = brands.find((b) => b.id === id);
      chips.push({
        id: `brand-${id}`,
        label: brand?.name ?? `Brand #${id}`,
        onRemove: () => {
          const next = urlFilters.brandIds.filter((x) => x !== id);
          patchUrl({ brand_id: formatIdList(next) || null, brand: null });
        },
      });
    }

    if (
      urlFilters.minPrice > 0 ||
      urlFilters.maxPrice < SHOP_DEFAULT_MAX_PRICE
    ) {
      chips.push({
        id: "price",
        label: `৳${urlFilters.minPrice.toLocaleString()}–৳${urlFilters.maxPrice.toLocaleString()}`,
        onRemove: () => {
          setPriceDraft([0, SHOP_DEFAULT_MAX_PRICE]);
          patchUrl({ min_price: null, max_price: null });
        },
      });
    }

    if (urlFilters.freeDelivery) {
      chips.push({
        id: "free-delivery",
        label: "Free delivery",
        onRemove: () => patchUrl({ free_delivery: null }),
      });
    }

    if (urlFilters.inStock) {
      chips.push({
        id: "in-stock",
        label: "In stock",
        onRemove: () => patchUrl({ in_stock: null }),
      });
    }

    return chips;
  }, [
    activeCategoryName,
    categorySlug,
    urlFilters.brandIds,
    urlFilters.minPrice,
    urlFilters.maxPrice,
    urlFilters.freeDelivery,
    urlFilters.inStock,
    brands,
    patchUrl,
  ]);

  const filtersPanel = (
    <ShopFiltersPanel
      navCategories={navCategories}
      categoriesLoading={mainCategoriesLoading}
      categorySlug={categorySlug}
      priceRange={priceDraft}
      onPriceRangeChange={setPriceDraft}
      brands={brands}
      brandsLoading={brandsLoading}
      selectedBrandIds={urlFilters.brandIds}
      onToggleBrand={toggleBrand}
      freeDelivery={urlFilters.freeDelivery}
      onFreeDeliveryChange={(v) =>
        patchUrl({ free_delivery: v ? "1" : null })
      }
      inStock={urlFilters.inStock}
      onInStockChange={(v) => patchUrl({ in_stock: v ? "1" : null })}
      onClear={clearFilters}
    />
  );

  const resultCount =
    typeof total === "number" && total > 0 ? total : displayProducts.length;

  return (
    <Layout>
      <div className="container py-4 md:py-6 pb-10 md:pb-12">
        <Breadcrumbs
          className="mb-3"
          items={
            activeCategoryName
              ? [
                  { label: "Shop", href: "/shop" },
                  { label: activeCategoryName },
                ]
              : activeSearch
                ? [{ label: "Shop", href: "/shop" }, { label: "Search" }]
                : undefined
          }
        />

        <header className="mb-4 md:mb-5">
          <h1 className="font-heading text-xl font-bold tracking-tight md:text-2xl">
            {pageTitle}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Filter by category, brand, price, or delivery — results update from
            live inventory.
          </p>
        </header>

        {/* Catalog layout — sticky sidebar + results */}
        <div className="flex items-start gap-6 lg:gap-8">
          <aside className="sticky top-36 z-10 hidden w-[280px] shrink-0 lg:block xl:w-72">
            {/* Independent panel scroll — brand list still keeps its own 8-row scroll */}
            <div className="max-h-[calc(100vh-9rem)] overflow-y-auto overscroll-contain rounded-sm border border-border bg-card p-4 shadow-product">
              {filtersPanel}
            </div>
          </aside>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="rounded-sm border border-border bg-card p-3 shadow-product sm:p-3.5">
              <ShopToolbar
                resultCount={resultCount}
                isLoading={productsLoading || mainCategoriesLoading}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onOpenFilters={() => setFiltersOpen(true)}
                activeFilterCount={activeFilterCount}
              />
              {filterChips.length > 0 ? (
                <div className="mt-3 border-t border-border pt-3">
                  <ShopActiveFilters
                    chips={filterChips}
                    onClearAll={clearFilters}
                  />
                </div>
              ) : null}
            </div>

            <ShopProductResults
              products={displayProducts}
              viewMode={viewMode}
              isLoading={productsLoading}
              isFetchingMore={isFetchingNextPage}
              hasMore={hasNextPage}
              onLoadMore={onLoadMore}
              onResetFilters={clearFilters}
            />
          </div>
        </div>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="left"
          className="flex w-[min(100vw-2rem,340px)] flex-col gap-0 p-0"
        >
          <SheetHeader className="border-b border-border px-4 py-3 text-left">
            <SheetTitle className="flex items-center gap-2 font-heading text-base">
              <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden />
              Filters
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <ShopFiltersPanel
              navCategories={navCategories}
              categoriesLoading={mainCategoriesLoading}
              categorySlug={categorySlug}
              priceRange={priceDraft}
              onPriceRangeChange={setPriceDraft}
              brands={brands}
              brandsLoading={brandsLoading}
              selectedBrandIds={urlFilters.brandIds}
              onToggleBrand={toggleBrand}
              freeDelivery={urlFilters.freeDelivery}
              onFreeDeliveryChange={(v) =>
                patchUrl({ free_delivery: v ? "1" : null })
              }
              inStock={urlFilters.inStock}
              onInStockChange={(v) => patchUrl({ in_stock: v ? "1" : null })}
              onClear={clearFilters}
              compact
            />
          </div>
          <div className="border-t border-border p-3">
            <AppButton className="w-full" onClick={() => setFiltersOpen(false)}>
              Show {resultCount} {resultCount === 1 ? "product" : "products"}
            </AppButton>
          </div>
        </SheetContent>
      </Sheet>
    </Layout>
  );
}
