"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { cn, toPublicUrl } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addItem } from "@/redux/slices/cartSlice";
import type { BulkRule, ComboRule } from "@/redux/slices/discountSlice";
import Link from "next/link";
import React, { useState } from "react";
import { FiLayers, FiPackage, FiShoppingBag } from "react-icons/fi";
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

function formatMoney(n: number): string {
  return `BDT ${n.toLocaleString()}`;
}

function Badge({
  available,
  children,
}: {
  available: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[10px] font-bold uppercase tracking-[0.06em]",
        available ? "bg-primary text-primary-foreground" : "bg-neutral-500 text-white",
      )}
    >
      {children}
    </span>
  );
}

function AddButton({
  available,
  disabledLabel,
  children,
  onClick,
}: {
  available: boolean;
  disabledLabel: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => available && onClick()}
      disabled={!available}
      className={cn(
        "mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
        available
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "cursor-not-allowed bg-[#EFEFEF] text-[#A1A1A1]",
      )}
    >
      {available ? <FiShoppingBag className="h-4 w-4" /> : null}
      {available ? children : disabledLabel}
    </button>
  );
}

const BulkCard: React.FC<{ rule: BulkRule; onAdd: (rule: BulkRule) => void }> = ({ rule, onAdd }) => {
  const salePrice = calcSalePrice(rule.selling_price, rule.discount_type, rule.discount_value);
  const imageSrc = productImg(rule.product_image);
  const inStock = (rule.stock ?? 0) > 0;
  const hasEnoughStock = rule.stock >= rule.min_qty;
  const available = inStock && hasEnoughStock;
  const href = `/products/${rule.product_slug}/${rule.product_id}/`;
  const variant = [rule.color_name, rule.variant_name].filter(Boolean).join(" · ");
  const offerTotal = salePrice * rule.min_qty;
  const saved = (rule.selling_price - salePrice) * rule.min_qty;

  return (
    <article className="group flex overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_8px_24px_rgba(20,16,12,0.05)] transition-shadow duration-200 hover:shadow-[0_14px_36px_rgba(20,16,12,0.10)]">
      <Link
        href={href}
        className="relative w-[36%] min-w-[120px] max-w-[220px] shrink-0 self-stretch bg-[#f4efe8] min-[768px]:w-[210px]"
      >
        <ImageWithFallback
          src={imageSrc}
          alt={rule.product_name}
          fill
          sizes="220px"
          className={cn(
            "object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]",
            !available && "opacity-55 grayscale",
          )}
        />
        <div className="absolute left-2.5 top-2.5">
          <Badge available={available}>
            {available ? discountLabel(rule.discount_type, rule.discount_value) : "Stock Issue"}
          </Badge>
        </div>
        {rule.free_delivery ? (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#1A8A43] shadow-sm">
            Free delivery
          </span>
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3.5 min-[768px]:p-4">
        <div>
          <Link href={href} className="block">
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#191919]">
              {rule.product_name}
            </h3>
          </Link>
          {variant ? <p className="mt-1 truncate text-xs text-[#767676]">{variant}</p> : null}
        </div>

        <div>
          <p className="text-[11px] font-medium text-[#8A8A8A]">Unit price</p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <span className="text-xl font-bold tracking-tight text-[#191919]">{formatMoney(salePrice)}</span>
            {salePrice < rule.selling_price ? (
              <span className="text-xs text-[#999] line-through">{formatMoney(rule.selling_price)}</span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-lg bg-[#F6F4F0] text-center">
          <div className="px-1.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8A8A8A]">Qty</p>
            <p className="mt-0.5 text-sm font-bold text-[#191919]">{rule.min_qty}</p>
          </div>
          <div className="border-x border-black/6 px-1.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8A8A8A]">You pay</p>
            <p className="mt-0.5 truncate text-sm font-bold text-[#191919]">{formatMoney(offerTotal)}</p>
          </div>
          <div className="px-1.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8A8A8A]">Save</p>
            <p className="mt-0.5 truncate text-sm font-bold text-[#1A8A43]">
              {saved > 0 ? formatMoney(saved) : "—"}
            </p>
          </div>
        </div>

        {!hasEnoughStock && inStock ? (
          <p className="text-xs font-medium text-[#CC8A00]">
            Only {rule.stock} in stock, need {rule.min_qty} for this offer.
          </p>
        ) : null}

        <AddButton
          available={available}
          disabledLabel={!inStock ? "Out of stock" : "Not enough stock"}
          onClick={() => onAdd(rule)}
        >
          Add {rule.min_qty} to cart
        </AddButton>
      </div>
    </article>
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
  const shownItems = topTier.items.slice(0, 4);
  const extraItems = topTier.items.length - shownItems.length;

  const insufficientItems = topTier.items.filter((i) => i.stock < i.required_qty);
  const available = insufficientItems.length === 0;
  const cover = topTier.items[0];
  const previewThumbs = topTier.items.slice(0, 3);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_8px_24px_rgba(20,16,12,0.05)] transition-shadow duration-200 hover:shadow-[0_14px_36px_rgba(20,16,12,0.10)] min-[768px]:flex-row">
      {cover ? (
        <Link
          href={`/products/${cover.product_slug}/${cover.product_id}/`}
          className="relative aspect-[16/10] w-full shrink-0 bg-[#f4efe8] min-[768px]:aspect-auto min-[768px]:w-[210px] min-[768px]:self-stretch"
        >
          <ImageWithFallback
            src={productImg(cover.product_image)}
            alt={cover.product_name}
            fill
            sizes="(max-width: 768px) 100vw, 210px"
            className={cn(
              "object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]",
              !available && "opacity-55 grayscale",
            )}
          />
          <div className="absolute left-2.5 top-2.5">
            <Badge available={available}>
              {available ? discountLabel(topTier.discount_type, topTier.discount_value) : "Stock Issue"}
            </Badge>
          </div>
          {previewThumbs.length > 1 ? (
            <div className="absolute bottom-2.5 left-2.5 flex -space-x-2">
              {previewThumbs.map((item) => (
                <span
                  key={item.product_sku_id}
                  className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-[#f4efe8]"
                >
                  <ImageWithFallback
                    src={productImg(item.product_image)}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                </span>
              ))}
            </div>
          ) : null}
        </Link>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3.5 min-[768px]:p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8A8A8A]">
            Combo · {totalQty} items
            {rule.free_delivery ? " · Free delivery" : ""}
          </p>
          <h3 className="mt-1 text-[15px] font-semibold leading-snug text-[#191919]">{rule.name}</h3>
          {rule.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#767676]">{rule.description}</p>
          ) : null}
        </div>

        <ul className="space-y-2">
          {shownItems.map((item) => {
            const low = item.stock < item.required_qty;
            const variant = [item.color_name, item.variant_name].filter(Boolean).join(" · ");
            return (
              <li key={item.product_sku_id} className="flex items-center gap-2.5">
                <Link
                  href={`/products/${item.product_slug}/${item.product_id}/`}
                  className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[#f4efe8]"
                >
                  <ImageWithFallback
                    src={productImg(item.product_image)}
                    alt={item.product_name}
                    fill
                    sizes="44px"
                    className={cn("object-cover", low && "opacity-50 grayscale")}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.product_slug}/${item.product_id}/`}
                    className="block truncate text-xs font-medium text-[#191919] hover:underline"
                  >
                    {item.product_name}
                  </Link>
                  <p className="truncate text-[11px] text-[#767676]">
                    {variant ? `${variant} · ` : ""}
                    {low ? <span className="font-medium text-[#D93030]">only {item.stock} left</span> : "In stock"}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#F6F4F0] px-2 py-0.5 text-[11px] font-semibold text-[#191919]">
                  ×{item.required_qty}
                </span>
              </li>
            );
          })}
        </ul>
        {extraItems > 0 ? (
          <p className="text-[11px] text-[#767676]">+{extraItems} more in this combo</p>
        ) : null}

        <div className="grid grid-cols-2 overflow-hidden rounded-lg bg-[#F6F4F0] text-center">
          <div className="px-2 py-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8A8A8A]">You pay</p>
            <p className="mt-0.5 text-sm font-bold text-[#191919]">{formatMoney(finalTotal)}</p>
            {discAmt > 0 ? (
              <p className="text-[11px] text-[#999] line-through">{formatMoney(rawTotal)}</p>
            ) : null}
          </div>
          <div className="border-l border-black/6 px-2 py-2">
            <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8A8A8A]">You save</p>
            <p className="mt-0.5 text-sm font-bold text-[#1A8A43]">
              {discAmt > 0 ? formatMoney(discAmt) : "—"}
            </p>
          </div>
        </div>

        {tiersCount > 1 ? (
          <p className="text-[11px] text-[#6B6B6B]">{tiersCount} deal tiers available</p>
        ) : null}

        {!available ? (
          <p className="text-xs font-medium text-[#D93030]">
            This combo is currently unavailable due to stock limits.
          </p>
        ) : null}

        <AddButton
          available={available}
          disabledLabel="Unavailable"
          onClick={() => onAddCombo(rule)}
        >
          Add all {totalQty} to cart
        </AddButton>
      </div>
    </article>
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
      }),
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
        }),
      );
    }

    toast.success(`Added ${rule.name} combo to cart`);
  };

  return (
    <section className="container mx-auto px-3 pb-16 pt-11 min-[768px]:px-0 min-[768px]:pb-20 min-[768px]:pt-0">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Offers" }]} />

      <div className="mt-1 flex flex-col gap-1 min-[768px]:mt-2">
        <h1 className="text-[26px] font-bold leading-none tracking-[-0.02em] text-[#191919] min-[768px]:text-[32px]">
          Offers
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-[#5F5F5F]">
          See the quantity, total price, and savings on each deal before you add it to cart.
        </p>
      </div>

      <div className="sticky top-[var(--shop-header-offset,72px)] z-20 mt-5 bg-white/95 py-2 backdrop-blur-sm transition-[top] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <div className="grid grid-cols-2 rounded-xl bg-[#F3F1ED] p-1">
          <button
            type="button"
            onClick={() => setTab("bulk")}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
              tab === "bulk"
                ? "bg-white text-[#191919] shadow-[0_2px_10px_rgba(20,16,12,0.08)]"
                : "text-[#666] hover:text-[#191919]",
            )}
          >
            <FiPackage className="h-4 w-4" />
            Bulk Offers
            <span className="rounded-full bg-[#EAE6DF] px-1.5 text-[11px] font-bold text-[#555]">
              {bulkRules.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("combo")}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
              tab === "combo"
                ? "bg-white text-[#191919] shadow-[0_2px_10px_rgba(20,16,12,0.08)]"
                : "text-[#666] hover:text-[#191919]",
            )}
          >
            <FiLayers className="h-4 w-4" />
            Combo Deals
            <span className="rounded-full bg-[#EAE6DF] px-1.5 text-[11px] font-bold text-[#555]">
              {comboRules.length}
            </span>
          </button>
        </div>
      </div>

      <div className="mt-4 min-[768px]:mt-5">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 min-[992px]:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex h-52 overflow-hidden rounded-xl border border-black/8">
                <div className="w-[36%] animate-pulse bg-[#f4efe8]" />
                <div className="flex-1 space-y-3 p-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-[#eeeae4]" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#eeeae4]" />
                  <div className="h-12 w-full animate-pulse rounded-lg bg-[#eeeae4]" />
                </div>
              </div>
            ))}
          </div>
        ) : tab === "bulk" ? (
          bulkRules.length === 0 ? (
            <div className="rounded-xl bg-[#F6F4F0] px-6 py-16 text-center">
              <FiPackage className="mx-auto h-6 w-6 text-[#B5B0A8]" />
              <p className="mt-3 text-base font-semibold text-[#191919]">No bulk offers right now</p>
              <p className="mt-1 text-sm text-[#7A7A7A]">Please check again shortly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 min-[992px]:grid-cols-2">
              {bulkRules.map((rule) => (
                <BulkCard key={rule.id} rule={rule} onAdd={handleAddBulk} />
              ))}
            </div>
          )
        ) : comboRules.length === 0 ? (
          <div className="rounded-xl bg-[#F6F4F0] px-6 py-16 text-center">
            <FiLayers className="mx-auto h-6 w-6 text-[#B5B0A8]" />
            <p className="mt-3 text-base font-semibold text-[#191919]">No combo deals right now</p>
            <p className="mt-1 text-sm text-[#7A7A7A]">Please check again shortly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 min-[992px]:grid-cols-2">
            {comboRules.map((rule) => (
              <ComboCard key={rule.id} rule={rule} onAddCombo={handleAddCombo} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default OffersPageClient;
