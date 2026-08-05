import { z } from "zod";
import { emailSchema } from "@/lib/auth-schemas";
import { optionalPhoneSchema } from "@/lib/phone/schema";

export type PasswordChangeFormValues = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type PasswordChangeFieldErrors = Partial<
  Record<keyof PasswordChangeFormValues, string>
>;

/**
 * Field-level password change validation for Settings.
 */
export function getPasswordChangeFieldErrors(
  values: PasswordChangeFormValues,
): PasswordChangeFieldErrors {
  const errors: PasswordChangeFieldErrors = {};
  const oldPassword = values.oldPassword;
  const next = values.newPassword;
  const confirm = values.confirmPassword;

  if (!oldPassword.trim()) {
    errors.oldPassword = "Enter your current password.";
  }

  if (next.length < 8 || next.length > 20) {
    errors.newPassword = "Password must be 8–20 characters.";
  } else if (oldPassword && next === oldPassword) {
    errors.newPassword = "New password must be different from the current one.";
  }

  if (confirm !== next) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

/** Settings → profile details (react-hook-form + zod). */
export const profileSettingsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters.")
    .max(80, "First name is too long."),
  lastName: z
    .string()
    .trim()
    .max(80, "Last name is too long.")
    .optional()
    .or(z.literal("")),
  email: emailSchema,
  phone: optionalPhoneSchema,
});

export type ProfileSettingsFormValues = z.infer<typeof profileSettingsSchema>;
