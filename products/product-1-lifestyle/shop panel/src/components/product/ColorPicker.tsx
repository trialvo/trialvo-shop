"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { ProductColor } from "@/types";

interface ColorPickerProps {
  colors: ProductColor[];
  selected: string;
  onSelect: (name: string) => void;
  className?: string;
}

/**
 * Determine whether white or black text gives better contrast against a hex bg.
 * Uses the W3C relative luminance formula.
 */
function contrastText(hex: string): "text-white" | "text-gray-900" {
  const raw = hex.replace("#", "");
  if (raw.length < 6) return "text-white";
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  // sRGB → linear
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return luminance > 0.4 ? "text-gray-900" : "text-white";
}

/**
 * Premium color selector with swatch circles inside chip buttons.
 * When active, the button background becomes the **actual product colour**
 * with auto-contrasted text. Inactive chips show the colour as a small swatch.
 * Uses `rounded-lg` chips to match the root theme token system.
 */
export function ColorPicker({ colors, selected, onSelect, className }: ColorPickerProps) {
  const selectedColor = colors.find((c) => c.name === selected);

  /** Pre-compute contrast classes per colour to avoid recalc on every render. */
  const contrastMap = useMemo(
    () => new Map(colors.map((c) => [c.name, contrastText(c.value)])),
    [colors],
  );

  return (
    <div className={cn("", className)}>
      {/* Label */}
      <p className="text-[12px] text-muted-foreground mb-2.5 font-medium tracking-wide">
        Color:{" "}
        <span className="text-foreground font-semibold">
          {selected || "Select"}
        </span>
        {selectedColor && (
          <span
            className="inline-block w-2.5 h-2.5 ml-1.5 align-middle rounded-full border border-border"
            style={{ backgroundColor: selectedColor.value }}
          />
        )}
      </p>

      {/* Swatch chips */}
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isActive = selected === color.name;
          const textCls = contrastMap.get(color.name) ?? "text-white";

          return (
            <button
              key={color.name}
              type="button"
              onClick={() => onSelect(color.name)}
              aria-pressed={isActive}
              aria-label={`Select color: ${color.name}`}
              className={cn(
                "group inline-flex items-center gap-2 px-3 h-9 text-[13px] font-medium rounded-lg",
                "border transition-all duration-200 cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "active:scale-[0.96]",
                isActive
                  ? `${textCls} border-transparent shadow-md`
                  : "bg-background text-foreground border-border hover:border-accent/50 hover:bg-accent/5"
              )}
              style={isActive ? { backgroundColor: color.value } : undefined}
            >
              {/* Swatch circle */}
              <span className="relative w-4 h-4 rounded-full shrink-0">
                <span
                  className={cn(
                    "absolute inset-0 rounded-full border transition-all duration-200",
                    isActive
                      ? "border-white/40 shadow-sm"
                      : "border-foreground/10 group-hover:scale-110"
                  )}
                  style={{ backgroundColor: color.value }}
                />
                {isActive && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Check
                      size={10}
                      strokeWidth={3}
                      className={cn("drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]", textCls)}
                    />
                  </span>
                )}
              </span>
              <span className="leading-none">{color.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
