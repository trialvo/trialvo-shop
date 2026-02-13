import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

function generateOrderId(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const orderId = generateOrderId();

      const { data, error } = await supabase
        .from("orders")
        .insert({
          order_id: orderId,
          product_id: input.productId,
          customer_name: input.customerName,
          customer_email: input.customerEmail,
          customer_phone: input.customerPhone,
          company: input.company || "",
          needs_hosting: input.needsHosting,
          notes: input.notes || "",
          payment_method: input.paymentMethod,
          total_bdt: input.totalBdt,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data as Order;
    },
  });
}

export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_id", orderId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data as Order;
    },
    enabled: !!orderId,
  });
}
