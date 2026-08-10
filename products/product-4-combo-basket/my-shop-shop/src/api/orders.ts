import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderItemPayload {
  product_id: number;
  name: string;
  slug: string;
  price: number;
  original_price: number;
  image: string;
  qty: number;
}

export interface PlaceOrderPayload {
  order_mode: "single" | "combo" | "combo-bundle";
  items: OrderItemPayload[];
  shipping_address: {
    name: string;
    phone: string;
    city: string;
    address: string;
    whatsapp?: string;
  };
  payment_method: string;
  delivery_type?: string;
  coupon_code?: string;
  note?: string;
}

export interface PlaceOrderResponse {
  success: boolean;
  order: {
    id: number;
    order_number: string;
    total: number;
    status: string;
  };
}

export interface MyOrder {
  id: number;
  order_number: string;
  total: number;
  status: string;
  order_mode: string;
  created_at: string;
  items: Array<{
    product_id: number;
    name: string;
    slug?: string;
    image: string;
    qty: number;
    price: number;
    original_price?: number;
    item_type?: "product" | "combo";
    combo_items?: Array<{
      productId: number;
      name: string;
      qty: number;
      price: number;
      image?: string;
    }>;
  }>;
  subtotal?: number;
  discount_amount?: number;
  delivery_charge?: number;
  coupon_code?: string;
  coupon_discount?: number;
  shipping_name?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
}

export interface MyOrdersResponse {
  success: boolean;
  orders: MyOrder[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function usePlaceOrder() {
  return useMutation<PlaceOrderResponse, Error, PlaceOrderPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/orders", payload);
      return data;
    },
  });
}

export function useMyOrders() {
  return useQuery<MyOrdersResponse>({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data } = await apiClient.get("/orders/my");
      return data;
    },
    enabled:
      typeof window !== "undefined" && !!localStorage.getItem("shop_token"),
  });
}

export function useOrderDetail(orderId: number | null | undefined) {
  return useQuery<{ success: boolean; order: MyOrder }>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/my/${orderId}`);
      return data;
    },
    enabled: Boolean(orderId),
    staleTime: 30_000,
  });
}
