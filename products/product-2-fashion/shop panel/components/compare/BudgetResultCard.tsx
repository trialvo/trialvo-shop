"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { FiPercent, FiShoppingBag, FiTag } from "react-icons/fi";
import { toPublicUrl } from "@/lib/utils";
import type { ProductListItem } from "@/lib/api/product/service";

interface BudgetResultCardProps {
  product: ProductListItem;
  effectivePrice: number;
  originalPrice: number;
  itemDiscount: number;
  couponDiscount: number;
  qtyAffordable: number;
  totalSpend: number;
  rank: number;
}

export default function BudgetResultCard({
  product,
  effectivePrice,
  originalPrice,
  itemDiscount,
  couponDiscount,
  qtyAffordable,
  totalSpend,
  rank,
}: BudgetResultCardProps) {
  const img = toPublicUrl(product.images?.[0]?.path ?? product.thumbnail);
  const totalSaved = (originalPrice - effectivePrice) * qtyAffordable;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden border border-black/[0.06] bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.06)] transition hover:border-black/10">
      <div
        className={`absolute right-3 top-3 flex h-7 w-7 items-center justify-center text-xs font-black text-white ${
          rank === 1
            ? "bg-black"
            : rank === 2
              ? "bg-gray-600"
              : rank === 3
                ? "bg-gray-400"
                : "bg-gray-300"
        }`}
      >
        #{rank}
      </div>

      <div className="flex gap-3 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-black/[0.04] bg-gray-50">
          {img ? (
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-contain p-2"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <FiShoppingBag className="h-7 w-7 text-gray-300" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pr-7">
          <Link
            href={`/products/${encodeURIComponent(product.slug)}/${product.id}`}
            target="_blank"
            className="block truncate text-sm font-semibold text-black transition-colors hover:opacity-60"
          >
            {product.name}
          </Link>
          <p className="mt-0.5 text-xs text-gray-400">
            {product.variations?.length ?? 0} variations
          </p>
        </div>
      </div>

      <div className="divide-y divide-black/[0.04] border-t border-black/[0.04] bg-gray-50/50 text-xs">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-gray-500">Original price</span>
          <span className="font-medium text-black">
            ৳{originalPrice.toLocaleString()}
          </span>
        </div>
        {itemDiscount > 0 && (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="inline-flex items-center gap-1 text-red-500">
              <FiTag size={12} />
              Item discount
            </span>
            <span className="font-semibold text-red-500">
              -৳{itemDiscount.toLocaleString()}
            </span>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className="flex items-center justify-between px-3 py-2">
            <span className="inline-flex items-center gap-1 text-emerald-600">
              <FiPercent size={12} />
              Coupon
            </span>
            <span className="font-semibold text-emerald-600">
              -৳{couponDiscount.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between bg-white px-3 py-2">
          <span className="font-bold text-black">Final per unit</span>
          <span className="font-black text-black">
            ৳{effectivePrice.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mt-auto border-t border-black/[0.04] bg-black px-4 py-3 text-white">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
              You can buy
            </p>
            <p className="text-3xl font-black leading-none">
              {qtyAffordable}{" "}
              <span className="text-base font-semibold opacity-80">pcs</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] opacity-80">Total spend</p>
            <p className="text-sm font-bold">
              ৳{totalSpend.toLocaleString()}
            </p>
            {totalSaved > 0 && (
              <p className="text-[10px] font-semibold text-emerald-300">
                Save ৳{totalSaved.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
