"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface SizePickerProps {
  sizes: string[];
  selected: string;
  onSelect: (size: string) => void;
  className?: string;
}

/**
 * Premium size selector with pill-style chips.
 * Active state uses the root theme `accent` colour with a floating checkmark;
 * inactive state uses a bordered outline that shifts on hover.
 * All radii use `rounded-lg` — driven by the root `--radius` token.
 */
export function SizePicker({ sizes, selected, onSelect, className }: SizePickerProps) {
  if (sizes.length === 0 || sizes[0] === "One Size") return null;

  return (
    <div className={cn("", className)}>
      {/* Label */}
      <p className="text-[12px] text-muted-foreground mb-2.5 font-medium tracking-wide">
        Size:{" "}
        <span className="text-foreground font-semibold">
          {selected || "Select"}
        </span>
      </p>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isActive = selected === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => onSelect(size)}
              aria-pressed={isActive}
              className={cn(
                "relative h-9 min-w-[44px] px-3.5 text-[13px] font-medium rounded-lg",
                "border transition-all duration-200 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "active:scale-[0.96]",
                isActive
                  ? "bg-accent text-accent-foreground border-accent shadow-sm"
                  : "bg-background text-foreground border-border hover:border-accent/50 hover:bg-accent/5"
              )}
            >
              {isActive && (
                <Check
                  size={10}
                  strokeWidth={3}
                  className="absolute -top-1 -right-1 bg-foreground text-background rounded-full p-[1px] shadow-sm"
                />
              )}
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
