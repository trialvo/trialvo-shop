import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Order {
  id: string;
  order_id: string;
  product_id: string | null;
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
  products?: {
    name: { bn: string; en: string };
    thumbnail: string;
    slug: string;
  } | null;
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(name, thumbnail, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ["admin", "orderStats"],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("status, total_bdt, created_at");
      if (error) throw error;

      const total = orders?.length || 0;
      const pending = orders?.filter((o) => o.status === "pending").length || 0;
      const confirmed =
        orders?.filter((o) => o.status === "confirmed").length || 0;
      const completed =
        orders?.filter((o) => o.status === "completed").length || 0;
      const revenue =
        orders?.reduce((sum, o) => sum + (o.total_bdt || 0), 0) || 0;

      return { total, pending, confirmed, completed, revenue };
    },
  });
}
