"use client";


import Link from "next/link";
import {
  ShoppingBag,
  ArrowRight,
  Trash2,
  Plus,
  Minus,
  Tag,
  ShieldCheck,
  Truck,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Zap,
} from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { useShopConfig } from "@/context/ShopConfigContext";
import { computePricing } from "@/config/shopConfig";
import { getImageUrl } from "@/lib/imageUrl";

const trustBadges = [
  { icon: Truck, label: "ফ্রি ডেলিভারি", sub: "শর্ত প্রযোজ্য" },
  { icon: ShieldCheck, label: "নিরাপদ পেমেন্ট", sub: "SSL এনক্রিপ্টেড" },
  { icon: RefreshCw, label: "সহজ রিটার্ন", sub: "৭ দিনের মধ্যে" },
];

export default function CartPage() {
  const { singleItems, updateQty, removeItem, clearCart, subtotal } = useOrder();
  const items = singleItems;
  const { config } = useShopConfig();
  const cfg = config.single;
  const pricing = computePricing(subtotal, cfg);
  const finalTotal = pricing.totalBase;
  const isEmpty = items.length === 0;

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
            শপিং চালিয়ে যান
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-purple-100">
              <ShoppingBag className="h-5 w-5 text-[#e91e63]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">আপনার কার্ট</h1>
              {!isEmpty && (
                <p className="text-xs text-slate-400">{items.length} টি পণ্য</p>
              )}
            </div>
          </div>
          {/* Order mode badge */}
          {!isEmpty && (
            <span className="hidden items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-600 sm:flex">
              <ShoppingBag className="h-3.5 w-3.5" /> সিঙ্গেল অর্ডার
            </span>
          )}
        </div>

        {isEmpty ? (
          /* Empty State */
          <div className="animate-fade-in-up shadow-card rounded-2xl bg-white py-24 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50">
              <ShoppingBag className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#0f172a]">
              কার্ট খালি
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">
              এখনো কোনো পণ্য যোগ করা হয়নি। পছন্দের পণ্য বেছে নিন।
            </p>
            <Link
              href="/products"
              className="btn-pink mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm"
            >
              পণ্য দেখুন
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Items Column */}
            <div className="space-y-4 lg:col-span-2">
              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3">
                {trustBadges.map((b) => (
                  <div
                    key={b.label}
                    className="shadow-card flex flex-col items-center gap-1.5 rounded-xl bg-white p-3 text-center sm:flex-row sm:gap-3 sm:p-4 sm:text-left"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e91e63]/10">
                      <b.icon className="h-4 w-4 text-[#e91e63]" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs font-semibold text-[#0f172a]">
                        {b.label}
                      </p>
                      <p className="text-[10px] text-slate-400">{b.sub}</p>
                    </div>
                    <p className="text-[10px] font-medium text-slate-600 sm:hidden">
                      {b.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Cart Items */}
              <div className="shadow-card animate-fade-in-up rounded-2xl bg-white p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#0f172a]">
                    অর্ডার আইটেম ({items.length})
                  </h2>
                  <button
                    onClick={() => clearCart("single")}
                    className="text-xs text-slate-400 transition-colors hover:text-red-500"
                  >
                    সব মুছুন
                  </button>
                </div>

                <div className="divide-y divide-slate-50">
                  {items.map((item, i) => {
                    const isComboItem = item.itemType === 'combo' || (item.combo_items?.length ?? 0) > 0;
                    return (
                      <div
                        key={item.productId}
                        className="animate-fade-in-up flex flex-col gap-2 py-4"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="flex items-start gap-4">
                          {/* Product Image */}
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50">
                            <img src={getImageUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />
                            {isComboItem && (
                              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-[#e91e63] text-[10px]">🎁</span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="truncate text-sm font-semibold text-[#0f172a]">{item.name}</p>
                              {isComboItem && (
                                <span className="shrink-0 text-[10px] font-semibold bg-pink-50 text-[#e91e63] border border-pink-200 px-1.5 py-0.5 rounded-full">কম্বো বান্ডেল</span>
                              )}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <span className="text-sm font-bold text-[#e91e63]">BDT {item.price.toLocaleString()}</span>
                              {(item.originalPrice ?? 0) > item.price && (
                                <span className="text-xs text-slate-400 line-through">BDT {item.originalPrice!.toLocaleString()}</span>
                              )}
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex flex-col items-end gap-3">
                            <button
                              onClick={() => removeItem(item.productId, "single")}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition-all hover:bg-red-50 hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 p-1">
                              <button
                                onClick={() => updateQty(item.productId, -1, "single")}
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-[#e91e63]/10 hover:text-[#e91e63]"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-semibold text-[#0f172a]">{item.qty}</span>
                              <button
                                onClick={() => updateQty(item.productId, 1, "single")}
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-[#e91e63]/10 hover:text-[#e91e63]"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs font-bold text-[#0f172a]">BDT {(item.price * item.qty).toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Combo sub-items */}
                        {isComboItem && (item.combo_items?.length ?? 0) > 0 && (
                          <div className="ml-20 space-y-1 border-l-2 border-pink-100 pl-3">
                            {item.combo_items!.map((ci, j) => (
                              <p key={j} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                <span className="text-slate-300">└</span>
                                {ci.name} <span className="font-semibold">×{ci.qty}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Savings Banner */}
              {pricing.discountAmount > 0 && (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                    <Zap className="h-4.5 w-4.5 text-emerald-600" />
                  </div>
                  <p className="text-sm text-emerald-700">
                    আপনি মোট{" "}
                    <span className="font-bold">BDT {pricing.discountAmount.toLocaleString()}</span>{" "}
                    সাশ্রয় করছেন! 🎉
                  </p>
                </div>
              )}
            </div>

            {/* Summary Column */}
            <div className="animate-fade-in-right">
              <div className="shadow-card sticky top-24 rounded-2xl bg-white p-6">
                <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-[#0f172a]">
                  <Sparkles className="h-4.5 w-4.5 text-[#e91e63]" />
                  অর্ডার সামারি
                </h3>

                {/* Price Lines */}
                <div className="space-y-3 border-b border-slate-100 pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">
                      সাব-টোটাল ({items.reduce((s, i) => s + i.qty, 0)} পণ্য)
                    </span>
                    <span className="font-medium">
                      BDT {pricing.subtotal.toLocaleString()}
                    </span>
                  </div>
                  {pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Tag className="h-3 w-3" />
                        {cfg.discountType === 'percent' ? `ডিসকাউন্ট (${cfg.discountAmount}%)` : `ডিসকাউন্ট (৳${cfg.discountAmount})`}
                      </span>
                      <span className="font-medium text-emerald-600">
                        -BDT {pricing.discountAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">ডেলিভারি চার্জ</span>
                    <span className="text-slate-500">
                      চেকআউটে নির্ধারিত হবে
                    </span>
                  </div>

                </div>

                {/* Total */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold text-[#0f172a]">সর্বমোট</span>
                  <span className="text-xl font-bold text-[#e91e63]">
                    BDT {finalTotal.toLocaleString()}
                  </span>
                </div>

                {/* Coupon */}
                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Tag className="h-3.5 w-3.5 text-[#e91e63]" />
                    কুপন কোড চেকআউটে প্রয়োগ করুন
                  </p>
                </div>

                {/* Checkout Button */}
                <Link
                  href="/checkout?mode=single"
                  className="btn-pink mt-5 flex w-full items-center justify-center gap-2 py-3.5 text-sm"
                >
                  <ShieldCheck className="h-4.5 w-4.5" />
                  চেকআউট করুন
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="h-3 w-3" />
                  SSL সুরক্ষিত চেকআউট
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
