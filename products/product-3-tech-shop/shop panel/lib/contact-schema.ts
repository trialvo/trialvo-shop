import { z } from "zod";
import { emailSchema } from "@/lib/auth-schemas";
import { optionalPhoneSchema } from "@/lib/phone/schema";

/**
 * Contact form validation.
 * Backend requires subject + message, and either email or phone.
 * We keep email required for support follow-up (stricter UX), phone optional.
 */
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name is too long."),
  phone: optionalPhoneSchema,
  email: emailSchema,
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required.")
    .min(3, "Subject must be at least 3 characters.")
    .max(120, "Subject is too long."),
  message: z
    .string()
    .trim()
    .min(1, "Message is required.")
    .min(10, "Message must be at least 10 characters.")
    .max(2000, "Message is too long."),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
