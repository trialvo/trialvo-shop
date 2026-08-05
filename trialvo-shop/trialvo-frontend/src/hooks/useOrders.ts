import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface CreateOrderInput {
  productId?: string;
  productName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company?: string;
  needsHosting?: boolean;
  notes?: string;
  paymentMethod: string;
  totalBdt?: number;
  trialInstanceId?: string;
  /** product = full buy; trial_extend = paid extend pack */
  orderKind?: "product" | "trial_extend";
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
  pay_url: string | null;
  bill_token: string | null;
  trialvo_pay_transaction_id: string | null;
  order_kind?: string;
  extend_days?: number | null;
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
