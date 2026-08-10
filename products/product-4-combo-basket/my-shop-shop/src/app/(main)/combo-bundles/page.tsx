"use client";

import Link from "next/link";
import { Package, Tag, ArrowRight, Gift, Sparkles, Layers } from "lucide-react";
import { getImageUrl } from "@/lib/imageUrl";
import { useComboBundles } from "@/api/comboBundles";
import { dn } from "@/utils/displayName";

function ComboBundleCard({ combo }: { combo: any }) {
 const bp = Number(combo.bundle_price);
 const op = Number(combo.original_price);
 const discPct = op > bp ? Math.round(((op - bp) / op) * 100) : 0;
 const saving = op > bp ? op - bp : 0;

 return (
  <Link
   href={`/combo-bundles/${combo.slug}`}
   className="group relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:border-[#e91e63]/20 transition-all duration-300"
  >
   {/* Discount badge */}
   {discPct > 0 && (
    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-[#e91e63] px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
     <Tag className="h-3 w-3" />
     {discPct}% ছাড়
    </div>
   )}
   {/* Featured */}
   {combo.is_featured && (
    <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-white shadow">
     <Sparkles className="h-3 w-3" />
     ফিচার্ড
    </div>
   )}

   {/* Image */}
   <div className="relative h-52 overflow-hidden bg-gradient-to-br from-pink-50 to-rose-50">
    {combo.image ? (
     <img
      src={getImageUrl(combo.image)}
      alt={dn(combo)}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
     />
    ) : (
     <div className="flex h-full w-full items-center justify-center">
      <Package className="h-16 w-16 text-rose-200" />
     </div>
    )}
   </div>

   {/* Info */}
   <div className="flex flex-1 flex-col p-4">
    <h3 className="font-bold text-[#0f172a] text-sm leading-snug line-clamp-2 group-hover:text-[#e91e63] transition-colors">
     {dn(combo)}
    </h3>

    {/* Item count */}
    <p className="mt-1.5 text-xs text-slate-400">
     {combo.items?.length || 0} টি পণ্য অন্তর্ভুক্ত
    </p>

    {/* Savings */}
    {saving > 0 && (
     <p className="mt-1 text-xs font-semibold text-emerald-600">
      ৳{saving.toLocaleString()} সাশ্রয়
     </p>
    )}

    {/* Price */}
    <div className="mt-3 flex items-center gap-2 flex-wrap">
     <span className="text-lg font-extrabold text-[#e91e63]">
      ৳{bp.toLocaleString()}
     </span>
     {op > bp && (
      <span className="text-sm text-slate-400 line-through">
       ৳{op.toLocaleString()}
      </span>
     )}
    </div>

    {/* CTA */}
    <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-3">
     <span className="text-xs text-slate-500">বিস্তারিত দেখুন</span>
     <ArrowRight className="h-4 w-4 text-[#e91e63] transition-transform group-hover:translate-x-0.5" />
    </div>
   </div>
  </Link>
 );
}

export default function ComboBundlesPage() {
 const { data, isLoading } = useComboBundles({ limit: 20 });
 const combos = data?.combos || [];

 return (
  <div className="min-h-screen bg-[#f8f9fc]">
   {/* Hero */}
   <div className="bg-gradient-to-br from-[#0f172a] via-[#1e1a35] to-[#0f172a] px-4 py-14 text-center">
    <div className="mx-auto max-w-2xl">
     <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#e91e63]/20 px-3 py-1 text-xs font-semibold text-[#e91e63]">
      <Gift className="h-3.5 w-3.5" />
      কিউরেটেড কম্বো প্যাকেজ
     </span>
     <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
      কম্বো{" "}
      <span className="bg-gradient-to-r from-[#e91e63] to-pink-400 bg-clip-text text-transparent">
       বান্ডেল অফার
      </span>
     </h1>
     <p className="mt-3 text-sm text-slate-400">
      সেরা পণ্যগুলো একসাথে পান — বেশি সাশ্রয়, বেশি সুবিধা
     </p>
    </div>
   </div>

   <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    {/* Quick nav to combo-builder */}
    <div className="mb-8 flex flex-wrap items-center gap-3">
     <a
      href="/combo-bundles"
      className="flex items-center gap-2 rounded-full bg-[#e91e63] px-4 py-2 text-xs font-semibold text-white shadow"
     >
      <Layers className="h-3.5 w-3.5" />
      কম্বো প্যাকেজ
     </a>
     <a
      href="/combo-builder"
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:border-[#e91e63] hover:text-[#e91e63] transition-colors"
     >
      <Gift className="h-3.5 w-3.5" />
      নিজে কম্বো বানান
     </a>
    </div>

    {isLoading ? (
     <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
       <div key={i} className="h-80 rounded-2xl bg-white animate-pulse" />
      ))}
     </div>
    ) : combos.length === 0 ? (
     <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-pink-50">
       <Package className="h-10 w-10 text-rose-300" />
      </div>
      <p className="text-lg font-bold text-[#0f172a]">কোনো কম্বো প্যাকেজ নেই</p>
      <p className="mt-2 text-sm text-slate-400">
       শীঘ্রই আসছে! এর মধ্যে{" "}
       <a href="/combo-builder" className="text-[#e91e63] underline">
        নিজে কম্বো বানান
       </a>
      </p>
     </div>
    ) : (
     <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {combos.map((combo) => (
       <ComboBundleCard key={combo.id} combo={combo} />
      ))}
     </div>
    )}
   </div>
  </div>
 );
}
