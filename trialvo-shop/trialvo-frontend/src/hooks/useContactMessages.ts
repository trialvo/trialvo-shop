import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ContactFormValues } from "@/types/contact";
import type { ContactSchemaValues } from "@/lib/validation";

/** Public contact form → POST /contact */
export function useCreateContactMessage() {
  return useMutation({
    mutationFn: async (input: ContactFormValues | ContactSchemaValues) => {
      return await api.post("/contact", input);
    },
  });
}
