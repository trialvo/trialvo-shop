"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { useProducts, toFrontendProduct } from "@/api/products";
import { useComboBundles, toFrontendCombo } from "@/api/comboBundles";
import { useCategories } from "@/api/categories";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Grid3X3,
  List,
  X,
  PackageOpen,
  Package,
  Loader2,
} from "lucide-react";
import type { Product } from "@/types";
import { dn } from "@/utils/displayName";
import ScrollToTop from "@/components/ScrollToTop";

type SortType = "default" | "price-low" | "price-high" | "rating";
type ViewMode = "grid" | "list";

const COMBO_BUNDLES_SLUG = "combo-bundles";
const PAGE_SIZE = 12;

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [sortBy, setSortBy] = useState<SortType>("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);

  // ── Infinite scroll state ──────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const isComboSelected = selectedCategory === COMBO_BUNDLES_SLUG;

  // ── Regular products (used in "all" and category tabs) ────────────────────
  const { data: productData, isLoading: productsLoading } = useProducts({
    category: !isComboSelected && selectedCategory !== "all" ? selectedCategory : undefined,
    search: searchQuery || undefined,
    sort: sortBy !== "default" ? sortBy : undefined,
    page,
    limit: selectedCategory === "all" ? PAGE_SIZE : PAGE_SIZE * 2,
  });

  // ── Combo products (always fetched for "all" merge + combo tab) ───────────
  const { data: comboData, isLoading: combosLoading } = useComboBundles({
    page: isComboSelected ? page : 1,
    limit: isComboSelected ? PAGE_SIZE : 50,  // get all combos for merge in "all"
  });

  const { data: categoryData } = useCategories();

  // ── Reset pages & accumulated list on filter change ───────────────────────
  useEffect(() => {
    setPage(1);
    setAllProducts([]);
    setHasMore(true);
  }, [selectedCategory, sortBy, searchQuery, minPrice, maxPrice]);

  // ── Build page products from API responses ────────────────────────────────
  useEffect(() => {
    if (productsLoading || combosLoading) return;

    let pageProducts: Product[] = [];

    if (isComboSelected) {
      // Combo tab: only combo-products API
      pageProducts = (comboData?.combos ?? []).map(toFrontendCombo);
      const morePages = (comboData?.page ?? 1) < (comboData?.pages ?? 1);
      if (page === 1) {
        setAllProducts(pageProducts);
      } else {
        setAllProducts((prev) => {
          const ids = new Set(prev.map((p) => p.id + p.categorySlug));
          const fresh = pageProducts.filter((p) => !ids.has(p.id + p.categorySlug));
          return [...prev, ...fresh];
        });
      }
      setHasMore(morePages);
    } else {
      // "all" or category tab: regular products + (for "all") combo products merged
      const regulars = (productData?.products ?? []).map(toFrontendProduct);
      const combos = selectedCategory === "all"
        ? (comboData?.combos ?? []).map(toFrontendCombo)
        : [];

      // Merge combos into list based on index (every 4th slot for "all")
      let merged: Product[];
      if (selectedCategory === "all" && combos.length > 0) {
        merged = [];
        let ci = 0;
        regulars.forEach((prod, i) => {
          merged.push(prod);
          // Insert a combo every 4 regular products
          if ((i + 1) % 4 === 0 && ci < combos.length) {
            merged.push(combos[ci++]);
          }
        });
        // Append remaining combos not yet placed
        while (ci < combos.length) merged.push(combos[ci++]);
      } else {
        merged = regulars;
      }

      // Client-side price filter
      if (minPrice) merged = merged.filter((p) => p.price >= Number(minPrice));
      if (maxPrice) merged = merged.filter((p) => p.price <= Number(maxPrice));

      const totalRegularPages = productData?.pages ?? 1;
      const morePages = page < totalRegularPages;

      if (page === 1) {
        setAllProducts(merged);
      } else {
        setAllProducts((prev) => {
          const ids = new Set(prev.map((p) => p.slug));
          const fresh = merged.filter((p) => !ids.has(p.slug));
          return [...prev, ...fresh];
        });
      }
      setHasMore(morePages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productData, comboData, productsLoading, combosLoading]);

  // ── IntersectionObserver for infinite scroll ──────────────────────────────
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !productsLoading && !combosLoading) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore, productsLoading, combosLoading],
  );

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isLoading = (productsLoading || combosLoading) && page === 1;
  const isLoadingMore = (productsLoading || combosLoading) && page > 1;

  const hasActiveFilters =
    selectedCategory !== "all" ||
    searchQuery.trim() ||
    minPrice ||
    maxPrice ||
    sortBy !== "default";

  const clearFilters = () => {
    setSelectedCategory("all");
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="animate-fade-in-up mb-8">
        <h1 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">সকল পণ্য</h1>
        <p className="mt-2 text-sm text-slate-500">আমাদের প্রিমিয়াম পণ্যের বিশাল কালেকশন</p>
        <div className="section-divider !mx-0 mt-4" />
      </div>

      {/* Search Bar */}
      <div className="animate-fade-in-up mb-6" style={{ animationDelay: "50ms" }}>
        <div className="relative">
          <Search className="absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="পণ্য খুঁজুন — নাম, ক্যাটাগরি বা ট্যাগ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pr-12 pl-12 text-sm text-[#0f172a] transition-all outline-none focus:border-[#e91e63] focus:ring-2 focus:ring-pink-50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="animate-fade-in-up mb-6 space-y-3" style={{ animationDelay: "100ms" }}>
        {/* Category Tabs */}
        <div className="flex items-center gap-2">
          <div className="mr-1 hidden shrink-0 items-center gap-1.5 text-xs font-medium text-slate-400 sm:flex">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            ফিল্টার:
          </div>
          <div className="scrollbar-hide flex flex-1 gap-2 overflow-x-auto pb-1">
            {/* All */}
            <button
              onClick={() => setSelectedCategory("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${selectedCategory === "all"
                ? "bg-[#0f172a] text-white shadow-sm"
                : "shadow-card bg-white text-slate-600 hover:text-[#e91e63]"
                }`}
            >
              সব
            </button>

            {/* Combo Bundles — virtual tab from /combo-products API */}
            <button
              onClick={() => setSelectedCategory(COMBO_BUNDLES_SLUG)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${selectedCategory === COMBO_BUNDLES_SLUG
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm"
                : "shadow-card bg-white text-slate-600 hover:text-purple-600"
                }`}
            >
              <Package className="h-3 w-3" />
              কম্বো বান্ডেল
            </button>

            {/* Dynamic categories from API */}
            {categoryData?.categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${selectedCategory === cat.slug
                  ? "bg-[#0f172a] text-white shadow-sm"
                  : "shadow-card bg-white text-slate-600 hover:text-[#e91e63]"
                  }`}
              >
                {dn(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Price Range toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all ${showFilters || minPrice || maxPrice
              ? "bg-[#e91e63] text-white"
              : "shadow-card bg-white text-slate-600 hover:text-[#e91e63]"
              }`}
          >
            <SlidersHorizontal className="h-3 w-3" />
            দাম
          </button>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-all duration-200 outline-none focus:border-[#e91e63] focus:ring-2 focus:ring-pink-50"
            >
              <option value="default">সর্ট করুন</option>
              <option value="price-low">দাম: কম থেকে বেশি</option>
              <option value="price-high">দাম: বেশি থেকে কম</option>
              <option value="rating">সর্বোচ্চ রেটিং</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="ml-auto flex overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex h-8 w-8 items-center justify-center transition-all ${viewMode === "grid" ? "bg-[#0f172a] text-white" : "text-slate-400 hover:text-[#e91e63]"
                }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex h-8 w-8 items-center justify-center transition-all ${viewMode === "list" ? "bg-[#0f172a] text-white" : "text-slate-400 hover:text-[#e91e63]"
                }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Price Range Filter */}
      {showFilters && (
        <div className="animate-fade-in-down mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500">মূল্য সীমা (টাকা):</span>
          <input
            type="number" placeholder="সর্বনিম্ন"
            value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
            className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#e91e63]"
          />
          <span className="text-xs text-slate-400">—</span>
          <input
            type="number" placeholder="সর্বোচ্চ"
            value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
            className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#e91e63]"
          />
          {(minPrice || maxPrice) && (
            <button onClick={() => { setMinPrice(""); setMaxPrice(""); }}
              className="text-xs text-red-400 hover:text-red-500">ক্লিয়ার</button>
          )}
        </div>
      )}

      {/* Results Count + Clear */}
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {isLoading ? "লোড হচ্ছে..." : `${allProducts.length}টি পণ্য পাওয়া গেছে`}
        </p>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-[#e91e63] hover:underline">
            <X className="h-3 w-3" /> সব ফিল্টার মুছুন
          </button>
        )}
      </div>

      {/* ── Product Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : allProducts.length > 0 ? (
        <>
          <div className={`stagger-children ${viewMode === "grid"
            ? "grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col gap-4"
            }`}>
            {allProducts.map((product) => {
              // Combo products (categorySlug === "combo-bundles") should link to /combo-bundles/[slug]
              const comboHref = (product as Product & { _comboSlug?: string })._comboSlug
                ? `/combo-bundles/${(product as Product & { _comboSlug?: string })._comboSlug}`
                : undefined;
              return (
                <ProductCard
                  key={product.slug}
                  product={product}
                  viewMode={viewMode}
                  href={comboHref}
                />
              );
            })}
          </div>

          {/* Infinite scroll loader sentinel */}
          <div ref={loaderRef} className="mt-10 flex justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-[#e91e63]" />
                আরও পণ্য লোড হচ্ছে...
              </div>
            )}
            {!hasMore && allProducts.length > PAGE_SIZE && (
              <p className="text-xs text-slate-400">সকল পণ্য দেখানো হয়েছে ✓</p>
            )}
          </div>
        </>
      ) : (
        <div className="animate-fade-in-up py-24 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50">
            <PackageOpen className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">কোনো পণ্য পাওয়া যায়নি</h3>
          <p className="mt-2 text-sm text-slate-500">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
          <button onClick={clearFilters} className="btn-pink mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm">
            সব ফিল্টার মুছুন
          </button>
        </div>
      )}
      <ScrollToTop />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
