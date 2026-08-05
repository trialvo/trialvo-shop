import { z } from "zod";

// ── Profile ───────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[+\d\s\-().]{7,20}$/.test(v),
      "Enter a valid phone number"
    ),
  address: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// ── Password Change ───────────────────────────────────────────────────────

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (confirmPassword !== newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type PasswordFormData = z.infer<typeof passwordSchema>;

// ── Address ───────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  label: z.string().optional(),
  usage: z.enum(["shipping", "billing", "both"]),
  fullName: z.string().min(1, "Full name is required"),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[+\d\s\-().]{7,20}$/.test(v),
      "Enter a valid phone number"
    ),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  zip: z
    .string()
    .min(1, "ZIP / Postal code is required")
    .min(3, "Enter a valid postal code"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
