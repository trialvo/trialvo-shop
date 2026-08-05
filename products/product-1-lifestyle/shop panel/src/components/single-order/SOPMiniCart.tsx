"use client";

/**
 * components/single-order/SOPMiniCart.tsx — Cart items display with checkout CTA
 */

import type { SOPMiniCartItem } from "@/types/single-order";

interface SOPMiniCartProps {
  items: SOPMiniCartItem[];
  total: number;
  onUpdateQty: (skuId: number, newQty: number) => void;
  onRemove: (skuId: number) => void;
  onCheckout: () => void;
}

export function SOPMiniCart({
  items,
  total,
  onUpdateQty,
  onRemove,
  onCheckout,
}: SOPMiniCartProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8 border border-border bg-secondary/30 p-4 sm:p-6 rounded">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground">
          Your Order ({items.length})
        </h2>
        <span className="text-base font-bold text-foreground">
          BDT {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.skuId}
            className="flex items-center justify-between gap-4 bg-card p-3 border border-border rounded"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {item.colorName} / {item.variantName}
              </p>
              <p className="text-xs text-muted-foreground">
                SKU: {item.sku} · ৳{item.unitPrice.toLocaleString()} each
              </p>
            </div>

            {/* Qty controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateQty(item.skuId, item.qty - 1)}
                className="h-7 w-7 border border-border text-sm font-bold rounded hover:bg-secondary transition-colors"
                aria-label="Decrease"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold text-foreground">
                {item.qty}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(item.skuId, item.qty + 1)}
                className="h-7 w-7 border border-border text-sm font-bold rounded hover:bg-secondary transition-colors"
                aria-label="Increase"
              >
                +
              </button>
            </div>

            {/* Line total */}
            <span className="text-sm font-semibold w-20 text-right text-foreground">
              ৳{(item.unitPrice * item.qty).toLocaleString()}
            </span>

            {/* Remove */}
            <button
              type="button"
              onClick={() => onRemove(item.skuId)}
              className="text-destructive hover:text-destructive/80 text-sm font-medium transition-colors"
              aria-label={`Remove ${item.colorName} ${item.variantName}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Checkout CTA */}
      <button
        type="button"
        onClick={onCheckout}
        className="mt-4 w-full h-11 bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors rounded"
      >
        Proceed to Checkout →
      </button>
    </div>
  );
}
