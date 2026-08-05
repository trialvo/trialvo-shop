import type {
  OrderItem,
  OrderListItem
} from "@/lib/api/order/service";

export type MyOrderItem = OrderListItem;

export type OrderTabKey = "all" | "to-pay" | "completed" | "canceled";

export type OrderStatus = 
  | 'new'
  | 'approved'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'trash';

export type PaymentStatus = 'paid' | 'unpaid';

export type OrderTableItem = {
  id: number;
  orderNumber: string;
  date: string;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  itemsCount: number;
  items: OrderItem[];
};