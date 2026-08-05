import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .toLowerCase()
  .email("Please enter a valid email address.")
  .max(254);

export const bdMobileSchema = z
  .string()
  .trim()
  .regex(/^(\+?88)?01[3-9]\d{8}$/, "Please enter a valid mobile number.");

const emailOrMobileSchema = z
  .string()
  .trim()
  .min(1, "Email or mobile number is required.")
  .refine(
    (val) =>
      emailSchema.safeParse(val).success || bdMobileSchema.safeParse(val).success,
    { message: "Enter a valid email or mobile number." },
  );

/** Matches backend validateLogin / reset rules (8–20 chars) */
const passwordSchema = z
  .string()
  .min(1, "Password is required.")
  .min(8, "Password must be at least 8 characters.")
  .max(20, "Password must be at most 20 characters.");

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  ip: z.string().optional(),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .min(2, "First name must be at least 2 characters.")
    .max(50, "First name is too long."),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .min(2, "Last name must be at least 2 characters.")
    .max(50, "Last name is too long."),
  email: emailSchema,
  password: passwordSchema,
  ip: z.string().optional(),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({
  emailOrMobile: emailOrMobileSchema,
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const verifyIdentitySchema = z.object({
  code: z
    .string()
    .min(1, "Verification code is required.")
    .regex(/^\d+$/, "Code must contain only numbers.")
    .length(6, "Enter the 6-digit code."),
});

export type VerifyIdentityValues = z.infer<typeof verifyIdentitySchema>;

/** Email verification screen — email + OTP */
export const verifyEmailFormSchema = z.object({
  email: emailSchema,
  code: verifyIdentitySchema.shape.code,
});

export type VerifyEmailFormValues = z.infer<typeof verifyEmailFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;

/** @deprecated Use resetPasswordFormSchema */
export const resetPasswordSchema = resetPasswordFormSchema;
/** @deprecated Use ResetPasswordFormValues */
export type ResetPasswordValues = ResetPasswordFormValues;
