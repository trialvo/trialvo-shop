"use client";

import ColorSelector from "@/components/color-selector/ColorSelector";
import type { ColorValue } from "@/components/color-selector/types";
import ItemQuantity from "@/components/common/ItemQuantity";
import SizeSelector from "@/components/size-selector/SizeSelector";
import type { SizeValue } from "@/components/size-selector/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { FiX } from "react-icons/fi";
import { MultiAddProduct } from "./types";

export type MultiAddLineState = {
  rowId: string;
  product: MultiAddProduct;
  size: SizeValue;
  color: ColorValue;
  quantity: number;
};

type Props = {
  index: number;
  line: MultiAddLineState;
  onChange: (next: MultiAddLineState) => void;
  onRemove?: () => void;
};

const MultiAddItemRow: React.FC<Props> = ({ index, line, onChange, onRemove }) => {
  const { t } = useTranslation();
  const currency = line.product.currency ?? "BDT";
  const maxQty = line.product.stock > 0 ? Math.min(line.product.stock, 5) : 1;

  const money = (n: number) =>
    `${currency} ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="relative grid gap-6 border-b border-[#EDEDED] py-4">
      <div className="flex items-start w-full gap-4">
        <div className="relative h-35 w-35 overflow-hidden border border-[#F1F1F1]">
          <ImageWithFallback
            src={line.product.imageSrc}
            alt={line.product.title}
            fill
            sizes="122px"
            className="object-cover"
            preload={index === 0}
          />
        </div>

        <div className="w-50">
          <div className="text-xs font-medium w-50 text-black line-clamp-2">
            {line.product.title}
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <div className="text-sm font-semibold text-black">{money(line.product.price)}</div>

            {typeof line.product.oldPrice === "number" &&
              line.product.oldPrice > line.product.price ? (
              <div className="text-xs text-[#9A9A9A] line-through">
                {money(line.product.oldPrice)}
              </div>
            ) : null}
          </div>

          <div className="mt-9 flex flex-col gap-1.5">
            <div className="text-sm font-medium text-black">{t("product.quantity")}: {line.quantity}</div>

            <ItemQuantity
              quantity={line.quantity}
              onDecrease={() =>
                onChange({ ...line, quantity: Math.max(1, line.quantity - 1) })
              }
              onIncrease={() =>
                onChange({
                  ...line,
                  quantity: Math.min(maxQty, line.quantity + 1),
                })
              }
              max={maxQty}
            />
          </div>
        </div>
        <div className="space-y-4">
          <SizeSelector
            sizes={line.product.sizes}
            selectedSize={line.size}
            onChange={(v) => onChange({ ...line, size: v })}
            wrap={false}
            optionsClassName={cn(
              "overflow-x-auto pr-2",
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
          />

          <ColorSelector
            colors={line.product.colors}
            selectedColor={line.color}
            selectedColorCode=""
            onChange={(v) => onChange({ ...line, color: v })}
            wrap={false}
            optionsClassName={cn(
              "overflow-x-auto pr-2",
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            )}
          />
        </div>
      </div>


      {index > 0 ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          className={cn(
            "absolute right-1 top-1 h-8 w-8 rounded-none p-0",
            "hover:bg-black/5",
          )}
          aria-label="Remove item"
        >
          <FiX className="h-4 w-4 text-black" />
        </Button>
      ) : null}
    </div>
  );
};

export default MultiAddItemRow;
