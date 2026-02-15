import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useAdminMessages() {
  return useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const data = await api.get<any[]>("/admin/messages");
      return data.map((row: any) => ({
        ...row,
        is_read: Boolean(row.is_read),
      })) as ContactMessage[];
    },
  });
}

export function useToggleMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      return await api.put(`/admin/messages/${id}/read`, { is_read });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "messages"] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/admin/messages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "messages"] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["admin", "unreadCount"],
    queryFn: async () => {
      const data = await api.get<{ count: number }>(
        "/admin/messages/unread-count",
      );
      return data.count;
    },
  });
}
