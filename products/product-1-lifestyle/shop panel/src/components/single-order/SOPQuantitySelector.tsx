"use client";

/**
 * components/single-order/SOPQuantitySelector.tsx — Quantity increment/decrement
 */

import { Minus, Plus } from "lucide-react";

interface SOPQuantitySelectorProps {
  qty: number;
  maxStock: number;
  onDecrease: () => void;
  onIncrease: () => void;
}

export function SOPQuantitySelector({
  qty,
  maxStock,
  onDecrease,
  onIncrease,
}: SOPQuantitySelectorProps) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm text-foreground">
        <span className="font-medium">Quantity:</span>{" "}
        <span className="font-semibold">{String(qty).padStart(2, "0")}</span>
      </div>
      <div className="flex w-[100px] items-center border border-border rounded">
        <button
          type="button"
          onClick={onDecrease}
          disabled={qty <= 1}
          className={`flex items-center justify-center p-2 ${
            qty <= 1
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:bg-secondary"
          } transition-colors`}
          aria-label="Decrease quantity"
        >
          <Minus
            size={16}
            className={
              qty <= 1
                ? "text-muted-foreground/60"
                : "text-muted-foreground"
            }
          />
        </button>
        <span className="min-w-7 text-center text-sm font-medium text-foreground">
          {String(qty).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={qty >= maxStock}
          className={`flex items-center justify-center p-2 ${
            qty >= maxStock
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:bg-secondary"
          } transition-colors`}
          aria-label="Increase quantity"
        >
          <Plus
            size={16}
            className={
              qty >= maxStock
                ? "text-muted-foreground/60"
                : "text-muted-foreground"
            }
          />
        </button>
      </div>
    </div>
  );
}
