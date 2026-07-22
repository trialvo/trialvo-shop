import { z } from "zod";
import type { MarketplaceLanguage } from "@/types/marketplace";
import { emailField, msg, requiredString } from "@/lib/validation/common";

export function createContactSchema(language: MarketplaceLanguage) {
  return z.object({
    name: requiredString(language, { bn: "নাম", en: "Name" }, 2, 80),
    email: emailField(language),
    subject: requiredString(language, { bn: "বিষয়", en: "Subject" }, 3, 120),
    message: requiredString(
      language,
      { bn: "বার্তা", en: "Message" },
      10,
      2000,
    ).refine(
      (value) => value.trim().split(/\s+/).length >= 3,
      msg(
        {
          bn: "বার্তা আরও বিস্তারিত লিখুন",
          en: "Please write a more detailed message",
        },
        language,
      ),
    ),
  });
}

export type ContactSchemaValues = z.infer<
  ReturnType<typeof createContactSchema>
>;
