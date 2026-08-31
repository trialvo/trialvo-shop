"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { openConfirmDelete } from "@/lib/modal/confirm-delete";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBuyNowId } from "@/redux/selectors/cartSelectors";
import { removeItem } from "@/redux/slices/cartSlice";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { Button } from "../ui/button";
import type { OrderItem } from "./order.types";
import OrderedItem from "./OrderItem";

type Props = {
  items: OrderItem[];
  className?: string;
};

const OrderItems: React.FC<Props> = ({ items, className }) => {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();

  const buyNowId = useAppSelector(selectBuyNowId);


  const hasPath = pathname?.startsWith('/checkout/success') || pathname?.startsWith('/checkout/failed')

  const handleDelete = (id: string) => {
    openConfirmDelete(
      dispatch,
      () => {
        dispatch(removeItem({ id }));
      },
      {
        title: "Are you sure you want delete this item?",
        description:
          "This action cannot be undone. If you change your mind, you will need to add a new item.",
        cancelText: "Not Now",
        confirmText: "Yes, Delete",
      },
    );
  };

  return (
    <div className={cn("pt-4", className)}>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
        {buyNowId === null
          ? hasPath
            ? `Ordered ${items?.length === 1 ? "item" : "items"}`
            : "Items in cart"
          : "Item for order"}
      </h3>

      {items?.length === 0 ? (
        <div className="my-10 flex flex-col items-center justify-center">
          <div className="relative h-15 w-15 shrink-0 overflow-hidden">
            <ImageWithFallback
              src={"/empty-cart.svg"}
              alt={"empty cart"}
              fill
              className="object-cover"
            />
          </div>
          <p className=" mt-2 text-center text-xs text-black">
            No items found!</p>
          <Button
            type="button"
            onClick={() => {
              router.push("/");
            }}
            className="mt-4 h-8 rounded-[4px] bg-black px-8 text-xs font-semibold text-white hover:bg-black/90"
          >
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="mt-1 max-h-none overflow-visible sm:max-h-70 sm:overflow-auto">
          {items?.map((item) => (
            <OrderedItem key={item.id} item={item} onRemove={() => handleDelete(item?.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderItems;
