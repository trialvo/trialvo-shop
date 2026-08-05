"use client";

import { useAppSelector } from "@/redux/hooks";
import * as React from "react";

type CartItem = {
  productId: string;
  size?: string | null;
  color?: string | null;
  quantity: number;
};

type Params = {
  productId: string;
  size: string;
  color: string;
  stock: number;
  defaultQty?: number;
};

type Result = {
  qty: number;
  setQty: React.Dispatch<React.SetStateAction<number>>;

  isInCart: boolean;
  cartItem?: CartItem;
  cartQty: number;
};

function norm(v: string): string {
  return v.trim().toLowerCase();
}

function clampQty(q: number, stock: number): number {
  const min = 1;
  const max = stock > 0 ? Math.min(stock, 5) : 1;
  return Math.min(Math.max(min, q), max);
}

export const useCartItemSync = ({
  productId,
  size,
  color,
  stock,
  defaultQty = 1,
}: Params): Result => {
  const items = useAppSelector((s) => s.cart.items) as CartItem[];

  const cartItem = React.useMemo(() => {
    const pid = norm(String(productId));
    const sName = norm(size);
    const cName = norm(color);

    if (!pid || !sName || !cName) return undefined;

    return items.find(
      (it) =>
        norm(String(it.productId)) === pid &&
        norm(String(it.size ?? "")) === sName &&
        norm(String(it.color ?? "")) === cName,
    );
  }, [items, productId, size, color]);

  const isInCart = Boolean(cartItem);
  const cartQty = cartItem?.quantity ?? 0;

  const [qty, setQty] = React.useState<number>(() => clampQty(defaultQty, stock));

  React.useEffect(() => {
    if (isInCart) {
      setQty(clampQty(cartQty > 0 ? cartQty : 1, stock));
      return;
    }
    setQty(clampQty(defaultQty, stock));
  }, [isInCart, cartQty, stock, defaultQty, productId, size, color]);

  React.useEffect(() => {
    setQty((p) => clampQty(p, stock));
  }, [stock]);

  return { qty, setQty, isInCart, cartItem, cartQty };
};
