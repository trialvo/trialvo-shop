"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import React from "react";

export type PriceFilterValue = {
  min: number;
  max: number;
};

export type PriceFilterProps = {
  value: PriceFilterValue;
  onChange: (next: PriceFilterValue) => void;
};

const PriceFilter: React.FC<PriceFilterProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Price</h3>

      <div className="flex items-center gap-2">
        <Input
          className="h-9 rounded-none"
          value={`BDT ${value.min.toFixed(2)}`}
          onChange={(e) => {
            const num = Number(e.target.value.replaceAll(/[^\d.]/g, ""));
            onChange({ ...value, min: Number.isFinite(num) ? num : 0 });
          }}
        />
        <span className="text-muted-foreground">-</span>
        <Input
          className="h-9 rounded-none"
          value={`BDT ${value.max.toFixed(2)}`}
          onChange={(e) => {
            const num = Number(e.target.value.replaceAll(/[^\d.]/g, ""));
            onChange({ ...value, max: Number.isFinite(num) ? num : 0 });
          }}
        />
      </div>

      <Slider
        value={[value.min, value.max]}
        min={0}
        max={10000}
        step={10}
        onValueChange={(arr) => onChange({ min: arr[0] ?? 0, max: arr[1] ?? 0 })}
      />
    </div>
  );
};

export default PriceFilter;
