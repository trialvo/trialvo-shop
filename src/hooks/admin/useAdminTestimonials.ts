import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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

export function useAdminTestimonials() {
  return useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TestimonialRow[];
    },
  });
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (testimonial: Partial<TestimonialRow>) => {
      const { data, error } = await supabase
        .from("testimonials")
        .insert(testimonial)
        .select()
        .single();
      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from("testimonials")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
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
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });
}
