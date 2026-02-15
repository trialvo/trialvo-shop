import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

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
      const data = await api.get<any[]>("/admin/orders");
      return data.map((row: any) => ({
        ...row,
        needs_hosting: Boolean(row.needs_hosting),
        total_bdt: Number(row.total_bdt),
        products: row.products
          ? {
              name:
                typeof row.products.name === "string"
                  ? JSON.parse(row.products.name)
                  : row.products.name,
              thumbnail: row.products.thumbnail,
              slug: row.products.slug,
            }
          : null,
      })) as Order[];
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await api.put(`/admin/orders/${id}/status`, { status });
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
      return await api.get<{
        total: number;
        pending: number;
        confirmed: number;
        completed: number;
        revenue: number;
        totalProducts: number;
        unreadMessages: number;
      }>("/admin/dashboard");
    },
  });
}
