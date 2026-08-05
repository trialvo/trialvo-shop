"use client";

import OrderSummary from "@/components/order-summary/OrderSummary";
import type { OrderItem } from "@/components/order-summary/order.types";
import React from "react";

type Props = {
  items: OrderItem[];
};

const CheckoutRight: React.FC<Props> = ({ items }) => {
  return (
      <OrderSummary items={items} />
  );
};

export default CheckoutRight;
