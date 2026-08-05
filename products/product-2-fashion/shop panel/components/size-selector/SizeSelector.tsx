"use client";

import { cn } from "@/lib/utils";
import React from "react";
import SizeOption from "./SizeOption";
import { SizeValue } from "./types";

type Props = {
  sizes: readonly SizeValue[];
  selectedSize: SizeValue;
  onChange: (size: SizeValue) => void;
  /** Size names that exist but are unavailable for the current color selection */
  unavailableSizes?: ReadonlySet<SizeValue>;
  wrap?: boolean;
  className?: string;
  optionsClassName?: string;
};

const SizeSelector: React.FC<Props> = ({
  sizes,
  selectedSize,
  onChange,
  unavailableSizes,
  wrap = true,
  className,
  optionsClassName,
}) => {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="text-sm font-medium">
        Size: <span className="font-semibold">{selectedSize}</span>
      </div>

      <div
        className={cn(
          "flex gap-2",
          wrap ? "flex-wrap" : "flex-nowrap overflow-x-auto",
          !wrap && "whitespace-nowrap [-webkit-overflow-scrolling:touch]",
          !wrap && "pr-1",
          !wrap && "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          optionsClassName
        )}
      >
        {sizes.map((size) => (
          <SizeOption
            key={size}
            value={size}
            isSelected={size === selectedSize}
            isUnavailable={unavailableSizes?.has(size) ?? false}
            onClick={() => onChange(size)}
          />
        ))}
      </div>
    </div>
  );
};

export default SizeSelector;
