import { z } from "zod";
import { isValidPhoneE164 } from "@/lib/phone/parse";

/**
 * Required international phone (E.164 or parseable national).
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .refine((value) => isValidPhoneE164(value), {
    message: "Enter a valid phone number for the selected country.",
  });

/**
 * Optional phone — empty string allowed; otherwise must be valid.
 */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || isValidPhoneE164(value), {
    message: "Enter a valid phone number for the selected country.",
  });

export type PhoneSchema = z.infer<typeof phoneSchema>;

/** 6-digit SMS OTP used for phone verification. */
export const phoneOtpSchema = z.object({
  code: z
    .string()
    .min(1, "Verification code is required.")
    .regex(/^\d+$/, "Code must contain only numbers.")
    .length(6, "Enter the 6-digit code."),
});

export type PhoneOtpValues = z.infer<typeof phoneOtpSchema>;
