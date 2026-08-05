"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media/url";
import {
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  GitCompare,
  ImageIcon,
  Info,
  Layers,
  Package,
  Percent,
  ShoppingBag,
  Star,
  Tag,
  TrendingUp,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
import type {
  CompareProductDetail,
  CompareVariation,
} from "@/lib/api/product/service";
import type { BetterFlags } from "@/lib/compare/betterFlags";
import { fmtBdt as fmtBDT } from "@/lib/compare/fmtBdt";
import { sanitizeHexColor } from "@/lib/compare/sanitizeHexColor";
import ProductPickerSearch from "@/components/compare/ProductPickerSearch";
import { CompareImageGallery } from "@/components/compare/CompareImageGallery";
import { CompareAlert } from "@/components/compare/shared/CompareAlert";
import { CompareEmptyState } from "@/components/compare/shared/CompareEmptyState";
import { CompareGuideSteps } from "@/components/compare/shared/CompareGuideSteps";
import {
  CompareArena,
  CompareVsBadge,
} from "@/components/compare/shared/CompareArena";
import { CompareScoreboard } from "@/components/compare/shared/CompareScoreboard";
import { useCompareDetails } from "@/hooks/useCompareDetails";
import type { CompareDetailSlot } from "@/hooks/useCompareDetails";

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
    emerald: "bg-success/15 text-success border-success/30",
    blue: "bg-primary/10 text-primary border-primary/30",
    amber: "bg-warning/15 text-warning border-warning/30",
    red: "bg-destructive/10 text-destructive border-destructive/30",
    gray: "bg-secondary text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-0.5 font-semibold leading-none",
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
        "grid grid-cols-[96px_1fr_1fr] border-b border-border last:border-0 sm:grid-cols-[128px_1fr_1fr]",
        stripe && "bg-secondary/30",
      )}
    >
      <div className="flex items-center px-3 py-2.5 text-[10px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "flex min-w-0 items-center gap-1.5 border-l border-border px-3 py-2.5",
          leftBetter && "bg-success/10",
        )}
      >
        {leftBetter && (
          <Chip color="emerald" size="xs">
            ✓ Best
          </Chip>
        )}
        <span className="min-w-0 flex-1 text-xs">
          {leftNode ?? <span className="text-muted-foreground/50">—</span>}
        </span>
      </div>
      <div
        className={cn(
          "flex min-w-0 items-center gap-1.5 border-l border-border px-3 py-2.5",
          rightBetter && "bg-success/10",
        )}
      >
        {rightBetter && (
          <Chip color="emerald" size="xs">
            ✓ Best
          </Chip>
        )}
        <span className="min-w-0 flex-1 text-xs">
          {rightNode ?? <span className="text-muted-foreground/50">—</span>}
        </span>
      </div>
    </div>
  );
}

function VariantCard({ v, accent }: { v: CompareVariation; accent: string }) {
  const [open, setOpen] = React.useState(false);
  const label = discountLabel(v);

  return (
    <div
      className={cn(
        "overflow-hidden border text-xs transition-all",
        v.in_stock ? "border-border" : "border-border opacity-60",
      )}
    >
      <div className="grid grid-cols-[1fr_auto] border-b border-border bg-secondary/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {sanitizeHexColor(v.color?.hex) ? (
            <span
              className="h-3 w-3 shrink-0 border border-border"
              style={{ background: sanitizeHexColor(v.color?.hex)! }}
            />
          ) : null}
          <span className="truncate text-[11px] font-semibold text-foreground">
            {[v.color?.name, v.variant?.name].filter(Boolean).join(" · ") ||
              v.sku}
          </span>
        </div>
        <div className="flex items-center justify-end gap-1">
          {v.in_stock ? (
            <Chip color="emerald" size="xs">
              <Box size={9} />
              {v.stock}
            </Chip>
          ) : (
            <Chip color="red" size="xs">
              <XCircle size={9} />
              Out
            </Chip>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-border">
        <div className="px-3 py-2">
          <p className="mb-0.5 text-[9px] text-muted-foreground">Original</p>
          <p className="text-[11px] font-medium text-muted-foreground">
            {fmtBDT(v.selling_price)}
          </p>
        </div>
        <div className="px-3 py-2">
          <p className="mb-0.5 text-[9px] text-muted-foreground">Discount</p>
          {label ? (
            <Chip color="red" size="xs">
              {v.discount_type === 1 ? (
                <Percent size={8} />
              ) : (
                <Tag size={8} />
              )}
              {label}
            </Chip>
          ) : (
            <span className="text-[11px] text-muted-foreground/50">—</span>
          )}
        </div>
        <div className="px-3 py-2">
          <p className="mb-0.5 text-[9px] text-muted-foreground">You Pay</p>
          <p className={cn("text-[12px] font-bold", accent)}>
            {fmtBDT(v.final_price)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-3 py-1.5">
        <span className="text-[9px] text-muted-foreground">
          SKU: <span className="text-muted-foreground">{v.sku || "—"}</span>
        </span>
        {v.weight_kg != null && (
          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
            <Package size={9} />
            <span className="text-muted-foreground">{v.weight_kg} kg</span>
          </span>
        )}
        {v.bulk_rules.length > 0 && (
          <button
            onClick={() => setOpen((x) => !x)}
            className="ml-auto flex items-center gap-0.5 text-[9px] font-semibold text-foreground hover:opacity-60"
          >
            <Zap size={9} />
            {v.bulk_rules.length} bulk tier
            {v.bulk_rules.length > 1 ? "s" : ""}
            {open ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
          </button>
        )}
      </div>

      {open && v.bulk_rules.length > 0 && (
        <div className="space-y-1 border-t border-border bg-secondary/40 px-3 py-2">
          {v.bulk_rules.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-[10px]"
            >
              <span className="font-medium text-foreground">Buy {r.min_qty}+</span>
              <span className="text-muted-foreground">{r.discount_label}</span>
              <span className="font-bold text-foreground">
                {fmtBDT(r.effective_price)}/item
              </span>
            </div>
          ))}
        </div>
      )}
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
      <p className="py-4 text-center text-xs text-muted-foreground">
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

function ProductHeaderCard({
  slot,
  accent,
  side,
}: {
  slot: CompareDetailSlot | null;
  accent: string;
  side: "A" | "B";
}) {
  const d = slot?.detail;
  const img = d?.images?.[0]?.path
    ? resolveMediaUrl(d.images[0].path)
    : resolveMediaUrl(
        slot?.product?.images?.[0]?.path ?? slot?.product?.thumbnail,
      );

  if (!slot || slot.loading) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-sm border border-dashed border-border bg-secondary/30 py-10 shadow-product">
        {slot?.loading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <>
            <span
              className={cn(
                "mb-2 flex h-10 w-10 items-center justify-center rounded-sm text-sm font-bold",
                side === "A"
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/80 text-background",
              )}
            >
              {side}
            </span>
            <span className="text-sm text-muted-foreground">
              Waiting for Product {side}
            </span>
          </>
        )}
      </div>
    );
  }

  const minP = d?.summary?.min_price;
  const maxP = d?.summary?.max_price;

  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card shadow-product transition-shadow hover:shadow-product-hover">
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-3 py-2">
        <span
          className={cn(
            "inline-flex h-6 min-w-6 items-center justify-center rounded-sm px-1.5 text-[11px] font-bold",
            side === "A"
              ? "bg-primary text-primary-foreground"
              : "bg-foreground/80 text-background",
          )}
        >
          {side}
        </span>
        {d?.brand ? (
          <span className="text-[11px] text-muted-foreground">{d.brand.name}</span>
        ) : null}
      </div>
      <div className="p-4">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm border border-border bg-secondary/40">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={slot.product.name}
              className="absolute inset-0 h-full w-full object-contain p-3"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ShoppingBag className="h-9 w-9 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <Link
          href={`/product/${encodeURIComponent(slot.product.slug)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block line-clamp-2 text-sm font-bold leading-snug text-foreground transition-opacity hover:text-primary"
        >
          {slot.product.name}
        </Link>
        {d && (
          <p className="mt-2 font-heading text-lg font-bold text-primary">
            {minP === maxP
              ? fmtBDT(minP)
              : `${fmtBDT(minP)} – ${fmtBDT(maxP)}`}
          </p>
        )}
        {d && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {d.free_delivery && (
              <Chip color="emerald" size="xs">
                <Truck size={9} />
                Free Delivery
              </Chip>
            )}
            {d.featured && (
              <Chip color="gray" size="xs">
                <Star size={9} />
                Featured
              </Chip>
            )}
            {d.best_deal && (
              <Chip color="amber" size="xs">
                <Star size={9} />
                Best Deal
              </Chip>
            )}
            {d.summary.total_in_stock === 0 ? (
              <Chip color="red" size="xs">
                <XCircle size={9} />
                Out of Stock
              </Chip>
            ) : (
              <Chip color="emerald" size="xs">
                <CheckCircle2 size={9} />
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
    <span className="inline-flex items-center gap-0.5 rounded-sm bg-success px-2 py-0.5 text-[9px] font-black text-success-foreground">
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
    <div className="mb-3 flex items-center gap-2.5 rounded-sm border border-border bg-card px-4 py-3 shadow-product">
      <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
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
      <div className="overflow-hidden rounded-sm border border-border">
        <div className="flex items-center gap-1.5 border-b border-border bg-secondary/40 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-foreground">
          <Tag size={11} /> Pricing
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] text-muted-foreground">Price Range</span>
            <span className={cn("text-sm font-bold", accent)}>
              {minP === maxP
                ? fmtBDT(minP)
                : `${fmtBDT(minP)} – ${fmtBDT(maxP)}`}
            </span>
          </div>
          {maxDisc > 0 && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] text-muted-foreground">Max Discount</span>
              <Chip color="red">
                <Percent size={9} />
                {maxDisc.toFixed(0)}%
              </Chip>
            </div>
          )}
          {bestBulk != null && bestBulk < (minP ?? Infinity) && (
            <div className="flex items-center justify-between bg-secondary/30 px-3 py-2">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Zap size={10} className="text-foreground" />
                Best Bulk Price
              </span>
              <span className="text-sm font-bold text-foreground">
                {fmtBDT(bestBulk)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-border bg-secondary/40 px-3 py-2.5 text-center">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Variations
          </p>
          <p className="text-lg font-black text-foreground">
            {d.summary.total_variations}
          </p>
          {isBetter.variants && <BetterBadge />}
        </div>
        <div
          className={cn(
            "border px-3 py-2.5 text-center",
            d.summary.total_in_stock > 0
              ? "border-success/30 bg-success/10"
              : "border-destructive/30 bg-destructive/5",
          )}
        >
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Options In Stock
          </p>
          <p
            className={cn(
              "text-lg font-black",
              d.summary.total_in_stock > 0
                ? "text-success"
                : "text-destructive",
            )}
          >
            {d.summary.total_in_stock}
          </p>
          {isBetter.stock && <BetterBadge />}
        </div>
        <div className="border border-border bg-secondary/40 px-3 py-2.5 text-center">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Total Inventory
          </p>
          <p className="text-lg font-black text-foreground">
            {d.summary.total_stock.toLocaleString()}
          </p>
          {isBetter.units && <BetterBadge />}
        </div>
        <div
          className={cn(
            "border px-3 py-2.5 text-center",
            d.free_delivery
              ? "border-success/30 bg-success/10"
              : "border-border bg-secondary/40",
          )}
        >
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Delivery
          </p>
          <p
            className={cn(
              "text-sm font-black",
              d.free_delivery ? "text-success" : "text-muted-foreground",
            )}
          >
            {d.free_delivery ? "FREE" : "Paid"}
          </p>
          {isBetter.delivery && <BetterBadge />}
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-border">
        <div className="flex items-center gap-1.5 border-b border-border bg-secondary/40 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-foreground">
          <Info size={11} /> Product Details
        </div>
        <div className="divide-y divide-border">
          {d.brand && (
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] text-muted-foreground">Brand</span>
              <span className="text-xs font-medium text-foreground">
                {d.brand.name}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-0.5 px-3 py-2">
            <span className="text-[10px] text-muted-foreground">Category</span>
            <span className="text-[11px] text-muted-foreground">
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
              <span className="text-[10px] text-muted-foreground">Description</span>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {d.short_description}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Eye size={10} />
              Views
            </span>
            <span className="text-xs font-medium text-foreground">
              {d.view_count.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <ShoppingBag size={10} />
              Sold
            </span>
            <span className="text-xs font-medium text-foreground">
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
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Package size={10} />
                  Weight
                </span>
                <span className="text-xs font-medium text-foreground">
                  {mn === mx ? `${mn} kg` : `${mn}–${mx} kg`}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-border">
        <div className="flex items-center gap-1.5 border-b border-border bg-secondary/40 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-foreground">
          <Percent size={11} /> Discount Eligibility
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] text-muted-foreground">Combo Offer</span>
            <Chip color="gray" size="xs">
              May apply
            </Chip>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] text-muted-foreground">Coupon Code</span>
            <Chip color="emerald" size="xs">
              <CheckCircle2 size={9} />
              Eligible
            </Chip>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] text-muted-foreground">Bulk Tiers</span>
            {d.variations.some((v) => v.bulk_rules.length > 0) ? (
              <Chip color="blue" size="xs">
                <Zap size={9} />
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

export default function ProductComparator() {
  const {
    selectedA,
    selectedB,
    slotA,
    slotB,
    comparing,
    error,
    dA,
    dB,
    bothLoaded,
    isBetterA,
    isBetterB,
    handleSelectA,
    handleSelectB,
    handleClearA,
    handleClearB,
  } = useCompareDetails();

  const filledCount = [selectedA, selectedB].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <CompareGuideSteps filledCount={filledCount} bothLoaded={bothLoaded} />

      <CompareArena>
        <div className="relative grid grid-cols-1 gap-3 overflow-visible sm:grid-cols-2 sm:gap-4">
          <ProductPickerSearch
            slotLabel="Product A"
            slotBadge="A"
            selected={selectedA}
            onSelect={handleSelectA}
            onClear={handleClearA}
            accent="primary"
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
            <CompareVsBadge />
          </div>
          <div className="flex justify-center sm:hidden">
            <CompareVsBadge size="sm" />
          </div>
          <ProductPickerSearch
            slotLabel="Product B"
            slotBadge="B"
            selected={selectedB}
            onSelect={handleSelectB}
            onClear={handleClearB}
            accent="muted"
          />
        </div>
      </CompareArena>

      {error ? <CompareAlert>{error}</CompareAlert> : null}

      {!slotA && !slotB && !comparing ? (
        <CompareEmptyState
          icon={<GitCompare className="h-7 w-7" />}
          title="Build your matchup"
          description="Fill both slots above — or tap Compare on product cards while browsing, then come back here."
          actionHref="/"
          actionLabel="Browse the shop"
        />
      ) : null}

      {(slotA || slotB) && (
        <>
          <div className="relative grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
            <ProductHeaderCard slot={slotA} accent="text-foreground" side="A" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
              <CompareVsBadge />
            </div>
            <ProductHeaderCard
              slot={slotB}
              accent="text-muted-foreground"
              side="B"
            />
          </div>

          {comparing && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-border compare-stage py-14 shadow-product">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm font-medium text-muted-foreground">
                Fetching detailed comparison…
              </span>
            </div>
          )}

          {!comparing && (slotA || slotB) && !bothLoaded && (
            <div className="animate-compare-pop rounded-sm border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-10 text-center shadow-product sm:py-12">
              <p className="font-heading text-base font-bold text-foreground">
                {slotA && !slotB
                  ? "Almost there — add Product B"
                  : slotB && !slotA
                    ? "Add Product A to unlock compare"
                    : "Select both products"}
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
                {slotA && !slotB
                  ? "One more product unlocks the scoreboard, variants, and full side-by-side details."
                  : slotB && !slotA
                    ? "Fill the left slot to start the full side-by-side comparison."
                    : "Use the search boxes in the arena above."}
              </p>
            </div>
          )}

          {bothLoaded && dA && dB && (
            <div className="space-y-4">
              <CompareScoreboard
                left={dA}
                right={dB}
                leftBetter={isBetterA}
                rightBetter={isBetterB}
              />

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <ProductInfoPanel
                  detail={dA}
                  accent="text-foreground"
                  isBetter={isBetterA}
                />
                <ProductInfoPanel
                  detail={dB}
                  accent="text-muted-foreground"
                  isBetter={isBetterB}
                />
              </div>

              <div>
                <SectionHeader
                  icon={<Layers size={14} className="text-primary" />}
                  label="All Variations & SKU Pricing"
                />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 pl-1 text-[10px] font-bold uppercase tracking-wider text-foreground">
                      {dA.name.length > 30
                        ? dA.name.slice(0, 30) + "…"
                        : dA.name}
                    </p>
                    <VariantColumn
                      variations={dA.variations}
                      accent="text-foreground"
                    />
                  </div>
                  <div>
                    <p className="mb-2 pl-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {dB.name.length > 30
                        ? dB.name.slice(0, 30) + "…"
                        : dB.name}
                    </p>
                    <VariantColumn
                      variations={dB.variations}
                      accent="text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              <div>
                <SectionHeader
                  icon={<ImageIcon size={14} className="text-primary" />}
                  label="Product Gallery"
                />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <CompareImageGallery images={dA.images} name={dA.name} />
                  <CompareImageGallery images={dB.images} name={dB.name} />
                </div>
              </div>

              <div>
                <SectionHeader
                  icon={<TrendingUp size={14} className="text-primary" />}
                  label="Popularity & Badges"
                />
                <div className="overflow-x-auto rounded-sm border border-border bg-card shadow-product">
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
                            <Star size={9} />
                            Yes
                          </Chip>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )
                      }
                      rightNode={
                        dB.featured ? (
                          <Chip color="gray" size="xs">
                            <Star size={9} />
                            Yes
                          </Chip>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
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
                            <Star size={9} />
                            Yes
                          </Chip>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )
                      }
                      rightNode={
                        dB.best_deal ? (
                          <Chip color="amber" size="xs">
                            <Star size={9} />
                            Yes
                          </Chip>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
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
