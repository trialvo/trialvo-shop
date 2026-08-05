"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactElement } from "react";
import { CART_QTY_MAX, CART_QTY_MIN } from "@/store/cart/types";
import { cn } from "@/lib/utils";

type CartQuantityStepperProps = Readonly<{
  quantity: number;
  onChange: (next: number) => void;
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}>;

/**
 * Shared qty control for cart lines and the edit dialog.
 */
export function CartQuantityStepper({
  quantity,
  onChange,
  size = "md",
  className,
  disabled = false,
}: CartQuantityStepperProps): ReactElement {
  const btn = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const input = size === "sm" ? "h-7 w-9 text-xs" : "h-8 w-11 text-sm";

  const clamp = (n: number) =>
    Math.min(CART_QTY_MAX, Math.max(CART_QTY_MIN, Math.floor(n)));

  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-sm border border-border bg-background",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || quantity <= CART_QTY_MIN}
        className={cn(
          btn,
          "flex cursor-pointer items-center justify-center hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40",
        )}
        onClick={() => onChange(clamp(quantity - 1))}
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="number"
        min={CART_QTY_MIN}
        max={CART_QTY_MAX}
        value={quantity}
        disabled={disabled}
        aria-label="Quantity"
        className={cn(
          input,
          "border-x border-border bg-transparent text-center font-medium tabular-nums",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          "disabled:opacity-50",
        )}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isFinite(n)) return;
          onChange(clamp(n));
        }}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || quantity >= CART_QTY_MAX}
        className={cn(
          btn,
          "flex cursor-pointer items-center justify-center hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40",
        )}
        onClick={() => onChange(clamp(quantity + 1))}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
