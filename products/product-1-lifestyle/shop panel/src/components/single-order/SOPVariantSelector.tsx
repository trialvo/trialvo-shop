"use client";

/**
 * components/single-order/SOPVariantSelector.tsx — Color and size/variant picker
 */

import type { SOPColorOption, SOPVariantOption, SOPVariation } from "@/types/single-order";

interface SOPVariantSelectorProps {
  colors: SOPColorOption[];
  variants: SOPVariantOption[];
  selectedColorId: number | null;
  selectedVariantId: number | null;
  selectedSku: SOPVariation | null;
  onColorChange: (id: number) => void;
  onVariantChange: (id: number) => void;
}

export function SOPVariantSelector({
  colors,
  variants,
  selectedColorId,
  selectedVariantId,
  selectedSku,
  onColorChange,
  onVariantChange,
}: SOPVariantSelectorProps) {
  return (
    <>
      {/* Color Picker */}
      {colors.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-sm font-medium text-foreground flex items-center gap-1">
            <span>Color:</span>
            <span className="font-semibold">
              {selectedSku?.color?.name ?? "—"}
            </span>
            {selectedSku?.color?.hex && (
              <span
                className="h-4 w-4 rounded-[2px] border border-border ml-0.5 inline-block"
                style={{ backgroundColor: selectedSku.color.hex }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onColorChange(c.id)}
                className={`px-3 py-2 border text-sm font-medium transition-all duration-200 ${
                  selectedColorId === c.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-foreground/50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Variant / Size Picker */}
      {variants.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="text-sm font-medium text-foreground">
            {variants[0]?.attribute_name || "Size"}:{" "}
            <span className="font-semibold">
              {selectedSku?.variant?.name ?? "—"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onVariantChange(v.id)}
                className={`px-3 py-2 border text-sm font-medium transition-all duration-200 ${
                  selectedVariantId === v.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:border-foreground/50"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
