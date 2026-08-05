import { z } from "zod";

// ── Shared ────────────────────────────────────────────────────────────────

const requiredString = (label: string) =>
  z.string().min(1, `${label} is required`);

// ── Shipping Address ──────────────────────────────────────────────────────

export const shippingSchema = z.object({
  firstName: requiredString("First name"),
  lastName: requiredString("Last name"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: requiredString("Street address"),
  city: requiredString("City"),
  state: z.string().optional(),
  zip: z
    .string()
    .min(1, "ZIP / Postal code is required")
    .min(3, "Enter a valid postal code"),
  country: requiredString("Country"),
});

export type ShippingFormData = z.infer<typeof shippingSchema>;

// ── Billing Address ───────────────────────────────────────────────────────

export const billingSchema = z.object({
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingAddress: requiredString("Billing street address"),
  billingCity: requiredString("Billing city"),
  billingState: z.string().optional(),
  billingZip: z
    .string()
    .min(1, "Billing ZIP is required")
    .min(3, "Enter a valid postal code"),
  billingCountry: requiredString("Billing country"),
});

export type BillingFormData = z.infer<typeof billingSchema>;
