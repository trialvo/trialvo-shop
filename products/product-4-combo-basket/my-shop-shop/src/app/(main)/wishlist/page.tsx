"use client";

import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  Star,
  ShoppingBag,
  Share2,
  ArrowLeft,
  Gift,
  Lock,
} from "lucide-react";
import { useWishlist, useRemoveFromWishlist } from "@/api/wishlist";
import { useOrder } from "@/context/OrderContext";
import { toFrontendProduct } from "@/api/products";
import { getShopToken } from "@/api/auth";
import { getImageUrl } from "@/lib/imageUrl";

export default function WishlistPage() {
  const { data, isLoading } = useWishlist();
  const removeMutation = useRemoveFromWishlist();
  const { addItem, setOrderMode } = useOrder();

  const isLoggedIn = typeof window !== "undefined" && !!getShopToken();

  const items = data?.wishlist ?? [];
  const isEmpty = items.length === 0;

  const totalSavings = items.reduce((sum, item) => {
    const orig = item.product.original_price ?? item.product.price;
    return sum + (orig - item.product.price);
  }, 0);

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100">
          <Lock className="h-9 w-9 text-slate-300" />
        </div>
        <h2 className="text-xl font-bold text-[#0f172a]">লগইন প্রয়োজন</h2>
        <p className="max-w-xs text-sm text-slate-400">Wishlist দেখতে বা সংরক্ষণ করতে আগে লগইন করুন।</p>
        <Link href="/login" className="btn-pink inline-flex items-center gap-2 px-6 py-3 text-sm">
          লগইন করুন <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="animate-fade-in-down mb-8">
          <Link href="/products" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-[#e91e63]">
            <ArrowLeft className="h-3.5 w-3.5" /> শপিং চালিয়ে যান
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-rose-100">
                <Heart className="h-5 w-5 fill-[#e91e63] text-[#e91e63]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0f172a]">আমার Wishlist</h1>
                {!isEmpty && <p className="text-xs text-slate-400">{items.length} টি পণ্য সংরক্ষিত</p>}
              </div>
            </div>
            {!isEmpty && totalSavings > 0 && (
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                <Gift className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">BDT {totalSavings.toLocaleString()} সাশ্রয় সম্ভব!</span>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="animate-fade-in-up shadow-card rounded-2xl bg-white py-24 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50">
              <Heart className="h-10 w-10 text-slate-300" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#0f172a]">Wishlist খালি</h2>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">পছন্দের পণ্যের হার্ট আইকনে ক্লিক করে wishlist-এ যোগ করুন।</p>
            <Link href="/products" className="btn-pink mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm">
              পণ্য দেখুন <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const p = item.product;
              const orig = p.original_price ?? p.price;
              const discount = orig > p.price ? Math.round(((orig - p.price) / orig) * 100) : 0;

              return (
                <div
                  key={item.id}
                  className="shadow-card animate-fade-in-up group hover:shadow-card-hover relative rounded-2xl bg-white transition-all duration-200"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Remove */}
                  <button
                    onClick={() => removeMutation.mutate(p.id)}
                    disabled={removeMutation.isPending}
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-300 shadow-sm backdrop-blur-sm transition-all hover:bg-red-50 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Product Image */}
                  <div className="relative h-44 w-full overflow-hidden rounded-t-2xl bg-slate-50">
                    <img
                      src={getImageUrl(p.image)}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Details */}
                  <div className="p-4">
                    <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                      {p.category?.name ?? ""}
                    </p>
                    <Link
                      href={`/products/${p.slug}`}
                      className="mt-1 line-clamp-2 block text-sm font-semibold text-[#0f172a] transition-colors hover:text-[#e91e63]"
                    >
                      {p.name}
                    </Link>

                    {/* Rating */}
                    <div className="mt-2 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-3 w-3 ${j < Math.floor(p.rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
                      ))}
                      <span className="ml-1 text-[10px] text-slate-400">({p.review_count})</span>
                    </div>

                    {/* Price */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-lg font-bold text-[#e91e63]">BDT {p.price.toLocaleString()}</span>
                      {discount > 0 && (
                        <>
                          <span className="text-xs text-slate-400 line-through">BDT {orig.toLocaleString()}</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600">-{discount}%</span>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setOrderMode("single");
                          addItem({
                            productId: p.id,
                            name: p.name,
                            slug: p.slug,
                            price: p.price,
                            originalPrice: orig,
                            image: p.image,
                          }, "single");  // always write to single cart
                        }}
                        className="btn-pink flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> কার্টে যোগ
                      </button>
                      <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-[#e91e63]/30 hover:bg-[#e91e63]/5 hover:text-[#e91e63]">
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {!isEmpty && (
          <div className="animate-fade-in-up mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/cart" className="btn-pink flex items-center gap-2 px-8 py-3 text-sm">
              <ShoppingBag className="h-4 w-4" /> কার্ট দেখুন <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/products" className="btn-outline flex items-center gap-2 px-8 py-3 text-sm">
              আরো পণ্য দেখুন
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
