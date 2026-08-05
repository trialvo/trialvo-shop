"use client";

import React from "react";
import type { DrawerEntryProps } from "../Types";
import CartDrawer from "./CartDrawer";

type CartDrawerPayload = {
  checkoutHref?: string;
};

const CartDrawerEntry: React.FC<DrawerEntryProps> = ({
  isTop,
  zIndex,
  payload,
  open,
  onOpenChange,
}) => {
  const _data = payload as CartDrawerPayload | undefined;

  return (
    <CartDrawer
      open={open}
      isTop={isTop}
      zIndex={60}
      onOpenChange={onOpenChange}
    />
  );
};

export default CartDrawerEntry;
