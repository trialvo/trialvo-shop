"use client";

import ItemQuantity from "@/components/common/ItemQuantity";
import React from "react";
import CartItemActions from "./CartItemActions";
import CartItemDetails from "./CartItemDetails";
import CartItemImage from "./CartItemImage";
import type { CartItemData } from "./types";

type Props = {
  item: CartItemData;
  onIncrease?: () => void;
  onDecrease?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  isActive?: boolean;
};

const CartItem: React.FC<Props> = ({
  item,
  onIncrease,
  onDecrease,
  onEdit,
  onRemove,
  isActive,
}) => {
  const maxQty =
    typeof item.stock === "number" && Number.isFinite(item.stock)
      ? item.stock > 0
        ? Math.min(item.stock, 5)
        : 1
      : 5;
  return (
    <div className="border-b py-6">
      <div className="hidden items-start justify-between sm:flex">
        <div className="flex gap-4">
          <CartItemImage src={item.image} alt={item.title} isActive={isActive}/>
          <CartItemDetails
            title={item.title}
            price={item.price}
            originalPrice={item.originalPrice}
            size={item.size}
            color={item.color}
            freeDelivery={item.freeDelivery === true}
          />
        </div>

        <div className="flex flex-col items-end gap-6">
          <CartItemActions onEdit={onEdit} onRemove={onRemove} isActive={isActive}/>
          <ItemQuantity
            quantity={item.quantity}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            max={maxQty}
          />
        </div>
      </div>

      <div className="sm:hidden">
        <div className="flex items-start gap-3">
          <CartItemImage src={item.image} alt={item.title} isActive={isActive}/>
          <div className="min-w-0 flex-1">
            <CartItemDetails
              title={item.title}
              price={item.price}
              originalPrice={item.originalPrice}
              size={item.size}
              color={item.color}
              freeDelivery={item.freeDelivery === true}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <ItemQuantity
            quantity={item.quantity}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            max={maxQty}
          />
          <CartItemActions onEdit={onEdit} onRemove={onRemove} isActive={isActive}/>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
