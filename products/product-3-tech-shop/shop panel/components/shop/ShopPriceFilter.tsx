"use client";

import type { ReactElement } from "react";
import { AppInput } from "@/components/shared/AppInput";
import { Slider } from "@/components/ui/slider";
import { SHOP_DEFAULT_MAX_PRICE } from "@/lib/shop/shopFilters";
import { cn } from "@/lib/utils";

export type ShopPriceFilterValue = Readonly<{
  min: number;
  max: number;
}>;

type ShopPriceFilterProps = Readonly<{
  value: ShopPriceFilterValue;
  onChange: (next: ShopPriceFilterValue) => void;
  absoluteMax?: number;
}>;

const PRICE_PRESETS = [
  { label: "Under ৳1,000", min: 0, max: 1000 },
  { label: "৳1k–5k", min: 1000, max: 5000 },
  { label: "৳5k–15k", min: 5000, max: 15000 },
  { label: "৳15k+", min: 15000, max: SHOP_DEFAULT_MAX_PRICE },
] as const;

/**
 * Price filter — dual BDT inputs + slider + quick presets.
 */
export function ShopPriceFilter({
  value,
  onChange,
  absoluteMax = SHOP_DEFAULT_MAX_PRICE,
}: ShopPriceFilterProps): ReactElement {
  const min = Math.max(0, Math.min(value.min, absoluteMax));
  const max = Math.max(min, Math.min(value.max, absoluteMax));

  const isPresetActive = (presetMin: number, presetMax: number) =>
    min === presetMin && max === presetMax;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Price</h3>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          ৳{min.toLocaleString()} – ৳{max.toLocaleString()}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRICE_PRESETS.map((preset) => {
          const active = isPresetActive(preset.min, preset.max);
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange({ min: preset.min, max: preset.max })}
              className={cn(
                "rounded-sm border px-2 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Min
          </label>
          <AppInput
            className="h-9 rounded-sm"
            value={`৳ ${min.toLocaleString()}`}
            onValueChange={(raw) => {
              const num = Number(String(raw).replaceAll(/[^\d]/g, ""));
              onChange({
                min: Number.isFinite(num) ? Math.min(num, max) : 0,
                max,
              });
            }}
            sanitize={false}
            inputSize="sm"
            tone="muted"
            containerClassName="w-full"
            aria-label="Minimum price"
          />
        </div>
        <span className="mt-5 shrink-0 text-muted-foreground" aria-hidden>
          –
        </span>
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Max
          </label>
          <AppInput
            className="h-9 rounded-sm"
            value={`৳ ${max.toLocaleString()}`}
            onValueChange={(raw) => {
              const num = Number(String(raw).replaceAll(/[^\d]/g, ""));
              onChange({
                min,
                max: Number.isFinite(num) ? Math.max(num, min) : absoluteMax,
              });
            }}
            sanitize={false}
            inputSize="sm"
            tone="muted"
            containerClassName="w-full"
            aria-label="Maximum price"
          />
        </div>
      </div>

      <Slider
        value={[min, max]}
        min={0}
        max={absoluteMax}
        step={100}
        onValueChange={(arr) =>
          onChange({
            min: arr[0] ?? 0,
            max: arr[1] ?? absoluteMax,
          })
        }
        className="py-2"
      />
    </div>
  );
}

export default ShopPriceFilter;
