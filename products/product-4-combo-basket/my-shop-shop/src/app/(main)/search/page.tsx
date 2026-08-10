"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  Star,
  Heart,
  ShoppingCart,
  SlidersHorizontal,
  ArrowLeft,
} from "lucide-react";
import { useProducts, toFrontendProduct } from "@/api/products";
import { dn } from "@/utils/displayName";
import { getImageUrl } from "@/lib/imageUrl";
import { useOrder } from "@/context/OrderContext";

type SortType = "default" | "price-low" | "price-high" | "rating";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem, setOrderMode } = useOrder();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState<SortType>("default");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Map sort to API sort param
  const apiSort =
    sort === "price-low"
      ? "price_asc"
      : sort === "price-high"
        ? "price_desc"
        : sort === "rating"
          ? "rating_desc"
          : undefined;

  // Fetch from API with search + sort
  const { data, isLoading } = useProducts({
    search: debouncedQuery || undefined,
    sort: apiSort,
    limit: 50,
  });

  const results = debouncedQuery.trim()
    ? (data?.products || []).map(toFrontendProduct)
    : [];

  const popularSearches = [
    "কম্বো",
    "গিফট",
    "স্কিন কেয়ার",
    "লিপস্টিক",
    "পারফিউম",
    "হেয়ার কেয়ার",
  ];

  const toggleWishlist = (id: number) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="animate-fade-in-down mb-8">
          <Link
            href="/products"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-[#e91e63]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            সব পণ্য দেখুন
          </Link>
          <h1 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">
            পণ্য খুঁজুন
          </h1>
        </div>

        {/* Search Bar */}
        <div className="shadow-card animate-fade-in-up mb-8 rounded-2xl bg-white p-5 sm:p-6">
          <div className="relative">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="পণ্যের নাম, ক্যাটাগরি বা কীওয়ার্ড লিখুন..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-4 pr-12 pl-12 text-sm text-[#0f172a] transition-all outline-none focus:border-[#e91e63] focus:bg-white focus:ring-2 focus:ring-pink-50"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Popular searches */}
          {!query && (
            <div className="mt-4">
              <p className="mb-2.5 text-xs font-medium text-slate-400">
                জনপ্রিয় সার্চ:
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 transition-all hover:bg-[#e91e63]/10 hover:text-[#e91e63]"
                  >
                    <Search className="h-3 w-3" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {query && (
          <>
            {/* Sort + count */}
            <div className="animate-fade-in-up mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-[#0f172a]">
                  &ldquo;{query}&rdquo;
                </span>{" "}
                &mdash;{" "}
                {isLoading
                  ? "খুঁজছে..."
                  : results.length === 0
                    ? "কোনো পণ্য পাওয়া যায়নি"
                    : `${results.length} টি পণ্য পাওয়া গেছে`}
              </p>
              {results.length > 0 && (
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortType)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none focus:border-[#e91e63]"
                  >
                    <option value="default">Default</option>
                    <option value="price-low">দাম: কম থেকে বেশি</option>
                    <option value="price-high">দাম: বেশি থেকে কম</option>
                    <option value="rating">সেরা রেটিং</option>
                  </select>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-80 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            ) : results.length === 0 ? (
              /* No Results */
              <div className="shadow-card animate-fade-in-up rounded-2xl bg-white py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
                  <Search className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a]">
                  কিছু খুঁজে পাওয়া যায়নি
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  অন্য কীওয়ার্ড দিয়ে চেষ্টা করুন অথবা নিচের পরামর্শ দেখুন।
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600 transition-all hover:bg-[#e91e63]/10 hover:text-[#e91e63]"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {results.map((product, i) => {
                  const discount = product.originalPrice
                    ? Math.round(
                      ((product.originalPrice - product.price) /
                        product.originalPrice) *
                      100,
                    )
                    : 0;
                  const isWishlisted = wishlist.includes(product.id);

                  return (
                    <div
                      key={product.id}
                      className="shadow-card animate-fade-in-up group hover:shadow-card-hover relative overflow-hidden rounded-2xl bg-white transition-all duration-200 hover:-translate-y-1"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      {/* Wishlist */}
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:scale-110"
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${isWishlisted ? "fill-[#e91e63] text-[#e91e63]" : "text-slate-400"}`}
                        />
                      </button>

                      {discount > 0 && (
                        <div className="absolute top-3 left-3 z-10 rounded-full bg-[#e91e63] px-2 py-0.5 text-[10px] font-bold text-white">
                          -{discount}%
                        </div>
                      )}

                      {/* Image */}
                      <Link href={`/products/${product.slug}`}>
                        <div className="h-44 overflow-hidden bg-slate-50">
                          <img
                            src={getImageUrl(product.image)}
                            alt={dn(product)}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                          />
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="p-4">
                        <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                          {product.category}
                        </p>
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-[#0f172a] transition-colors hover:text-[#e91e63]">
                            {dn(product)}
                          </h3>
                        </Link>

                        <div className="mt-2 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className={`h-3 w-3 ${j < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
                            />
                          ))}
                          <span className="ml-1 text-[10px] text-slate-400">
                            ({product.reviewCount})
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <p className="text-base font-bold text-[#e91e63]">
                              BDT {(product.discountPrice ?? product.price).toLocaleString()}
                            </p>
                            {product.originalPrice && (
                              <p className="text-xs text-slate-400 line-through">
                                BDT {product.originalPrice.toLocaleString()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setOrderMode("single");
                              addItem({
                                productId: product.id,
                                name: dn(product),
                                slug: product.slug,
                                price: product.discountPrice ?? product.price,
                                originalPrice: product.discountPrice ? product.price : (product.originalPrice ?? product.price),
                                image: product.image,
                              }, "single");
                              router.push("/cart");
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e91e63]/10 text-[#e91e63] transition-all hover:bg-[#e91e63] hover:text-white"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f9fc]"><div className="mx-auto max-w-7xl px-4 py-10"><div className="h-12 w-64 animate-pulse rounded-xl bg-slate-100" /></div></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
