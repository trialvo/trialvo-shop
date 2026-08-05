"use client";

/**
 * components/single-order/SOPProductInfo.tsx — Product name, brand, price, badges
 */

import Image from "next/image";
import { Star, Truck } from "lucide-react";

import type { SOPProduct, SOPVariation } from "@/types/single-order";
import { toSOPImageUrl } from "@/hooks/useSingleOrderProduct";

interface SOPProductInfoProps {
  product: SOPProduct;
  selectedSku: SOPVariation | null;
  unitPrice: number;
}

export function SOPProductInfo({
  product,
  selectedSku,
  unitPrice,
}: SOPProductInfoProps) {
  return (
    <div className="space-y-1">
      {/* Product Name */}
      <h1 className="w-full text-lg font-semibold text-foreground sm:w-[520px] leading-snug">
        {product.name}
      </h1>

      {/* Brand + Free Delivery */}
      {product.brand && (
        <div className="flex items-center gap-2 pt-1">
          {product.brand.image && (
            <div className="relative h-6 w-6 overflow-hidden rounded-sm border border-border bg-card">
              <Image
                src={toSOPImageUrl(product.brand.image)}
                alt={product.brand.name}
                fill
                className="object-contain p-0.5"
                sizes="24px"
              />
            </div>
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {product.brand.name}
          </span>
          {selectedSku?.free_delivery && <FreeDeliveryBadge />}
        </div>
      )}

      {!product.brand && selectedSku?.free_delivery && (
        <div className="pt-1">
          <FreeDeliveryBadge />
        </div>
      )}

      {/* Rating */}
      {product.avg_rating > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < Math.round(product.avg_rating)
                    ? "fill-accent text-accent"
                    : "fill-muted text-muted"
                }
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {product.avg_rating.toFixed(1)} ({product.review_count} reviews)
          </span>
        </div>
      )}

      {/* Price */}
      <div className="flex items-baseline gap-3 pt-1">
        <div className="text-lg font-semibold text-foreground">
          BDT {unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        {selectedSku && unitPrice < selectedSku.selling_price && (
          <div className="text-xs text-muted-foreground line-through">
            {selectedSku.selling_price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        )}
      </div>

      {/* SKU + Stock info */}
      <div className="space-y-1 text-sm pt-2">
        <div className="text-muted-foreground">
          <span className="font-medium">SKU:</span> {selectedSku?.sku || "—"}
        </div>
        <div
          className={`text-sm font-medium ${
            selectedSku && selectedSku.stock > 0
              ? "text-green-600"
              : "text-destructive"
          }`}
        >
          {selectedSku && selectedSku.stock > 0 ? "In Stock" : "Out of Stock"}
        </div>
        <div className="text-xs text-muted-foreground">
          Selected: {selectedSku?.variant?.name ?? "—"} /{" "}
          {selectedSku?.color?.name ?? "—"}
        </div>
      </div>
    </div>
  );
}

function FreeDeliveryBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
      <Truck size={12} />
      <span>Free Delivery</span>
    </div>
  );
}
