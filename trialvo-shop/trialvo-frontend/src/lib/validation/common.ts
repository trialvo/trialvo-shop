import { z } from "zod";
import type { MarketplaceLanguage } from "@/types/marketplace";

type Msg = { bn: string; en: string };

export function msg(copy: Msg, language: MarketplaceLanguage): string {
  return language === "bn" ? copy.bn : copy.en;
}

/** Shared field builders — keep messages bilingual and reusable */
export function requiredString(
  language: MarketplaceLanguage,
  label: Msg,
  min = 2,
  max = 120,
) {
  return z
    .string()
    .trim()
    .min(1, msg({ bn: `${label.bn} দিন`, en: `${label.en} is required` }, language))
    .min(
      min,
      msg(
        {
          bn: `${label.bn} কমপক্ষে ${min} অক্ষর হতে হবে`,
          en: `${label.en} must be at least ${min} characters`,
        },
        language,
      ),
    )
    .max(
      max,
      msg(
        {
          bn: `${label.bn} সর্বোচ্চ ${max} অক্ষর`,
          en: `${label.en} must be at most ${max} characters`,
        },
        language,
      ),
    );
}

export function emailField(language: MarketplaceLanguage) {
  return z
    .string()
    .trim()
    .min(1, msg({ bn: "ইমেইল দিন", en: "Email is required" }, language))
    .email(
      msg(
        { bn: "সঠিক ইমেইল ঠিকানা দিন", en: "Enter a valid email address" },
        language,
      ),
    );
}

export function phoneField(language: MarketplaceLanguage) {
  return z
    .string()
    .trim()
    .min(1, msg({ bn: "ফোন নম্বর দিন", en: "Phone is required" }, language))
    .refine(
      (value) => value.replace(/\D/g, "").length >= 7,
      msg(
        { bn: "সঠিক ফোন নম্বর দিন", en: "Enter a valid phone number" },
        language,
      ),
    );
}

export function optionalString(max = 200) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""));
}

export function domainField(language: MarketplaceLanguage) {
  return z
    .string()
    .trim()
    .min(1, msg({ bn: "ডোমেইন দিন", en: "Domain is required" }, language))
    .regex(
      /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i,
      msg(
        {
          bn: "সঠিক ডোমেইন দিন (যেমন myshop.com)",
          en: "Enter a valid domain (e.g. myshop.com)",
        },
        language,
      ),
    );
}
