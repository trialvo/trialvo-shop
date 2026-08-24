"use client";

import { cn } from "@/lib/utils";
import React from "react";
import ColorOption from "./ColorOption";
import { ColorValue } from "./types";

type Props = {
  colors: readonly ColorValue[];
  selectedColor: ColorValue;
  selectedColorCode: string;
  onChange: (color: ColorValue) => void;
  unavailableColors?: ReadonlySet<ColorValue>;
  wrap?: boolean;
  className?: string;
  optionsClassName?: string;
};

export function isValidCssColor(value: string): boolean {
  const v = (value ?? "").trim();
  if (!v) return false;

  if (v.startsWith("#")) return true;
  if (v.startsWith("rgb") || v.startsWith("hsl")) return true;

  if (typeof window === "undefined") return true;
  const s = new Option().style;
  s.color = v;
  return s.color !== "";
}

const ColorSelector: React.FC<Props> = ({
  colors,
  selectedColor,
  selectedColorCode,
  onChange,
  unavailableColors,
  wrap = true,
  className,
  optionsClassName,
}) => {
  const swatch = React.useMemo(() => {
    const raw = (selectedColorCode ?? "").trim();
    if (!raw) return "#E5E7EB";
    if (!isValidCssColor(raw)) return "#E5E7EB";
    return raw;
  }, [selectedColorCode]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1.5 text-sm text-[#191919]">
        <span className="font-medium">Color:</span>
        <span className="font-semibold">{selectedColor || "—"}</span>
        <span
          aria-label={`Selected color code: ${swatch}`}
          title={swatch}
          className="ml-0.5 h-3.5 w-3.5 rounded-[2px] border border-black/10"
          style={{ backgroundColor: swatch }}
        />
      </div>

      <div
        className={cn(
          "flex gap-2",
          wrap ? "flex-wrap" : "flex-nowrap overflow-x-auto",
          !wrap && "whitespace-nowrap [-webkit-overflow-scrolling:touch]",
          !wrap && "pr-1",
          !wrap && "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          optionsClassName,
        )}
      >
        {colors.map((color) => (
          <ColorOption
            key={color}
            value={color}
            isSelected={color === selectedColor}
            isUnavailable={unavailableColors?.has(color) ?? false}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorSelector;
