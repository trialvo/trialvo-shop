"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { toPublicUrl } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addItem } from "@/redux/slices/cartSlice";
import type { BulkRule, ComboRule } from "@/redux/slices/discountSlice";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { FiLayers, FiPackage } from "react-icons/fi";
import { toast } from "sonner";

function discountLabel(type: 0 | 1, value: number): string {
  return type === 1 ? `${value}% OFF` : `BDT ${value} OFF`;
}

function calcSalePrice(sellingPrice: number, type: 0 | 1, value: number): number {
  if (Number(type) === 1) return Math.max(0, sellingPrice - (sellingPrice * value) / 100);
  return Math.max(0, sellingPrice - value);
}

function productImg(path: string | null | undefined): string {
  return toPublicUrl(path) ?? "/placeholder-product.jpg";
}

const BulkCard: React.FC<{ rule: BulkRule; onAdd: (rule: BulkRule) => void }> = ({ rule, onAdd }) => {
  const salePrice = calcSalePrice(rule.selling_price, rule.discount_type, rule.discount_value);
  const imageSrc = productImg(rule.product_image);
  const inStock = (rule.stock ?? 0) > 0;
  const hasEnoughStock = rule.stock >= rule.min_qty;
  const available = inStock && hasEnoughStock;

  return (
    <div className="group overflow-hidden border border-[#EDEDED] bg-white transition-all duration-200 hover:border-[#BDBDBD]">
      <Link
        href={`/products/${rule.product_slug}/${rule.product_id}/`}
        className="relative block aspect-square overflow-hidden border-b border-[#F1F1F1] bg-[#FAFAFA]"
      >
        <Image
          src={imageSrc}
          alt={rule.product_name}
          fill
          className={`object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
            !available ? "opacity-60 grayscale" : ""
          }`}
          unoptimized
        />
      </Link>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold ${
              available ? "bg-black text-white" : "bg-[#999999] text-white"
            }`}
          >
            {available ? discountLabel(rule.discount_type, rule.discount_value) : "Stock Issue"}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold ${
              rule.free_delivery ? "bg-[#EAF6EE] text-[#1A8A43]" : "bg-[#FFF1F1] text-[#D93030]"
            }`}
          >
            {rule.free_delivery ? "Free Delivery" : "Paid Delivery"}
          </span>
        </div>

        <Link href={`/products/${rule.product_slug}/${rule.product_id}/`} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#111111] transition-colors group-hover:text-[#333333]">
            {rule.product_name}
          </h3>
          {(rule.color_name || rule.variant_name) && (
            <p className="mt-0.5 text-xs text-[#767676]">
              {[rule.color_name, rule.variant_name].filter(Boolean).join(" / ")}
            </p>
          )}
        </Link>

        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
          <span className="text-lg font-bold text-[#111111]">BDT {salePrice.toLocaleString()}</span>
          {salePrice < rule.selling_price && (
            <span className="text-xs text-[#999999] line-through">BDT {rule.selling_price.toLocaleString()}</span>
          )}
          <span className="text-xs text-[#767676]">/ unit</span>
        </div>

        <div className="flex items-start justify-between gap-2 border border-[#EDEDED] bg-[#FAFAFA] px-3 py-2 sm:items-center">
          <p className="text-xs text-[#6B6B6B]">
            For <span className="font-semibold text-[#111111]">{rule.min_qty}</span> units
          </p>
          <div className="text-right">
            <p className="text-sm font-semibold text-[#111111]">BDT {(salePrice * rule.min_qty).toLocaleString()}</p>
            {salePrice < rule.selling_price && (
              <p className="text-xs font-medium text-[#1A8A43]">
                Save BDT {((rule.selling_price - salePrice) * rule.min_qty).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {!hasEnoughStock && inStock && (
          <p className="text-xs font-medium text-[#CC8A00]">
            Only {rule.stock} in stock, need {rule.min_qty} for this offer.
          </p>
        )}

        <button
          onClick={() => available && onAdd(rule)}
          disabled={!available}
          className={`h-10 w-full border text-sm font-semibold transition-colors ${
            available
              ? "border-[#111111] bg-[#111111] text-white hover:bg-[#2B2B2B]"
              : "cursor-not-allowed border-[#E2E2E2] bg-[#F5F5F5] text-[#A1A1A1]"
          }`}
        >
          {available ? `Add ${rule.min_qty} Items` : !inStock ? "Out of Stock" : "Insufficient Stock"}
        </button>
      </div>
    </div>
  );
};

const ComboCard: React.FC<{ rule: ComboRule; onAddCombo: (rule: ComboRule) => void }> = ({
  rule,
  onAddCombo,
}) => {
  const topTier = rule.tiers[rule.tiers.length - 1];
  if (!topTier) return null;

  const totalQty = topTier.items.reduce((s, i) => s + i.required_qty, 0);
  const rawTotal = topTier.items.reduce((s, i) => s + i.selling_price * i.required_qty, 0);
  const discAmt =
    Number(topTier.discount_type) === 0
      ? topTier.discount_value
      : (rawTotal * topTier.discount_value) / 100;
  const finalTotal = Math.max(0, rawTotal - discAmt);
  const tiersCount = rule.tiers.length;

  const insufficientItems = topTier.items.filter((i) => i.stock < i.required_qty);
  const available = insufficientItems.length === 0;

  return (
    <div
      className={`overflow-hidden border bg-white transition-colors duration-200 ${
        available ? "border-[#EDEDED] hover:border-[#BDBDBD]" : "border-[#F1D5D5]"
      }`}
    >
      <div className={`flex flex-col gap-2 border-b px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between ${available ? "bg-[#FAFAFA] border-[#EDEDED]" : "bg-[#FFF7F7] border-[#F1D5D5]"}`}>
        <span className="text-sm font-semibold text-[#111111]">Combo Deal</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-0.5 text-[11px] font-semibold ${rule.free_delivery ? "bg-[#EAF6EE] text-[#1A8A43]" : "bg-[#FFF1F1] text-[#D93030]"}`}>
            {rule.free_delivery ? "Free Delivery" : "Paid Delivery"}
          </span>
          <span className={`px-2 py-0.5 text-[11px] font-semibold ${available ? "bg-black text-white" : "bg-[#999999] text-white"}`}>
            {available ? discountLabel(topTier.discount_type, topTier.discount_value) : "Stock Issue"}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <h3 className="text-base font-semibold leading-snug text-[#111111]">{rule.name}</h3>
        {rule.description && <p className="line-clamp-2 text-xs text-[#767676]">{rule.description}</p>}

        <div className="space-y-2.5">
          {topTier.items.slice(0, 3).map((item) => {
            const img = productImg(item.product_image);
            const itemInsufficient = item.stock < item.required_qty;
            return (
              <div key={item.product_sku_id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Link
                  href={`/products/${item.product_slug}/${item.product_id}/`}
                  className="relative block h-10 w-10 shrink-0 overflow-hidden border border-[#EFEFEF] bg-[#FAFAFA]"
                >
                  <Image
                    src={img}
                    alt={item.product_name}
                    fill
                    className={`object-cover ${itemInsufficient ? "grayscale opacity-50" : ""}`}
                    unoptimized
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.product_slug}/${item.product_id}/`}
                    className="block truncate text-xs font-medium text-[#222222] hover:text-[#111111]"
                  >
                    {item.product_name}
                  </Link>
                  <p className="text-xs text-[#767676]">
                    {[item.color_name, item.variant_name].filter(Boolean).join(" / ") || "Standard"} ×
                    {item.required_qty}
                    {itemInsufficient && (
                      <span className="ml-1 font-medium text-[#D93030]">(only {item.stock} left)</span>
                    )}
                  </p>
                </div>
                <p className="shrink-0 text-xs font-semibold text-[#333333] sm:text-right">
                  BDT {(item.selling_price * item.required_qty).toLocaleString()}
                </p>
              </div>
            );
          })}
          {topTier.items.length > 3 && (
            <p className="text-xs text-[#767676]">+{topTier.items.length - 3} more items</p>
          )}
        </div>

        <div className="space-y-1 border-t border-dashed border-[#E2E2E2] pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#6B6B6B]">Total ({totalQty} items)</span>
            <span className="text-[#999999] line-through">BDT {rawTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-medium text-[#1A8A43]">You save</span>
            <span className="font-semibold text-[#1A8A43]">BDT {discAmt.toLocaleString()}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-semibold">
            <span className="text-[#111111]">Deal Price</span>
            <span className="text-[#111111]">BDT {finalTotal.toLocaleString()}</span>
          </div>
        </div>

        {tiersCount > 1 && (
          <p className="text-xs text-[#0088FF]">{tiersCount} deal tiers available</p>
        )}

        {!available && (
          <p className="text-xs font-medium text-[#D93030]">
            This combo is currently unavailable due to stock limits.
          </p>
        )}

        <button
          onClick={() => available && onAddCombo(rule)}
          disabled={!available}
          className={`h-10 w-full border text-sm font-semibold transition-colors ${
            available
              ? "border-[#111111] bg-[#111111] text-white hover:bg-[#2B2B2B]"
              : "cursor-not-allowed border-[#E2E2E2] bg-[#F5F5F5] text-[#A1A1A1]"
          }`}
        >
          {available ? `Add All ${totalQty} Items` : "Unavailable"}
        </button>
      </div>
    </div>
  );
};

const OffersPageClient: React.FC = () => {
  const dispatch = useAppDispatch();
  const bulkRules = useAppSelector((s) => s.discounts.bulkRules);
  const comboRules = useAppSelector((s) => s.discounts.comboRules);
  const loading = useAppSelector((s) => s.discounts.loading);

  const [tab, setTab] = useState<"bulk" | "combo">("bulk");

  const handleAddBulk = (rule: BulkRule) => {
    const img = productImg(rule.product_image);
    dispatch(
      addItem({
        id: `bulk-${rule.product_sku_id}-${Date.now()}`,
        productId: String(rule.product_id),
        productVariationId: rule.product_sku_id,
        title: rule.product_name,
        image: img,
        price: calcSalePrice(rule.selling_price, rule.discount_type, rule.discount_value),
        originalPrice: rule.selling_price,
        size: rule.variant_name ?? "Standard",
        color: rule.color_name ?? "",
        quantity: rule.min_qty,
        stock: rule.stock,
        overrideQuantity: true,
      })
    );
    toast.success(`Added ${rule.min_qty}× ${rule.product_name} to cart`);
  };

  const handleAddCombo = (rule: ComboRule) => {
    const topTier = rule.tiers[rule.tiers.length - 1];
    if (!topTier) return;

    for (const item of topTier.items) {
      const img = productImg(item.product_image);
      dispatch(
        addItem({
          id: `combo-${item.product_sku_id}-${Date.now()}`,
          productId: String(item.product_id),
          productVariationId: item.product_sku_id,
          title: item.product_name,
          image: img,
          price: item.selling_price,
          originalPrice: item.selling_price,
          size: item.variant_name ?? "Standard",
          color: item.color_name ?? "",
          quantity: item.required_qty,
          stock: item.stock,
          overrideQuantity: true,
        })
      );
    }

    toast.success(`Added ${rule.name} combo to cart`);
  };

  return (
    <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Offers" }]} />

      <div className="mt-0 border border-[#EDEDED] bg-linear-to-r from-[#FAFAFA] to-white p-5 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B6B6B]">Offers</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#111111] sm:text-3xl">Bulk & Combo Deals</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#6B6B6B]">
          Shop structured offers with transparent pricing, quantity breaks, and bundle savings.
        </p>
      </div>

      <div className="mt-6 border border-[#E5E5E5] bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-[0.01em] text-[#111111]">
              {tab === "bulk" ? "Bulk Offers" : "Combo Deals"}
            </h2>
            <p className="mt-1 text-xs font-medium text-[#787878]">
              {tab === "bulk"
                ? `${bulkRules.length} curated bulk offer${bulkRules.length === 1 ? "" : "s"}`
                : `${comboRules.length} curated combo deal${comboRules.length === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-1 border border-[#E5E5E5] bg-[#FAFAFA] p-1 sm:w-auto sm:min-w-[360px] sm:gap-1.5 sm:p-1.5">
            <button
              onClick={() => setTab("bulk")}
              className={`inline-flex h-10 items-center justify-center gap-2 px-3 text-[13px] font-semibold tracking-[0.01em] transition-colors sm:px-5 sm:text-sm ${
                tab === "bulk" ? "bg-black text-white" : "bg-transparent text-[#333333] hover:bg-[#EEEEEE]"
              }`}
            >
              <FiPackage className="h-4 w-4" />
              Bulk Offers{bulkRules.length > 0 ? ` (${bulkRules.length})` : ""}
            </button>
            <button
              onClick={() => setTab("combo")}
              className={`inline-flex h-10 items-center justify-center gap-2 px-3 text-[13px] font-semibold tracking-[0.01em] transition-colors sm:px-5 sm:text-sm ${
                tab === "combo" ? "bg-black text-white" : "bg-transparent text-[#333333] hover:bg-[#EEEEEE]"
              }`}
            >
              <FiLayers className="h-4 w-4" />
              Combo Deals{comboRules.length > 0 ? ` (${comboRules.length})` : ""}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse border border-[#F1F1F1] bg-[#F7F7F7]" />
            ))}
          </div>
        ) : (
          <>
            {tab === "bulk" &&
              (bulkRules.length === 0 ? (
                <div className="border-2 border-dashed border-[#E5E5E5] bg-[#FAFAFA] py-16 text-center">
                  <p className="text-base font-semibold text-[#232323]">No bulk offers available right now</p>
                  <p className="mt-1 text-sm text-[#7A7A7A]">Please check again shortly.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {bulkRules.map((rule) => (
                    <BulkCard key={rule.id} rule={rule} onAdd={handleAddBulk} />
                  ))}
                </div>
              ))}

            {tab === "combo" &&
              (comboRules.length === 0 ? (
                <div className="border-2 border-dashed border-[#E5E5E5] bg-[#FAFAFA] py-16 text-center">
                  <p className="text-base font-semibold text-[#232323]">No combo deals available right now</p>
                  <p className="mt-1 text-sm text-[#7A7A7A]">Please check again shortly.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {comboRules.map((rule) => (
                    <ComboCard key={rule.id} rule={rule} onAddCombo={handleAddCombo} />
                  ))}
                </div>
              ))}
          </>
        )}
      </div>
    </section>
  );
};

export default OffersPageClient;
