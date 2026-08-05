"use client";

import { emailSchema } from "@/lib/auth-schemas";
import { subscriberService } from "@/lib/api/subscriber/service";
import AuthCookies from "@/lib/auth/cookies";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

const subscribeFormSchema = z.object({
  email: emailSchema,
});

export type SubscribeFormValues = z.infer<typeof subscribeFormSchema>;

export const useSubscribe = () => {
  const mutation = useMutation({
    mutationFn: async (values: SubscribeFormValues) => {
      const parsed = subscribeFormSchema.safeParse({
        email: values.email.trim(),
      });

      if (!parsed.success) {
        throw new Error(
          parsed.error.issues[0]?.message ?? "Invalid email address.",
        );
      }

      // Only attach user_id when authenticated — never invent IDs client-side
      const user = AuthCookies.getUser<{ id?: number; email?: string }>();
      const userId =
        user &&
        typeof user.id === "number" &&
        user.email?.toLowerCase() === parsed.data.email.toLowerCase()
          ? user.id
          : undefined;

      return subscriberService.subscribe({
        email: parsed.data.email,
        user_id: userId,
      });
    },
  });

  return {
    subscribe: mutation.mutateAsync,
    isSubscribing: mutation.isPending,
    subscribeError: mutation.error,
    subscribeReset: mutation.reset,
  };
};
