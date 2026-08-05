/**
 * lib/validation/single-order.ts — Zod validation schemas for SOP checkout form
 */

import { z } from "zod";

/** BD mobile number: must start with 01 and be exactly 11 digits */
const bdPhoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^01\d{9}$/, "Enter a valid BD mobile number (01XXXXXXXXX)");

const emailSchema = z
  .string()
  .email("Enter a valid email address")
  .or(z.literal(""));

export const sopCheckoutFormSchema = z.object({
  addressType: z.enum(["home", "office", "na"]),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  phone: bdPhoneSchema,
  email: emailSchema,
  address: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address is too long"),
  city: z.string().min(1, "City is required"),
  areaName: z.string(),
  locationMappingId: z.number().positive("Please select a delivery area").nullable(),
  note: z.string().max(500, "Note is too long").optional().default(""),
  paymentProvider: z.string().min(1, "Please select a payment method"),
  deliveryChargeId: z.string().min(1, "Please select a delivery option"),
});

export type SOPCheckoutFormInput = z.input<typeof sopCheckoutFormSchema>;
export type SOPCheckoutFormOutput = z.output<typeof sopCheckoutFormSchema>;

/**
 * Validate a single field and return the error message or null.
 * Useful for inline field-level validation.
 */
export function validateSOPField(
  field: keyof SOPCheckoutFormInput,
  value: unknown,
): string | null {
  const fieldSchema = sopCheckoutFormSchema.shape[field];
  const result = fieldSchema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message ?? null;
}
