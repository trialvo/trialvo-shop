import { useMutation } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContactPayload {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSubmitContact() {
  return useMutation<ContactResponse, Error, ContactPayload>({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/contact", payload);
      return data;
    },
  });
}
