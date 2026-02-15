import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TestimonialRow {
  id: string;
  name: { bn: string; en: string };
  role: { bn: string; en: string };
  content: { bn: string; en: string };
  rating: number;
  avatar: string;
  is_active: boolean;
  created_at: string;
}

function parseRow(row: any): TestimonialRow {
  return {
    ...row,
    name: typeof row.name === "string" ? JSON.parse(row.name) : row.name,
    role: typeof row.role === "string" ? JSON.parse(row.role) : row.role,
    content:
      typeof row.content === "string" ? JSON.parse(row.content) : row.content,
    is_active: Boolean(row.is_active),
  };
}

export function useAdminTestimonials() {
  return useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: async () => {
      const data = await api.get<any[]>("/admin/testimonials");
      return data.map(parseRow);
    },
  });
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (testimonial: Partial<TestimonialRow>) => {
      return await api.post("/admin/testimonials", testimonial);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });
}

export function useUpdateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<TestimonialRow>) => {
      return await api.put(`/admin/testimonials/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/admin/testimonials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });
}
