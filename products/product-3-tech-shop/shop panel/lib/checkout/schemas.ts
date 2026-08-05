import { z } from "zod";
import { emailSchema } from "@/lib/auth-schemas";
import { phoneSchema } from "@/lib/phone/schema";

export const checkoutFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name is too long."),
  /** E.164 (+880…). Convert with toApiPhoneNumber before API calls. */
  phone: phoneSchema,
  email: z.string().trim().toLowerCase().max(254),
  address: z
    .string()
    .trim()
    .min(1, "Address is required.")
    .min(10, "Address must be at least 10 characters.")
    .max(500, "Address is too long."),
  city: z.string().trim().min(1, "City / district is required.").max(100),
  division: z.string().trim().min(1, "Division is required."),
  zipCode: z.string().trim().max(20).optional().or(z.literal("")),
  /** Existing saved address id for authenticated users — empty = create new */
  addressId: z.string().optional().or(z.literal("")),
  orderNotes: z.string().trim().max(500),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  deliveryChargeId: z
    .string()
    .min(1, "Please select a delivery option.")
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, {
      message: "Please select a delivery option.",
    }),
  paymentProvider: z.string().trim().min(1, "Please select a payment method."),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export type GuestCheckoutPermissions = {
  email_required: boolean;
  phone_verification_required: boolean;
};

export function createCheckoutFormSchema(
  permissions?: GuestCheckoutPermissions,
) {
  return checkoutFormSchema.superRefine((data, ctx) => {
    if (!permissions?.email_required) return;
    const email = (data.email ?? "").trim();
    if (!email) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Email is required for guest checkout.",
      });
      return;
    }
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message:
          parsed.error.issues[0]?.message ??
          "Please enter a valid email address.",
      });
    }
  });
}

export const guestPhoneOtpSchema = z.object({
  code: z
    .string()
    .min(1, "Verification code is required.")
    .regex(/^\d+$/, "Code must contain only numbers.")
    .length(6, "Enter the 6-digit code."),
});

export type GuestPhoneOtpValues = z.infer<typeof guestPhoneOtpSchema>;
