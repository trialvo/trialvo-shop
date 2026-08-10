"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Home,
  Package,
  Info,
  Phone,
  ChevronRight,
  Heart,
  Gift,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { getImageUrl } from "@/lib/imageUrl";
import { useProducts, toFrontendProduct } from "@/api/products";
import { dn } from "@/utils/displayName";

const navLinks = [
  { href: "/", label: "হোম", icon: Home },
  { href: "/products", label: "পণ্য", icon: Package },
  { href: "/about", label: "আমাদের সম্পর্কে", icon: Info },
  { href: "/contact", label: "যোগাযোগ", icon: Phone },
];

/* ─── Debounced live-search hook ─── */
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Small live-search result list ─── */
function SearchDropdown({
  query,
  onClose,
  onNavigate,
}: {
  query: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const debouncedQuery = useDebounce(query, 280);
  const { addItem, setOrderMode } = useOrder();

  const { data, isLoading } = useProducts(
    debouncedQuery.trim().length >= 2
      ? { search: debouncedQuery.trim(), limit: 6 }
      : { limit: 0 },   // skip fetch when query is too short
  );

  const results = debouncedQuery.trim().length >= 2
    ? (data?.products || []).map(toFrontendProduct).slice(0, 6)
    : [];

  if (debouncedQuery.trim().length < 2) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-40 mt-1 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
      {/* Header row */}
      <div className="flex items-center justify-between border-b border-slate-50 px-4 py-2.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {isLoading ? "খুঁজছে..." : `${results.length} টি ফলাফল`}
        </span>
        {debouncedQuery && (
          <Link
            href={`/search?q=${encodeURIComponent(debouncedQuery)}`}
            onClick={onClose}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#e91e63] hover:underline"
          >
            সব দেখুন <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-1 p-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 rounded-xl p-2">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-slate-100" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && results.length > 0 && (
        <div className="max-h-[340px] overflow-y-auto">
          {results.map((product) => (
            <div
              key={product.id}
              className="group flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50"
              onClick={() => onNavigate(`/products/${product.slug}`)}
            >
              {/* Thumbnail */}
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-100">
                <img
                  src={getImageUrl(product.image)}
                  alt={dn(product)}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-[#0f172a] group-hover:text-[#e91e63]">
                  {dn(product)}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-[#e91e63]">
                    BDT {(product.discountPrice ?? product.price).toLocaleString()}
                  </span>
                  {product.discountPrice ? (
                    <span className="text-[10px] text-slate-400 line-through">
                      BDT {product.price.toLocaleString()}
                    </span>
                  ) : product.originalPrice && product.originalPrice > product.price ? (
                    <span className="text-[10px] text-slate-400 line-through">
                      BDT {product.originalPrice.toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Quick add to cart */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOrderMode("single");
                  addItem({
                    productId: product.id,
                    name: dn(product),
                    slug: product.slug,
                    price: product.discountPrice ?? product.price,
                    originalPrice: product.discountPrice ? product.price : (product.originalPrice ?? product.price),
                    image: product.image,
                  }, "single");
                  onClose();
                  onNavigate("/cart");
                }}
                className="shrink-0 rounded-lg bg-[#e91e63]/10 p-1.5 text-[#e91e63] opacity-0 transition-all group-hover:opacity-100 hover:bg-[#e91e63] hover:text-white"
                title="কার্টে যোগ করুন"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && results.length === 0 && (
        <div className="px-4 py-8 text-center">
          <Search className="mx-auto mb-2 h-8 w-8 text-slate-200" />
          <p className="text-sm text-slate-400">কোনো পণ্য পাওয়া যায়নি</p>
          <p className="mt-1 text-xs text-slate-300">অন্য কীওয়ার্ড চেষ্টা করুন</p>
        </div>
      )}

      {/* Footer — view all link */}
      {!isLoading && results.length > 0 && (
        <div className="border-t border-slate-50 px-4 py-2.5">
          <Link
            href={`/search?q=${encodeURIComponent(debouncedQuery)}`}
            onClick={onClose}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-[#e91e63]/5 hover:text-[#e91e63]"
          >
            <Search className="h-3 w-3" />
            &ldquo;{debouncedQuery}&rdquo; দিয়ে পূর্ণ ফলাফল দেখুন
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─── Main Navbar ─── */
export default function Navbar() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { singleItemCount, comboItemCount } = useOrder();
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setIsSearchOpen(false);
      setSearchVal("");
    }
  };

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchVal("");
  }, []);

  const navigateAndClose = useCallback((path: string) => {
    router.push(path);
    closeSearch();
  }, [router, closeSearch]);

  const totalItems = singleItemCount + comboItemCount;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2" aria-label="ComboBasket Home">
            <Image
              src="/combobasket-logo.svg"
              alt="ComboBasket"
              width={140}
              height={36}
              priority
              className="h-9 w-auto transition-opacity duration-200 group-hover:opacity-80"
            />
          </Link>

          {/* Desktop Links */}
          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-[#e91e63]"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              </li>
            ))}
            {/* Combo Builder CTA */}
            <li>
              <Link
                id="nav-combo-bundles-btn"
                href="/combo-bundles"
                className="relative flex items-center gap-1.5 rounded-lg border border-[#e91e63]/30 px-3 py-2 text-sm font-semibold text-[#e91e63] transition-all hover:bg-pink-50"
              >
                <Gift className="h-4 w-4" />
                কম্বো অফার
              </Link>
            </li>
            <li>
              <Link
                id="nav-combo-btn"
                href="/combo-builder"
                className="relative flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#e91e63] to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:opacity-90"
              >
                <Gift className="h-4 w-4" />
                {comboItemCount > 0 ? "কম্বো কার্ট" : "কম্বো বানান"}
                {comboItemCount > 0 && (
                  <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-extrabold text-[#e91e63]">
                    {comboItemCount}
                  </span>
                )}
              </Link>
            </li>
          </ul>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            {/* Hamburger (Mobile) */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-[#e91e63] md:hidden"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search toggle */}
            <button
              onClick={() => { setIsSearchOpen(!isSearchOpen); }}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 ${isSearchOpen ? "bg-[#e91e63]/10 text-[#e91e63]" : "text-slate-600 hover:bg-slate-50 hover:text-[#e91e63]"}`}
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-[#e91e63]"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>

            {/* Cart — shows combined count */}
            <Link
              id="nav-cart-icon"
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-[#e91e63]"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {singleItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#e91e63] px-1 text-[9px] font-bold text-white">
                  {singleItemCount}
                </span>
              )}
            </Link>

            {/* Login */}
            <Link
              href="/login"
              className="btn-outline ml-1 hidden px-4 py-2 text-xs sm:flex"
            >
              <User className="h-3.5 w-3.5" />
              <span>লগইন</span>
            </Link>
          </div>
        </nav>

        {/* ── Live Search Bar ── */}
        {isSearchOpen && (
          <div className="animate-fade-in-down border-t border-gray-100 bg-white px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl" ref={searchContainerRef}>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="পণ্য খুঁজুন... (Enter চাপুন বা নিচে ক্লিক করুন)"
                    className="input-field pr-28 pl-12"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    autoFocus
                  />
                  {searchVal && (
                    <button
                      type="button"
                      onClick={() => setSearchVal("")}
                      className="absolute top-1/2 right-[76px] -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg bg-[#e91e63] px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#c2185b]"
                  >
                    খুঁজুন
                  </button>
                </div>
              </form>

              {/* Live dropdown */}
              <div className="relative">
                <SearchDropdown
                  query={searchVal}
                  onClose={closeSearch}
                  onNavigate={navigateAndClose}
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="animate-fade-in-left absolute top-0 left-0 h-full w-[280px] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <Link href="/" onClick={() => setIsMenuOpen(false)} aria-label="ComboBasket Home">
                <Image
                  src="/combobasket-logo.svg"
                  alt="ComboBasket"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                />
              </Link>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-[#e91e63]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="stagger-children p-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-[#e91e63]"
                  >
                    <link.icon className="h-4 w-4 text-slate-400" />
                    {link.label}
                    <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/combo-bundles"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-[#e91e63]/20 px-4 py-3.5 text-sm font-semibold text-[#e91e63] transition-all duration-200 hover:bg-[#e91e63]/5"
                >
                  <Gift className="h-4 w-4" />
                  কম্বো অফার 🏷️
                  <ChevronRight className="ml-auto h-4 w-4 text-[#e91e63]/40" />
                </Link>
              </li>
              <li>
                <Link
                  href="/combo-builder"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl bg-[#e91e63]/5 px-4 py-3.5 text-sm font-semibold text-[#e91e63] transition-all duration-200 hover:bg-[#e91e63]/10"
                >
                  <Gift className="h-4 w-4" />
                  কম্বো বানান 🎁
                  <ChevronRight className="ml-auto h-4 w-4 text-[#e91e63]/40" />
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-[#e91e63]"
                >
                  <ShoppingBag className="h-4 w-4 text-slate-400" />
                  কার্ট {singleItemCount > 0 && `(${singleItemCount})`}
                  <ChevronRight className="ml-auto h-4 w-4 text-slate-300" />
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
