import type { CartItem } from "./cart";

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";
export type OrderType = "standard" | "guest" | "bulk" | "combo";

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  date: string;
  shippingAddress: string;
  billingAddress: string;
  orderType?: OrderType;
  guestEmail?: string;
}
