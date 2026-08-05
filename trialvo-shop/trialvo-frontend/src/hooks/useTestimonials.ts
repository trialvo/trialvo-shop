import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Testimonial {
  id: string;
  name: { bn: string; en: string };
  role: { bn: string; en: string };
  content: { bn: string; en: string };
  rating: number;
  avatar: string;
  is_active: boolean;
  created_at: string;
}

function parseTestimonial(row: any): Testimonial {
  return {
    ...row,
    name: typeof row.name === "string" ? JSON.parse(row.name) : row.name,
    role: typeof row.role === "string" ? JSON.parse(row.role) : row.role,
    content:
      typeof row.content === "string" ? JSON.parse(row.content) : row.content,
    is_active: Boolean(row.is_active),
  };
}

export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const data = await api.get<any[]>("/testimonials");
      return data.map(parseTestimonial);
    },
    staleTime: 1000 * 60 * 5,
  });
}
