import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface CreateContactMessageInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function useCreateContactMessage() {
  return useMutation({
    mutationFn: async (input: CreateContactMessageInput) => {
      const { data, error } = await supabase
        .from("contact_messages")
        .insert({
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  });
}
