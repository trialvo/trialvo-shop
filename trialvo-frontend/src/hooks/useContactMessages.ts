import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface CreateContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function useCreateContactMessage() {
  return useMutation({
    mutationFn: async (input: CreateContactMessageInput) => {
      return await api.post("/contact", input);
    },
  });
}
