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
  discount_amount: number;
  shipping_address: { city?: string; area?: string; details?: string } | null;
  tracking_number: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    name: { bn: string; en: string };
    thumbnail: string;
    slug: string;
  } | null;
}

export interface TimelineEntry {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  comment: string | null;
  created_at: string;
}

export interface AdminNote {
  id: string;
  order_id: string;
  note: string;
  created_by: string;
  created_at: string;
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
        discount_amount: Number(row.discount_amount || 0),
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
    mutationFn: async ({
      id,
      status,
      comment,
    }: {
      id: string;
      status: string;
      comment?: string;
    }) => {
      return await api.put(`/admin/orders/${id}/status`, { status, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orderStats"] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Record<string, any>) => {
      return await api.put(`/admin/orders/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      status,
      comment,
    }: {
      ids: string[];
      status: string;
      comment?: string;
    }) => {
      return await api.post<{ message: string }>("/admin/orders/bulk-status", {
        ids,
        status,
        comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orderStats"] });
    },
  });
}

export function useOrderTimeline(orderId: string | null) {
  return useQuery({
    queryKey: ["admin", "orderTimeline", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      return await api.get<TimelineEntry[]>(
        `/admin/orders/${orderId}/timeline`,
      );
    },
    enabled: !!orderId,
  });
}

export function useOrderNotes(orderId: string | null) {
  return useQuery({
    queryKey: ["admin", "orderNotes", orderId],
    queryFn: async () => {
      if (!orderId) return [];
      return await api.get<AdminNote[]>(`/admin/orders/${orderId}/notes`);
    },
    enabled: !!orderId,
  });
}

export function useAddOrderNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      note,
    }: {
      orderId: string;
      note: string;
    }) => {
      return await api.post<AdminNote>(`/admin/orders/${orderId}/notes`, {
        note,
      });
    },
    onSuccess: (_data, { orderId }) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "orderNotes", orderId],
      });
    },
  });
}

export function useDeleteOrderNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ noteId }: { noteId: string }) => {
      return await api.delete(`/admin/orders/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orderNotes"] });
    },
  });
}

export function useExportOrders() {
  return useMutation({
    mutationFn: async (params: {
      status?: string;
      from?: string;
      to?: string;
    }) => {
      const queryStr = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v) as [string, string][],
      ).toString();
      const API_BASE =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/admin/orders/export?${queryStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
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
        cancelled: number;
        revenue: number;
        totalProducts: number;
        unreadMessages: number;
        weeklyOrders: number;
        weeklyRevenue: number;
        prevWeekOrders: number;
        prevWeekRevenue: number;
        monthlyData: { month: string; orders: number; revenue: number }[];
      }>("/admin/dashboard");
    },
  });
}
