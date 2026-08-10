"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getImageUrl } from "@/lib/imageUrl";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Gift,
  Sparkles,
  Truck,
  PackageOpen,
  Tag,
  ChevronRight,
  Info,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useProducts, toFrontendProduct } from "@/api/products";
import { useCategories } from "@/api/categories";
import { dn } from "@/utils/displayName";

import { useOrder } from "@/context/OrderContext";
import { useShopConfig } from "@/context/ShopConfigContext";
import { computePricing } from "@/config/shopConfig";

const ALL = "All";

export default function ComboBuilderPage() {
  const { comboItems, addItem, removeItem, updateQty, setOrderMode } = useOrder();
  const items = comboItems; // combo-builder always operates on comboItems
  const { config } = useShopConfig();
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [search, setSearch] = useState("");

  // Real API data
  const { data: productData, isLoading } = useProducts({ is_combo_eligible: true, limit: 50 });
  const { data: categoryData } = useCategories();
  const CATEGORIES = [ALL, ...(categoryData?.categories?.map((c) => dn(c)) || [])];

  // Pricing always computed from comboItems
  const cfg = config.combo;
  const subtotal = useMemo(() => comboItems.reduce((s, i) => s + i.price * i.qty, 0), [comboItems]);
  const pricing = useMemo(() => computePricing(subtotal, cfg), [subtotal, cfg]);
  const minOrder = Number(cfg.minAmountForDiscount) || 0;
  const toFreeDelivery = Math.max(0, minOrder - pricing.discountedSubtotal);
  const freeDeliveryProgress = Math.min(
    100,
    minOrder > 0
      ? (pricing.discountedSubtotal / minOrder) * 100
      : 100
  );

  const allProducts = (productData?.products || []).map(toFrontendProduct);
  const filteredProducts = allProducts.filter((p) => {
    const catMatch = activeCategory === ALL || p.category === activeCategory;
    const searchMatch =
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.name_bn || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.tags || []).some((t: string) => t.includes(search.toLowerCase()));
    return catMatch && searchMatch && p.inStock;
  });

  const itemCount = items.reduce((s, i) => s + i.qty, 0);
  const getQtyInCart = (id: number) => items.find((i) => i.productId === id)?.qty ?? 0;

  const handleAddToCombo = (product: { id: number; name: string; name_bn?: string | null; slug: string; price: number; originalPrice?: number; image: string }) => {
    setOrderMode("combo");
    addItem({
      productId: product.id,
      name: dn(product),
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice ?? product.price,
      image: product.image,
    }, "combo");  // always write to combo cart
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* ─── Hero Header ─── */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-4 py-10 text-center">
        <div className="mx-auto max-w-2xl">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#e91e63]/20 px-3 py-1 text-xs font-semibold text-[#e91e63]">
            <Gift className="h-3.5 w-3.5" />
            কম্বো বিল্ডার
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            নিজের কম্বো বানান,
            <span className="bg-gradient-to-r from-[#e91e63] to-pink-400 bg-clip-text text-transparent"> সাশ্রয় করুন</span>
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            পছন্দের প্রোডাক্ট বেছে নিন। কম্বো অর্ডারে
            <span className="mx-1 font-bold text-[#e91e63]">{cfg.discountAmount}% ডিসকাউন্ট</span>
            {minOrder > 0 && <>এবং BDT {minOrder}+ অর্ডারে ফ্রি ডেলিভারি পাবেন।</>}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 lg:pb-8 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* ─── LEFT: Product Picker ─── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Search */}
            <div className="relative">
              <Sparkles className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="প্রোডাক্ট খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field w-full pl-10 py-3 text-sm"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${activeCategory === cat
                    ? "bg-[#e91e63] text-white shadow-sm"
                    : "bg-white text-slate-600 shadow-sm hover:text-[#e91e63]"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filteredProducts.map((product) => {
                const qty = getQtyInCart(product.id);
                const discount = product.originalPrice
                  ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                  : 0;

                return (
                  <div
                    key={product.id}
                    className={`shadow-card group relative rounded-2xl bg-white transition-all duration-200 overflow-hidden ${qty > 0 ? "ring-2 ring-[#e91e63]" : "hover:shadow-lg"
                      }`}
                  >
                    {/* In-combo badge */}
                    {qty > 0 && (
                      <div className="absolute top-2 left-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[#e91e63] text-[10px] font-bold text-white">
                        {qty}
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="absolute top-2 right-2 z-10 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        -{discount}%
                      </div>
                    )}

                    {/* Image */}
                    <div className="relative h-36 w-full overflow-hidden bg-slate-50">
                      {product.image ? (
                        <img
                          src={getImageUrl(product.image)}
                          alt={dn(product)}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-slate-200" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <p className="line-clamp-2 text-xs font-semibold leading-snug text-[#0f172a]">
                        {dn(product)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[#e91e63]">
                          BDT {product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            BDT {product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Add/Qty controls */}
                      {qty === 0 ? (
                        <button
                          onClick={() => handleAddToCombo(product)}
                          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0f172a] py-2 text-xs font-semibold text-white transition-all hover:bg-[#e91e63]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          কম্বোতে যোগ করুন
                        </button>
                      ) : (
                        <div className="mt-2.5 flex items-center justify-between rounded-xl border border-[#e91e63]/30 bg-[#e91e63]/5 p-1">
                          <button
                            onClick={() => updateQty(product.id, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#e91e63] hover:bg-[#e91e63]/10"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-sm font-bold text-[#e91e63]">{qty}</span>
                          <button
                            onClick={() => updateQty(product.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#e91e63] hover:bg-[#e91e63]/10"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-16 text-center">
                <PackageOpen className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-400">কোনো প্রোডাক্ট পাওয়া যায়নি</p>
              </div>
            )}
          </div>

          {/* ─── RIGHT: Combo Summary ─── */}
          <div className="lg:col-span-1">
            <div className="shadow-card sticky top-24 rounded-2xl bg-white overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#e91e63] to-pink-500 px-5 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                    <Gift className="h-4.5 w-4.5" />
                    আপনার কম্বো
                  </h2>
                  {itemCount > 0 && (
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                      {itemCount} আইটেম
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5">
                {/* Free delivery progress bar */}
                {minOrder > 0 && (
                  <div className="mb-5">
                    {toFreeDelivery > 0 ? (
                      <p className="mb-2 flex items-center gap-1.5 text-xs text-slate-600">
                        <Truck className="h-3.5 w-3.5 text-[#e91e63]" />
                        আর{" "}
                        <span className="font-bold text-[#e91e63]">BDT {toFreeDelivery}</span>{" "}
                        যোগ করলে ফ্রি ডেলিভারি!
                      </p>
                    ) : (
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        আপনি ফ্রি ডেলিভারি পাচ্ছেন! 🎉
                      </p>
                    )}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#e91e63] to-pink-400 transition-all duration-500"
                        style={{ width: `${freeDeliveryProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Items list */}
                {items.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                      <ShoppingBag className="h-7 w-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-400">কম্বো খালি</p>
                    <p className="mt-1 text-xs text-slate-300">
                      বাম দিক থেকে প্রোডাক্ট যোগ করুন
                    </p>
                  </div>
                ) : (
                  <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                          <img src={getImageUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />

                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-[#0f172a]">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#e91e63] font-medium">
                            BDT {item.price} × {item.qty} = BDT {(item.price * item.qty).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, "combo")}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pricing breakdown */}
                {items.length > 0 && (
                  <>
                    <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>সাব-টোটাল</span>
                        <span>BDT {pricing.subtotal.toLocaleString()}</span>
                      </div>
                      {pricing.discountAmount > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Tag className="h-3 w-3" />
                            কম্বো ডিসকাউন্ট ({cfg.discountAmount}%)
                          </span>
                          <span className="font-semibold text-emerald-600">
                            -BDT {pricing.discountAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          ডেলিভারি চার্জ
                        </span>
                        <span className="text-slate-500">
                          চেকআউটে নির্ধারিত হবে
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="font-bold text-[#0f172a]">সর্বমোট</span>
                        <span className="text-xl font-extrabold text-[#e91e63]">
                          BDT {pricing.totalBase.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Savings highlight */}
                    {pricing.discountAmount > 0 && (
                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5">
                        <Zap className="h-4 w-4 shrink-0 text-emerald-500" />
                        <p className="text-xs text-emerald-700">
                          আপনি{" "}
                          <span className="font-bold">BDT {pricing.discountAmount.toLocaleString()}</span>{" "}
                          সাশ্রয় করছেন!
                        </p>
                      </div>
                    )}

                    {/* CTA */}
                    <Link
                      href="/checkout?mode=combo"
                      className="btn-pink mt-4 flex w-full items-center justify-center gap-2 py-3.5 text-sm"
                    >
                      চেকআউট করুন
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/cart"
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-medium text-slate-600 transition-all hover:border-[#e91e63] hover:text-[#e91e63]"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      কার্ট দেখুন
                    </Link>
                  </>
                )}

                {/* Info note */}
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2.5">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <p className="text-[10px] leading-relaxed text-blue-600">
                    কম্বো অর্ডারে <strong>{cfg.discountAmount}% ছাড়</strong>
                    {minOrder > 0 && <> এবং BDT {minOrder}+ অর্ডারে ফ্রি ডেলিভারি পাবেন।</>}
                  </p>
                </div>
              </div>
            </div>

            {/* Single product link */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ChevronRight className="h-3.5 w-3.5" />
              আলাদা প্রোডাক্ট কিনতে{" "}
              <Link href="/products" className="font-semibold text-[#e91e63] hover:underline">
                এখানে যান
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Sticky Checkout Bar ─── */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#0f172a]">
                {items.reduce((s, i) => s + i.qty, 0)} পণ্য • BDT {pricing.totalBase.toLocaleString()}
              </p>
              {pricing.discountAmount > 0 && (
                <p className="text-[10px] text-emerald-600">
                  {cfg.discountAmount}% ছাড়ে BDT {pricing.discountAmount.toLocaleString()} সাশ্রয়!
                </p>
              )}
            </div>
            <Link
              href="/checkout?mode=combo"
              className="btn-pink flex shrink-0 items-center gap-2 px-5 py-2.5 text-sm"
            >
              চেকআউট
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
