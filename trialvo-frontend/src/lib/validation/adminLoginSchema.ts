import { z } from "zod";
import { emailField, requiredString } from "@/lib/validation/common";

/** Admin login is English-first in UI; keep schema messages in English */
export const adminLoginSchema = z.object({
  email: emailField("en"),
  password: requiredString("en", { bn: "পাসওয়ার্ড", en: "Password" }, 6, 128),
});

export type AdminLoginSchemaValues = z.infer<typeof adminLoginSchema>;
