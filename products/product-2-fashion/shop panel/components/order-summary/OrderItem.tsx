"use client";

import { cn, toPublicUrl } from "@/lib/utils";
import ImageWithFallback from "@/components/common/ImageWithFallback";
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
  const isCorrect = pathname.startsWith('/checkout/success') || pathname.startsWith('/checkout/failed');
  const unitPrice = typeof item?.originalPrice === "number" && item.originalPrice > 0
    ? item.originalPrice
    : item.price;

  return (
    <div className="flex items-start justify-between gap-1 border-b py-4">
      <div className="flex min-w-0 gap-3">
        <div className="relative h-12 w-12 shrink-0 mt-1 border border-[#f1f1f1]">
          {
            item?.image ? (
              <ImageWithFallback
                src={toPublicUrl(item?.image) || ""}
                alt={"order image"}
                fill
                className="object-cover"
              />
            ) : (<div className="flex h-full w-full items-center justify-center">
              <CiImageOff className="h-6 w-6 text-foreground/50" />
            </div>)
          }
        </div>

        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium w-full max-w-[60vw] sm:max-w-none sm:w-60 line-clamp-1">{item.title}</p>

          <div className="flex items-center gap-2 text-xs text-black">
            <span>
              Qty: {item.quantity} X BDT {unitPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end justify-end gap-1">
        <p className="text-xs sm:text-sm font-semibold">
          BDT {(unitPrice * item.quantity).toLocaleString()}
        </p>
        {
          !isCorrect && (
            <button onClick={onRemove} className={
              cn(
                "grid h-6 w-6 place-items-center cursor-pointer transition-colors",
                "text-black hover:bg-black/5"
              )
            }>
              <FiTrash2 className="h-3 w-3 text-[#FF383C]" />
            </button>
          )
        }
      </div>
    </div>
  );
};

export default OrderedItem;
