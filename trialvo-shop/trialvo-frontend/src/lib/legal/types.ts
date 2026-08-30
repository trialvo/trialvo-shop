import type { Locale } from "@/lib/i18n";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "note"; text: string };

export type LegalSection = {
  /** Stable anchor id — used by the in-page table of contents. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDoc = {
  title: string;
  /** Lead paragraph rendered above the table of contents. */
  intro: string;
  updated: string;
  sections: LegalSection[];
};

export type LegalDocKey =
  | "terms"
  | "privacy"
  | "refund"
  | "license"
  | "cookies"
  | "acceptableUse"
  | "disclaimer"
  | "support";

export type LocalizedLegalDoc = Record<Locale, LegalDoc>;

/** Route path for each legal document, shared by nav, sitemap, and pages. */
export const LEGAL_PATHS: Record<LegalDocKey, string> = {
  terms: "/terms",
  privacy: "/privacy",
  refund: "/refund-policy",
  license: "/license",
  cookies: "/cookie-policy",
  acceptableUse: "/acceptable-use",
  disclaimer: "/disclaimer",
  support: "/support-policy",
};

export const LEGAL_UPDATED = {
  bn: "সর্বশেষ আপডেট: ২৯ আগস্ট ২০২৬",
  en: "Last updated: 29 August 2026",
} as const;

/** Machine-readable form of LEGAL_UPDATED, for schema `dateModified`. */
export const LEGAL_MODIFIED_ISO = "2026-08-29";
