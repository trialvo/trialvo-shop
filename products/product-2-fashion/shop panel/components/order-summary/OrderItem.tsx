"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { toPublicUrl } from "@/lib/utils";
import { usePathname } from "next/navigation";
import React from "react";
import { CiImageOff } from "react-icons/ci";
import { FiTrash2 } from "react-icons/fi";
import { OrderItem } from "./order.types";

type Props = {
  item: OrderItem;
  onRemove?: () => void;
};

const OrderedItem: React.FC<Props> = ({ item, onRemove }) => {
  const pathname = usePathname();
  const isCorrect = pathname.startsWith("/checkout/success") || pathname.startsWith("/checkout/failed");
  const unitPrice =
    typeof item?.originalPrice === "number" && item.originalPrice > 0
      ? item.originalPrice
      : item.price;
  const lineTotal = unitPrice * item.quantity;

  return (
    <div className="flex items-start gap-3 border-b border-[#E5E5E5] py-4 last:border-b-0">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden border border-[#E5E5E5] bg-white">
        {item?.image ? (
          <ImageWithFallback
            src={toPublicUrl(item.image) || ""}
            alt={item.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CiImageOff className="h-6 w-6 text-black/30" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-black">{item.title}</p>
        <p className="mt-1 text-xs text-black/50">
          Qty {item.quantity} × BDT {unitPrice.toLocaleString()}
        </p>
        {!isCorrect && onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove item"
            className="mt-2 inline-flex items-center gap-1 text-xs text-black/45 underline-offset-2 hover:text-black hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
          >
            <FiTrash2 className="h-3 w-3" />
            Remove
          </button>
        ) : null}
      </div>

      <p className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums text-black">
        BDT {lineTotal.toLocaleString()}
      </p>
    </div>
  );
};

export default OrderedItem;
