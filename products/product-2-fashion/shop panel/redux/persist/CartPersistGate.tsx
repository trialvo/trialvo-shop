"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { hydrateCart } from "@/redux/slices/cartSlice";
import {
  loadCartFromStorage,
  saveCartToStorage,
} from "@/redux/storage/cartStorage";
import * as React from "react";

export default function CartPersistGate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dispatch = useAppDispatch();

  const items = useAppSelector((s) => s.cart.items);
  const discount = useAppSelector((s) => s.cart.discount);
  const appliedCoupon = useAppSelector(s => s.cart.appliedCoupon);
  const guestId = useAppSelector(s => s.cart.guestId);
  const buyNowId = useAppSelector(s => s.cart.buyNowId);
  const isCartOpen = useAppSelector(s => s.cart.isCartOpen);
  const hydrated = useAppSelector((s) => s.cart.hydrated);

  React.useEffect(() => {
    const persisted = loadCartFromStorage();
    dispatch(hydrateCart(persisted));
  }, [dispatch]);

  React.useEffect(() => {
    if (!hydrated) return;
    saveCartToStorage({ items, discount, appliedCoupon, guestId, buyNowId, isCartOpen });
  }, [hydrated, items, discount, appliedCoupon, guestId, buyNowId, isCartOpen]);

  return <>{children}</>;
}
