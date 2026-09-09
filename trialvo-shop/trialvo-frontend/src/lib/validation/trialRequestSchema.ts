import { z } from "zod";
import type { MarketplaceLanguage } from "@/types/marketplace";
import {
  domainField,
  emailField,
  msg,
  optionalString,
  phoneField,
  requiredString,
} from "@/lib/validation/common";

/**
 * Instant demo: the smallest form we can get away with. Three fields plus a
 * hidden honeypot (`website`) that must stay empty.
 */
export function createInstantDemoSchema(language: MarketplaceLanguage) {
  return z.object({
    name: requiredString(language, { bn: "নাম", en: "Name" }, 2, 80),
    email: emailField(language),
    phone: phoneField(language),
    // Honeypot is registered on the form but NOT validated here. Chrome
    // autofills hidden "website" fields with the user's email; a max(0)
    // rule then fails handleSubmit with no visible error.
    website: z.string().optional(),
  });
}
export type InstantDemoValues = z.infer<ReturnType<typeof createInstantDemoSchema>>;

/**
 * Own-domain trial wizard. Validated as a whole on submit, and per-step by
 * the wizard hook using the step field lists exported below.
 *
 * Rules mirror trialFulfillment.validateHostingGate on the backend:
 *   own  → hasHosting must be true, hostKind required, domain required
 *   buy  → domain optional (may not exist yet), hostKind decided by staff
 */
export function createDomainTrialSchema(
  language: MarketplaceLanguage,
  { allowedMonths, hostingPurchaseEnabled }: { allowedMonths: number[]; hostingPurchaseEnabled: boolean },
) {
  const hostingSourceValues = hostingPurchaseEnabled
    ? (["own", "buy_from_trialvo"] as const)
    : (["own"] as const);

  return z
    .object({
      hostingSource: z.enum(hostingSourceValues, {
        message: msg({ bn: "হোস্টিং আছে কি না বলুন", en: "Tell us whether you have hosting" }, language),
      }),
      hostKind: z.enum(["vps", "cpanel"]).optional(),
      hasHosting: z.boolean().optional(),
      months: z.number().int(),
      domain: z.string().trim().optional().or(z.literal("")),
      name: requiredString(language, { bn: "নাম", en: "Name" }, 2, 80),
      email: emailField(language),
      phone: phoneField(language),
      company: optionalString(120),
      notes: optionalString(500),
      website: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (!allowedMonths.includes(values.months)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["months"],
          message: msg({ bn: "মেয়াদ বেছে নিন", en: "Choose a duration" }, language),
        });
      }

      if (values.hostingSource === "own") {
        if (values.hasHosting !== true) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hasHosting"],
            message: msg(
              { bn: "ডোমেইন ও হোস্টিং রেডি আছে — এটা টিক দিন", en: "Please confirm your domain and hosting are ready" },
              language,
            ),
          });
        }
        if (!values.hostKind) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hostKind"],
            message: msg({ bn: "VPS বা cPanel বেছে নিন", en: "Select VPS or cPanel" }, language),
          });
        }
        const parsed = domainField(language).safeParse(values.domain || "");
        if (!parsed.success) {
          parsed.error.issues.forEach((issue) => ctx.addIssue({ ...issue, path: ["domain"] }));
        }
      } else if (values.domain) {
        // Buying hosting: domain is optional but must be valid when given.
        const parsed = domainField(language).safeParse(values.domain);
        if (!parsed.success) {
          parsed.error.issues.forEach((issue) => ctx.addIssue({ ...issue, path: ["domain"] }));
        }
      }
    });
}
export type DomainTrialValues = z.infer<ReturnType<typeof createDomainTrialSchema>>;

/** Which fields each wizard step owns — used to validate one step at a time. */
export const DOMAIN_TRIAL_STEP_FIELDS: Record<"hosting" | "duration" | "contact", (keyof DomainTrialValues)[]> = {
  hosting: ["hostingSource", "hostKind", "hasHosting"],
  duration: ["months", "domain"],
  contact: ["name", "email", "phone", "company", "notes"],
};