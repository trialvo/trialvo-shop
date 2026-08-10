import { useQuery } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

export interface FaqListResponse {
  success: boolean;
  faqs: FaqItem[];
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useFAQs() {
  return useQuery<FaqListResponse>({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data } = await apiClient.get("/faqs");
      return data;
    },
    staleTime: 10 * 60_000, // FAQs rarely change
  });
}
