import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface CreateOrderInput {
  productId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company?: string;
  needsHosting: boolean;
  notes?: string;
  paymentMethod: string;
  totalBdt: number;
}

interface Order {
  id: string;
  order_id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company: string;
  needs_hosting: boolean;
  notes: string;
  payment_method: string;
  status: string;
  total_bdt: number;
  created_at: string;
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const data = await api.post<Order>("/orders", input);
      return data;
    },
  });
}

export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      try {
        return await api.get<Order>(`/orders/${orderId}`);
      } catch {
        return null;
      }
    },
    enabled: !!orderId,
  });
}
