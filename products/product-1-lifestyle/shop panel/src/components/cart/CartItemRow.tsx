"use client";

import { QuantityStepper } from "@/components/ui/QuantityStepper";
import SafeImage from "@/components/ui/SafeImage";
import { useAppDispatch } from "@/store";
import { setQuantity } from "@/store/slices/cartSlice";
import type { CartItem } from "@/types";
import { Trash2 } from "lucide-react";
import Link from "next/link";

interface CartItemRowProps {
  item: CartItem;
  animationDelay?: number;
  onClose: () => void;
  onRemove: (item: Pick<CartItem, "id" | "size" | "color" | "title">) => void;
}

/**
 * Single cart item row: image + name + size/color + price + QuantityStepper + remove icon.
 * Extracted from CartDrawer items.map(...) block.
 */
export function CartItemRow({ item, animationDelay = 0, onClose, onRemove }: CartItemRowProps) {
  const dispatch = useAppDispatch();

  return (
    <div
      className="flex gap-3 sm:gap-4 animate-in fade-in slide-in-from-right-2 duration-300"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <Link
        href={`/product/${item.slug || item.productId}`}
        onClick={onClose}
        className="w-20 h-24 rounded-md overflow-hidden shrink-0 bg-secondary"
      >
        <SafeImage src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/product/${item.slug || item.productId}`} onClick={onClose}>
          <h3 className="text-sm font-medium text-foreground truncate hover:text-accent transition-colors">
            {item.title}
          </h3>
        </Link>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {item.size} · {item.color}
        </p>
        <p className="text-sm font-semibold text-foreground mt-1">৳{item.price}</p>

        <div className="flex items-center justify-between mt-2">
          <QuantityStepper
            value={item.quantity}
            onChange={(newQty) =>
              dispatch(
                setQuantity({
                  id: item.id,
                  quantity: newQty,
                })
              )
            }
            min={1}
            size="sm"
          />
          <button
            type="button"
            onClick={() => onRemove({ id: item.id, size: item.size, color: item.color, title: item.title })}
            aria-label={`Remove ${item.title}`}
            className="text-muted-foreground hover:text-destructive transition-colors active:scale-90"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
