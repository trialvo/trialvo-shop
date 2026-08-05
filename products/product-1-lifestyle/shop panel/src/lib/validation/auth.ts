import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address.");

export const bdMobileSchema = z
  .string()
  .trim()
  .regex(/^(\+?88)?01[3-9]\d{8}$/, "Please enter a valid mobile number.");

export const emailOrMobileSchema = z
  .string()
  .trim()
  .min(1, "Email or mobile number is required.")
  .refine(
    (value) =>
      emailSchema.safeParse(value).success ||
      bdMobileSchema.safeParse(value).success,
    {
      message: "Enter a valid email or mobile number.",
    },
  );

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters.")
  .max(64, "Password must be at most 64 characters.");

export const signInSchema = z.object({
  email: emailOrMobileSchema,
  password: passwordSchema,
  ip: z.string().optional(),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(50, "First name must be at most 50 characters."),
  last_name: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters.")
    .max(50, "Last name must be at most 50 characters."),
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
    .regex(/^\d+$/, "Code must contain only numbers.")
    .length(6, "Enter the 6-digit code."),
});

export type VerifyIdentityValues = z.infer<typeof verifyIdentitySchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

// Backward-compatible aliases for older imports.
export const loginSchema = signInSchema;
export type LoginFormData = SignInValues;

export const signupSchema = signUpSchema;
export type SignupFormData = SignUpValues;
