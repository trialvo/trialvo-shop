"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  /** Minimum allowed value (default 1) */
  min?: number;
  /** Increment/decrement step (default 1) */
  step?: number;
  /** "sm" = 7/7 buttons, "md" = 10/11 buttons (default md) */
  size?: "sm" | "md";
  className?: string;
}

const sizeMap = {
  sm: { btn: "w-7 h-7", icon: 12 as const, qty: "w-8 text-xs" },
  md: { btn: "w-10 h-11", icon: 14 as const, qty: "w-10 text-sm" },
};

/**
 * Quantity stepper: − / value / + with configurable min and step.
 * Used in cart, product detail, quick view, and bulk builder.
 */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  step = 1,
  size = "md",
  className,
}: QuantityStepperProps) {
  const cls = sizeMap[size];

  return (
    <div className={cn("flex items-center border border-border rounded-lg", className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label="Decrease quantity"
        className={cn(
          cls.btn,
          "flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        )}
      >
        <Minus size={cls.icon} />
      </button>

      <span className={cn(cls.qty, "text-center font-medium text-foreground")}>{value}</span>

      <button
        type="button"
        onClick={() => onChange(value + step)}
        aria-label="Increase quantity"
        className={cn(
          cls.btn,
          "flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        )}
      >
        <Plus size={cls.icon} />
      </button>
    </div>
  );
}
