import { z } from "zod";
import type { MarketplaceLanguage } from "@/types/marketplace";
import {
  domainField,
  emailField,
  optionalString,
  phoneField,
  requiredString,
} from "@/lib/validation/common";

export function createTrialRequestSchema(
  language: MarketplaceLanguage,
  trialType: "hosted" | "self_hosted",
) {
  return z
    .object({
      name: requiredString(language, { bn: "নাম", en: "Name" }, 2, 80),
      email: emailField(language),
      phone: phoneField(language),
      company: optionalString(120),
      domain: z.string().trim().optional().or(z.literal("")),
      useCase: optionalString(500),
    })
    .superRefine((values, ctx) => {
      if (trialType !== "self_hosted") return;
      const parsed = domainField(language).safeParse(values.domain || "");
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          ctx.addIssue({
            ...issue,
            path: ["domain"],
          });
        });
      }
    });
}

export type TrialRequestSchemaValues = z.infer<
  ReturnType<typeof createTrialRequestSchema>
>;
