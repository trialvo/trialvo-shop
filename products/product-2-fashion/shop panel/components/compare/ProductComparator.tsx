"use client";

import "swiper/css";

import * as React from "react";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import Link from "next/link";
import { cn, toPublicUrl } from "@/lib/utils";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import type {
  CompareProductDetail,
  CompareVariation,
} from "@/lib/api/product/service";
import { productService } from "@/lib/api/product/service";
import type { ProductListItem } from "@/lib/api/product/service";
import ProductPickerSearch from "./ProductPickerSearch";
import { useCompareStore } from "@/hooks/useCompareStore";
import type { CompareSlot } from "@/hooks/useCompareStore";
import {
  FiBox,
  FiCheckCircle,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiEye,
  FiGitCommit,
  FiInfo,
  FiLayers,
  FiPackage,
  FiPercent,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiTrendingUp,
  FiTruck,
  FiXCircle,
  FiZap,
} from "react-icons/fi";

type SlotState = {
  product: ProductListItem;
  detail: CompareProductDetail | null;
  loading: boolean;
};

type BetterFlags = {
  price: boolean;
  variants: boolean;
  stock: boolean;
  units: boolean;
  delivery: boolean;
  sell: boolean;
};

function fmtBDT(n: number | null | undefined) {
  if (n == null) return "—";
  return `৳${Number(n).toLocaleString()}`;
}

function discountLabel(v: CompareVariation) {
  if (!v.discount || v.discount === 0) return null;
  return v.discount_type === 1 ? `${v.discount}% off` : `৳${v.discount} off`;
}

type ChipColor =
  | "emerald"
  | "blue"
  | "amber"
  | "red"
  | "gray";

function Chip({
  children,
  color = "gray",
  size = "sm",
}: {
  children: React.ReactNode;
  color?: ChipColor;
  size?: "xs" | "sm";
}) {
  const colorMap: Record<ChipColor, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    blue: "bg-[#F6F4F0] text-[#191919] border-black/8",
    amber: "bg-amber-50 text-amber-800 border-amber-200/80",
    red: "bg-red-50 text-red-600 border-red-200/80",
    gray: "bg-[#F3F1ED] text-[#6B6B6B] border-black/8",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold leading-none",
        size === "xs" ? "text-[10px]" : "text-[11px]",
        colorMap[color],
      )}
    >
      {children}
    </span>
  );
}

function DataRow({
  label,
  leftNode,
  rightNode,
  leftBetter,
  rightBetter,
  stripe,
}: {
  label: string;
  leftNode: React.ReactNode;
  rightNode: React.ReactNode;
  leftBetter?: boolean;
  rightBetter?: boolean;
  stripe?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[96px_1fr_1fr] border-b border-black/6 last:border-0 sm:grid-cols-[128px_1fr_1fr]",
        stripe && "bg-[#FAF8F5]",
      )}
    >
      <div className="flex items-center px-3 py-2.5 text-[10px] font-semibold uppercase leading-tight tracking-wider text-gray-400">
        {label}
      </div>
      <div
        className={cn(
          "flex min-w-0 items-center gap-1.5 border-l border-black/6 px-3 py-2.5",
          leftBetter && "bg-emerald-50/80",
        )}
      >
        {leftBetter && (
          <Chip color="emerald" size="xs">
            ✓ Best
          </Chip>
        )}
        <span className="min-w-0 flex-1 text-xs">
          {leftNode ?? <span className="text-gray-300">—</span>}
        </span>
      </div>
      <div
        className={cn(
          "flex min-w-0 items-center gap-1.5 border-l border-black/6 px-3 py-2.5",
          rightBetter && "bg-emerald-50/80",
        )}
      >
        {rightBetter && (
          <Chip color="emerald" size="xs">
            ✓ Best
          </Chip>
        )}
        <span className="min-w-0 flex-1 text-xs">
          {rightNode ?? <span className="text-gray-300">—</span>}
        </span>
      </div>
    </div>
  );
}

function VariantCard({ v, accent }: { v: CompareVariation; accent: string }) {
  const [open, setOpen] = React.useState(false);
  const label = discountLabel(v);
  const title =
    [v.color?.name, v.variant?.name].filter(Boolean).join(" · ") || v.sku;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white text-xs shadow-[0_4px_16px_rgba(20,16,12,0.04)]",
        v.in_stock ? "border-black/8" : "border-black/6 opacity-60",
      )}
    >
      <div className="flex items-center justify-between gap-2 bg-[#FAF8F5] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {v.color?.hex ? (
            <span
              className="h-4 w-4 shrink-0 rounded-full border border-black/10"
              style={{ background: v.color.hex }}
            />
          ) : null}
          <span className="truncate text-[12px] font-semibold text-[#191919]">{title}</span>
        </div>
        {v.in_stock ? (
          <Chip color="emerald" size="xs">
            <FiBox size={9} />
            {v.stock} in stock
          </Chip>
        ) : (
          <Chip color="red" size="xs">
            <FiXCircle size={9} />
            Out
          </Chip>
        )}
      </div>

      <div className="grid grid-cols-3 text-center">
        <div className="px-2 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8A8A8A]">
            Original
          </p>
          <p className="mt-0.5 text-[12px] font-medium text-[#6B6B6B]">{fmtBDT(v.selling_price)}</p>
        </div>
        <div className="border-x border-black/6 px-2 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8A8A8A]">
            Discount
          </p>
          <div className="mt-0.5 flex justify-center">
            {label ? (
              <Chip color="red" size="xs">
                {v.discount_type === 1 ? <FiPercent size={8} /> : <FiTag size={8} />}
                {label}
              </Chip>
            ) : (
              <span className="text-[12px] text-[#C4C4C4]">—</span>
            )}
          </div>
        </div>
        <div className="px-2 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#8A8A8A]">
            You pay
          </p>
          <p className={cn("mt-0.5 text-[13px] font-bold", accent)}>{fmtBDT(v.final_price)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-black/6 px-3 py-2">
        <span className="text-[10px] text-[#8A8A8A]">
          SKU <span className="font-medium text-[#191919]">{v.sku || "—"}</span>
        </span>
        {v.weight_kg != null ? (
          <span className="inline-flex items-center gap-0.5 text-[10px] text-[#8A8A8A]">
            <FiPackage size={10} />
            <span className="font-medium text-[#191919]">{v.weight_kg} kg</span>
          </span>
        ) : null}
        {v.bulk_rules.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen((x) => !x)}
            className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#191919] hover:opacity-60"
          >
            <FiZap size={10} />
            {v.bulk_rules.length} bulk tier{v.bulk_rules.length > 1 ? "s" : ""}
            {open ? <FiChevronUp size={11} /> : <FiChevronDown size={11} />}
          </button>
        ) : null}
      </div>

      {open && v.bulk_rules.length > 0 ? (
        <div className="space-y-1.5 border-t border-black/6 bg-[#FAF8F5] px-3 py-2.5">
          {v.bulk_rules.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-[#191919]">Buy {r.min_qty}+</span>
              <span className="text-[#6B6B6B]">{r.discount_label}</span>
              <span className="font-bold text-[#191919]">{fmtBDT(r.effective_price)}/item</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VariantColumn({
  variations,
  accent,
}: {
  variations: CompareVariation[];
  accent: string;
}) {
  if (!variations?.length)
    return (
      <p className="py-4 text-center text-xs text-gray-400">
        No variations found
      </p>
    );
  return (
    <div className="space-y-2">
      {variations.map((v) => (
        <VariantCard key={v.id} v={v} accent={accent} />
      ))}
    </div>
  );
}

type GalleryImage = { id: number; path: string; serial?: number; position?: number };

function CompareImageSlider({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const [active, setActive] = React.useState(0);
  const swiperRef = React.useRef<SwiperType | null>(null);
  const list = Array.isArray(images) ? images : [];
  const hasMultiple = list.length > 1;

  const goTo = (index: number) => {
    swiperRef.current?.slideTo(index);
    setActive(index);
  };

  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-[#f4efe8]">
        {list.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <FiShoppingBag className="h-8 w-8 text-[#C8C2BA]" />
          </div>
        ) : (
          <Swiper
            className="h-full w-full [&>.swiper-wrapper]:h-full [&_.swiper-slide]:h-full"
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => setActive(swiper.activeIndex)}
            grabCursor={hasMultiple}
          >
            {list.map((img, i) => {
              const src = toPublicUrl(img.path);
              return (
                <SwiperSlide key={`${img.id}-${i}`} className="relative h-full">
                  {src ? (
                    <ImageWithFallback
                      src={src}
                      alt={`${name} ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FiShoppingBag className="h-8 w-8 text-[#C8C2BA]" />
                    </div>
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}

        {hasMultiple ? (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => swiperRef.current?.slidePrev()}
              className="absolute left-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-black/8 bg-white text-[#191919] shadow-sm transition hover:bg-[#F6F4F0]"
            >
              <FiChevronLeft className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => swiperRef.current?.slideNext()}
              className="absolute right-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-black/8 bg-white text-[#191919] shadow-sm transition hover:bg-[#F6F4F0]"
            >
              <FiChevronRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </>
        ) : null}
      </div>

      {hasMultiple ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5">
            {list.map((img, i) => {
              const src = toPublicUrl(img.path);
              return (
                <button
                  key={`${img.id}-${i}`}
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    "relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[#f4efe8] transition",
                    active === i
                      ? "border border-[#191919]"
                      : "border border-transparent opacity-70 hover:opacity-100",
                  )}
                >
                  {src ? (
                    <ImageWithFallback
                      src={src}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover object-center"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-[#8A8A8A]">
            {active + 1}/{list.length}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ProductHeaderCard({
  slot,
  accent,
  side,
}: {
  slot: SlotState | null;
  accent: string;
  side: "A" | "B";
}) {
  const d = slot?.detail;
  const headerImages: GalleryImage[] = d?.images?.length
    ? d.images
    : Array.isArray(slot?.product?.images) && slot.product.images.length > 0
      ? slot.product.images
      : slot?.product?.thumbnail
        ? [{ id: 0, path: slot.product.thumbnail }]
        : [];

  if (!slot || slot.loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-[#FAF8F5] py-12">
        {slot?.loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#191919] border-t-transparent" />
        ) : (
          <span className="text-sm text-[#8A8A8A]">Select Product {side}</span>
        )}
      </div>
    );
  }

  const minP = d?.summary?.min_price;
  const maxP = d?.summary?.max_price;

  return (
    <div className="overflow-hidden rounded-xl border border-black/8 bg-white shadow-[0_8px_24px_rgba(20,16,12,0.05)]">
      <div className="p-3 min-[768px]:p-4">
        <CompareImageSlider images={headerImages} name={slot.product.name} />
        <div
          className={cn(
            "mt-3 h-0.5 w-full rounded-full",
            accent === "text-black" ? "bg-primary" : "bg-[#8A8A8A]",
          )}
        />
        <Link
          href={`/products/${encodeURIComponent(slot.product.slug)}/${slot.product.id}`}
          target="_blank"
          className="mt-2 block text-sm font-bold leading-snug text-black transition-opacity hover:opacity-60 line-clamp-2"
        >
          {slot.product.name}
        </Link>
        {d?.brand && (
          <p className="mt-0.5 text-[11px] text-gray-400">{d.brand.name}</p>
        )}
        {d && (
          <p className={cn("mt-2 text-base font-black", accent)}>
            {minP === maxP
              ? fmtBDT(minP)
              : `${fmtBDT(minP)} – ${fmtBDT(maxP)}`}
          </p>
        )}
        {d && (
          <div className="mt-2 flex flex-wrap gap-1">
            {d.free_delivery && (
              <Chip color="emerald" size="xs">
                <FiTruck size={9} />
                Free Delivery
              </Chip>
            )}
            {d.featured && (
              <Chip color="gray" size="xs">
                <FiStar size={9} />
                Featured
              </Chip>
            )}
            {d.best_deal && (
              <Chip color="amber" size="xs">
                <FiStar size={9} />
                Best Deal
              </Chip>
            )}
            {d.summary.total_in_stock === 0 ? (
              <Chip color="red" size="xs">
                <FiXCircle size={9} />
                Out of Stock
              </Chip>
            ) : (
              <Chip color="emerald" size="xs">
                <FiCheckCircle size={9} />
                {d.summary.total_in_stock} option
                {d.summary.total_in_stock > 1 ? "s" : ""} in stock
              </Chip>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BetterBadge() {
  return (
    <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white">
      ✓ Better
    </span>
  );
}

function SectionHeader({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#F6F4F0] px-4 py-3">
      {icon}
      <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#191919]">
        {label}
      </span>
    </div>
  );
}

function ProductInfoPanel({
  detail,
  accent,
  isBetter,
}: {
  detail: CompareProductDetail;
  accent: string;
  isBetter: BetterFlags;
}) {
  const d = detail;
  const minP = d.summary.min_price;
  const maxP = d.summary.max_price;
  const maxDisc = d.variations.length
    ? Math.max(
        ...d.variations.map((v) =>
          v.discount_type === 1
            ? v.discount
            : v.item_discount_amount > 0
              ? (v.item_discount_amount / v.selling_price) * 100
              : 0,
        ),
      )
    : 0;
  const bestBulk = d.variations.length
    ? Math.min(
        ...d.variations.flatMap((v) => [
          v.final_price,
          ...v.bulk_rules.map((r) => r.effective_price),
        ]),
      )
    : null;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-black/8">
        <div className="flex items-center gap-1.5 border-b border-black/6 bg-[#FAF8F5] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#191919]">
          <FiTag size={11} /> Pricing
        </div>
        <div className="divide-y divide-black/6">
          <div className="flex items-center justify-between px-3.5 py-2.5">
            <span className="text-[11px] text-[#8A8A8A]">Price Range</span>
            <span className={cn("text-sm font-bold", accent)}>
              {minP === maxP
                ? fmtBDT(minP)
                : `${fmtBDT(minP)} – ${fmtBDT(maxP)}`}
            </span>
          </div>
          {maxDisc > 0 && (
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <span className="text-[11px] text-[#8A8A8A]">Max Discount</span>
              <Chip color="red">
                <FiPercent size={9} />
                {maxDisc.toFixed(0)}%
              </Chip>
            </div>
          )}
          {bestBulk != null && bestBulk < (minP ?? Infinity) && (
            <div className="flex items-center justify-between bg-[#FAF8F5] px-3.5 py-2.5">
              <span className="flex items-center gap-1 text-[11px] text-[#8A8A8A]">
                <FiZap size={10} className="text-[#191919]" />
                Best Bulk Price
              </span>
              <span className="text-sm font-bold text-black">
                {fmtBDT(bestBulk)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-black/8 bg-[#FAF8F5] px-3 py-2.5 text-center">
          <p className="text-[9px] uppercase tracking-wider text-[#8A8A8A]">
            Variations
          </p>
          <p className="text-lg font-black text-black">
            {d.summary.total_variations}
          </p>
          {isBetter.variants && <BetterBadge />}
        </div>
        <div
          className={cn(
            "rounded-xl border px-3 py-2.5 text-center",
            d.summary.total_in_stock > 0
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50",
          )}
        >
          <p className="text-[9px] uppercase tracking-wider text-gray-400">
            Options In Stock
          </p>
          <p
            className={cn(
              "text-lg font-black",
              d.summary.total_in_stock > 0
                ? "text-emerald-700"
                : "text-red-600",
            )}
          >
            {d.summary.total_in_stock}
          </p>
          {isBetter.stock && <BetterBadge />}
        </div>
        <div className="rounded-xl border border-black/8 bg-[#FAF8F5] px-3 py-2.5 text-center">
          <p className="text-[9px] uppercase tracking-wider text-[#8A8A8A]">
            Total Inventory
          </p>
          <p className="text-lg font-black text-black">
            {d.summary.total_stock.toLocaleString()}
          </p>
          {isBetter.units && <BetterBadge />}
        </div>
        <div
          className={cn(
            "rounded-xl border px-3 py-2.5 text-center",
            d.free_delivery
              ? "border-emerald-200 bg-emerald-50"
              : "border-black/8 bg-[#FAF8F5]",
          )}
        >
          <p className="text-[9px] uppercase tracking-wider text-gray-400">
            Delivery
          </p>
          <p
            className={cn(
              "text-sm font-black",
              d.free_delivery ? "text-emerald-700" : "text-gray-600",
            )}
          >
            {d.free_delivery ? "FREE" : "Paid"}
          </p>
          {isBetter.delivery && <BetterBadge />}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/8">
        <div className="flex items-center gap-1.5 border-b border-black/6 bg-[#FAF8F5] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#191919]">
          <FiInfo size={11} /> Product Details
        </div>
        <div className="divide-y divide-black/6">
          {d.brand && (
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <span className="text-[11px] text-[#8A8A8A]">Brand</span>
              <span className="text-xs font-medium text-black">
                {d.brand.name}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-0.5 px-3 py-2">
            <span className="text-[10px] text-gray-400">Category</span>
            <span className="text-[11px] text-gray-600">
              {[
                d.main_category?.name,
                d.sub_category?.name,
                d.child_category?.name,
              ]
                .filter(Boolean)
                .join(" › ")}
            </span>
          </div>
          {d.short_description && (
            <div className="flex flex-col gap-0.5 px-3 py-2">
              <span className="text-[10px] text-gray-400">Description</span>
              <p className="text-[11px] leading-relaxed text-gray-600">
                {d.short_description}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <FiEye size={10} />
              Views
            </span>
            <span className="text-xs font-medium text-black">
              {d.view_count.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="flex items-center gap-1 text-[10px] text-gray-400">
              <FiShoppingBag size={10} />
              Sold
            </span>
            <span className="text-xs font-medium text-black">
              {d.sell_count.toLocaleString()} units
            </span>
          </div>
          {(() => {
            const wts = d.variations
              .map((v) => v.weight_kg)
              .filter((w): w is number => w != null);
            if (!wts.length) return null;
            const mn = Math.min(...wts);
            const mx = Math.max(...wts);
            return (
              <div className="flex items-center justify-between px-3 py-2">
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <FiPackage size={10} />
                  Weight
                </span>
                <span className="text-xs font-medium text-black">
                  {mn === mx ? `${mn} kg` : `${mn}–${mx} kg`}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-black/8">
        <div className="flex items-center gap-1.5 border-b border-black/6 bg-[#FAF8F5] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#191919]">
          <FiPercent size={11} /> Discount Eligibility
        </div>
        <div className="divide-y divide-black/[0.04]">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] text-gray-400">Combo Offer</span>
            <Chip color="gray" size="xs">
              May apply
            </Chip>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] text-gray-400">Coupon Code</span>
            <Chip color="emerald" size="xs">
              <FiCheckCircle size={9} />
              Eligible
            </Chip>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] text-gray-400">Bulk Tiers</span>
            {d.variations.some((v) => v.bulk_rules.length > 0) ? (
              <Chip color="blue" size="xs">
                <FiZap size={9} />
                Available
              </Chip>
            ) : (
              <Chip color="gray" size="xs">
                None
              </Chip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY_BETTER: BetterFlags = {
  price: false,
  variants: false,
  stock: false,
  units: false,
  delivery: false,
  sell: false,
};

function slotToProductListItem(slot: CompareSlot): ProductListItem {
  return slot as unknown as ProductListItem;
}

export default function ProductComparator() {
  const { slots } = useCompareStore();

  const [selectedA, setSelectedA] =
    React.useState<ProductListItem | null>(null);
  const [selectedB, setSelectedB] =
    React.useState<ProductListItem | null>(null);
  const [slotA, setSlotA] = React.useState<SlotState | null>(null);
  const [slotB, setSlotB] = React.useState<SlotState | null>(null);
  const [comparing, setComparing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const autoLoaded = React.useRef(false);

  const loadCompare = React.useCallback(
    async (pA: ProductListItem, pB: ProductListItem) => {
      setComparing(true);
      setError(null);
      setSlotA({ product: pA, detail: null, loading: true });
      setSlotB({ product: pB, detail: null, loading: true });
      try {
        if (pA.id === pB.id) {
          const res = await productService.compareProducts([pA.id]);
          const d = res?.data?.[0] ?? null;
          setSlotA({ product: pA, detail: d, loading: false });
          setSlotB({ product: pB, detail: d, loading: false });
        } else {
          const res = await productService.compareProducts([pA.id, pB.id]);
          const items: CompareProductDetail[] = Array.isArray(res?.data)
            ? res.data
            : [];
          setSlotA({
            product: pA,
            detail:
              items.find((d) => Number(d.id) === Number(pA.id)) ?? null,
            loading: false,
          });
          setSlotB({
            product: pB,
            detail:
              items.find((d) => Number(d.id) === Number(pB.id)) ?? null,
            loading: false,
          });
        }
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "Failed to load comparison.";
        setError(message);
        setSlotA({ product: pA, detail: null, loading: false });
        setSlotB({ product: pB, detail: null, loading: false });
      } finally {
        setComparing(false);
      }
    },
    [],
  );

  const loadSingle = React.useCallback(
    async (
      p: ProductListItem,
      setter: React.Dispatch<React.SetStateAction<SlotState | null>>,
    ) => {
      setter({ product: p, detail: null, loading: true });
      try {
        const res = await productService.compareProducts([p.id]);
        const items: CompareProductDetail[] = Array.isArray(res?.data)
          ? res.data
          : [];
        setter({ product: p, detail: items[0] ?? null, loading: false });
      } catch {
        setter({ product: p, detail: null, loading: false });
      }
    },
    [],
  );

  React.useEffect(() => {
    if (autoLoaded.current) return;
    const [s0, s1] = slots;
    if (!s0) return;
    autoLoaded.current = true;
    const pA = slotToProductListItem(s0);
    const pB = s1 ? slotToProductListItem(s1) : null;
    setSelectedA(pA);
    if (pB) {
      setSelectedB(pB);
      loadCompare(pA, pB);
    } else {
      loadSingle(pA, setSlotA);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadCompare, loadSingle]);

  const handleSelectA = React.useCallback(
    (p: ProductListItem) => {
      setSelectedA(p);
      if (selectedB) loadCompare(p, selectedB);
      else loadSingle(p, setSlotA);
    },
    [selectedB, loadCompare, loadSingle],
  );

  const handleSelectB = React.useCallback(
    (p: ProductListItem) => {
      setSelectedB(p);
      if (selectedA) loadCompare(selectedA, p);
      else loadSingle(p, setSlotB);
    },
    [selectedA, loadCompare, loadSingle],
  );

  const handleClearA = () => {
    setSelectedA(null);
    setSlotA(null);
  };
  const handleClearB = () => {
    setSelectedB(null);
    setSlotB(null);
  };

  const dA = slotA?.detail ?? null;
  const dB = slotB?.detail ?? null;
  const bothLoaded = !!dA && !!dB && !comparing;

  const isBetterA: BetterFlags =
    bothLoaded && dA && dB
      ? {
          price:
            (dA.summary.min_price ?? Infinity) <
            (dB.summary.min_price ?? Infinity),
          variants:
            dA.summary.total_variations > dB.summary.total_variations,
          stock: dA.summary.total_in_stock > dB.summary.total_in_stock,
          units: dA.summary.total_stock > dB.summary.total_stock,
          delivery: dA.free_delivery && !dB.free_delivery,
          sell: dA.sell_count > dB.sell_count,
        }
      : EMPTY_BETTER;

  const isBetterB: BetterFlags =
    bothLoaded && dA && dB
      ? {
          price:
            (dB.summary.min_price ?? Infinity) <
            (dA.summary.min_price ?? Infinity),
          variants:
            dB.summary.total_variations > dA.summary.total_variations,
          stock: dB.summary.total_in_stock > dA.summary.total_in_stock,
          units: dB.summary.total_stock > dA.summary.total_stock,
          delivery: dB.free_delivery && !dA.free_delivery,
          sell: dB.sell_count > dA.sell_count,
        }
      : EMPTY_BETTER;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ProductPickerSearch
          slotLabel="Product A — Left"
          selected={selectedA}
          onSelect={handleSelectA}
          onClear={handleClearA}
          accentColor="bg-primary"
        />
        <ProductPickerSearch
          slotLabel="Product B — Right"
          selected={selectedB}
          onSelect={handleSelectB}
          onClear={handleClearB}
          accentColor="bg-[#8A8A8A]"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <FiInfo size={14} className="mt-0.5 shrink-0 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!slotA && !slotB && !comparing && (
        <div className="flex flex-col items-center justify-center rounded-xl bg-[#F6F4F0] px-6 py-20 text-center min-[768px]:py-24">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
            <FiGitCommit className="h-7 w-7 text-[#B5B0A8]" />
          </div>
          <p className="mt-4 text-sm font-bold text-[#191919]">
            Select two products to compare
          </p>
          <p className="mt-1 max-w-sm text-xs text-[#8A8A8A]">
            Use the search boxes above, or browse products and click the Compare
            button.
          </p>
        </div>
      )}

      {(slotA || slotB) && (
        <>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ProductHeaderCard slot={slotA} accent="text-black" side="A" />
            <ProductHeaderCard
              slot={slotB}
              accent="text-gray-600"
              side="B"
            />
          </div>

          {comparing && (
            <div className="flex items-center justify-center gap-3 py-16 text-[#767676]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#191919] border-t-transparent" />
              <span className="text-sm font-medium">
                Fetching detailed comparison…
              </span>
            </div>
          )}

          {!comparing && (slotA || slotB) && !bothLoaded && (
            <div className="rounded-xl bg-[#F6F4F0] py-10 text-center text-sm text-[#8A8A8A] min-[768px]:py-12">
              {slotA && !slotB
                ? "Now pick Product B above to see the full comparison"
                : slotB && !slotA
                  ? "Pick Product A above to start comparing"
                  : "Select both products above"}
            </div>
          )}

          {bothLoaded && dA && dB && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <ProductInfoPanel
                  detail={dA}
                  accent="text-black"
                  isBetter={isBetterA}
                />
                <ProductInfoPanel
                  detail={dB}
                  accent="text-gray-600"
                  isBetter={isBetterB}
                />
              </div>

              <div>
                <SectionHeader
                  icon={<FiLayers size={14} className="text-black" />}
                  label="All Variations & SKU Pricing"
                />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 pl-1 text-[10px] font-bold uppercase tracking-wider text-black">
                      {dA.name.length > 30
                        ? dA.name.slice(0, 30) + "…"
                        : dA.name}
                    </p>
                    <VariantColumn
                      variations={dA.variations}
                      accent="text-black"
                    />
                  </div>
                  <div>
                    <p className="mb-2 pl-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                      {dB.name.length > 30
                        ? dB.name.slice(0, 30) + "…"
                        : dB.name}
                    </p>
                    <VariantColumn
                      variations={dB.variations}
                      accent="text-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <SectionHeader
                  icon={<FiTrendingUp size={14} className="text-black" />}
                  label="Popularity & Badges"
                />
                <div className="overflow-x-auto rounded-xl border border-black/8 bg-white shadow-[0_8px_24px_rgba(20,16,12,0.05)]">
                  <div className="min-w-[360px] overflow-hidden">
                    <DataRow
                      label="Views"
                      leftNode={
                        <span className="font-medium">
                          {dA.view_count.toLocaleString()}
                        </span>
                      }
                      rightNode={
                        <span className="font-medium">
                          {dB.view_count.toLocaleString()}
                        </span>
                      }
                      leftBetter={dA.view_count > dB.view_count}
                      rightBetter={dB.view_count > dA.view_count}
                    />
                    <DataRow
                      label="Sold"
                      leftNode={
                        <span className="font-medium">
                          {dA.sell_count.toLocaleString()} units
                        </span>
                      }
                      rightNode={
                        <span className="font-medium">
                          {dB.sell_count.toLocaleString()} units
                        </span>
                      }
                      leftBetter={dA.sell_count > dB.sell_count}
                      rightBetter={dB.sell_count > dA.sell_count}
                      stripe
                    />
                    <DataRow
                      label="Featured"
                      leftNode={
                        dA.featured ? (
                          <Chip color="gray" size="xs">
                            <FiStar size={9} />
                            Yes
                          </Chip>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )
                      }
                      rightNode={
                        dB.featured ? (
                          <Chip color="gray" size="xs">
                            <FiStar size={9} />
                            Yes
                          </Chip>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )
                      }
                      leftBetter={dA.featured && !dB.featured}
                      rightBetter={dB.featured && !dA.featured}
                    />
                    <DataRow
                      label="Best Deal"
                      leftNode={
                        dA.best_deal ? (
                          <Chip color="amber" size="xs">
                            <FiStar size={9} />
                            Yes
                          </Chip>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )
                      }
                      rightNode={
                        dB.best_deal ? (
                          <Chip color="amber" size="xs">
                            <FiStar size={9} />
                            Yes
                          </Chip>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )
                      }
                      leftBetter={dA.best_deal && !dB.best_deal}
                      rightBetter={dB.best_deal && !dA.best_deal}
                      stripe
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
