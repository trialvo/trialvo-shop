"use client";

import type { ReactElement } from "react";
import { CartQuantityStepper } from "@/components/cart/CartQuantityStepper";
import { cn } from "@/lib/utils";

export type CartColorOption = Readonly<{
  id: number;
  name: string;
}>;

export type CartVariantOption = Readonly<{
  id: number;
  name: string;
}>;

type CartLineOptionFieldsProps = Readonly<{
  colors: CartColorOption[];
  variants: CartVariantOption[];
  variantLabel: string;
  selectedColorId: number | null;
  selectedVariantId: number | null;
  quantity: number;
  maxQuantity: number;
  onColorChange: (colorId: number) => void;
  onVariantChange: (variantId: number) => void;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
}>;

/**
 * Shared color / variant / qty controls for the cart line edit dialog.
 */
export function CartLineOptionFields({
  colors,
  variants,
  variantLabel,
  selectedColorId,
  selectedVariantId,
  quantity,
  maxQuantity,
  onColorChange,
  onVariantChange,
  onQuantityChange,
  disabled = false,
}: CartLineOptionFieldsProps): ReactElement {
  return (
    <div className="space-y-4">
      {colors.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Color</p>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c) => {
              const selected = selectedColorId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onColorChange(c.id)}
                  className={cn(
                    "rounded-sm border px-2.5 py-1 text-xs cursor-pointer transition-colors disabled:opacity-50",
                    selected
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/40 text-foreground",
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {variants.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {variantLabel}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => {
              const selected = selectedVariantId === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onVariantChange(v.id)}
                  className={cn(
                    "rounded-sm border px-2.5 py-1 text-xs cursor-pointer transition-colors disabled:opacity-50",
                    selected
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border hover:border-primary/40 text-foreground",
                  )}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Quantity</p>
        <CartQuantityStepper
          quantity={quantity}
          disabled={disabled}
          onChange={(next) =>
            onQuantityChange(Math.min(maxQuantity, Math.max(1, next)))
          }
        />
        {maxQuantity < 99 ? (
          <p className="text-[11px] text-muted-foreground">
            Max {maxQuantity} available
          </p>
        ) : null}
      </div>
    </div>
  );
}
