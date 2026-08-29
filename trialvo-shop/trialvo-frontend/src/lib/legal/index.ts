import type { Locale } from "@/lib/i18n";
import { ACCEPTABLE_USE_DOC } from "@/lib/legal/acceptableUse";
import { COOKIES_DOC } from "@/lib/legal/cookies";
import { DISCLAIMER_DOC } from "@/lib/legal/disclaimer";
import { LICENSE_DOC } from "@/lib/legal/license";
import { PRIVACY_DOC } from "@/lib/legal/privacy";
import { REFUND_DOC } from "@/lib/legal/refund";
import { SUPPORT_DOC } from "@/lib/legal/support";
import { TERMS_DOC } from "@/lib/legal/terms";
import {
  LEGAL_PATHS,
  type LegalDoc,
  type LegalDocKey,
  type LocalizedLegalDoc,
} from "@/lib/legal/types";

const DOCS: Record<LegalDocKey, LocalizedLegalDoc> = {
  terms: TERMS_DOC,
  privacy: PRIVACY_DOC,
  refund: REFUND_DOC,
  license: LICENSE_DOC,
  cookies: COOKIES_DOC,
  acceptableUse: ACCEPTABLE_USE_DOC,
  disclaimer: DISCLAIMER_DOC,
  support: SUPPORT_DOC,
};

/** Order used by the footer, the legal index list, and cross-links. */
export const LEGAL_ORDER: LegalDocKey[] = [
  "terms",
  "privacy",
  "refund",
  "license",
  "support",
  "cookies",
  "acceptableUse",
  "disclaimer",
];

export function legalDoc(key: LegalDocKey, locale: Locale): LegalDoc {
  return DOCS[key][locale];
}

export function legalPath(key: LegalDocKey): string {
  return LEGAL_PATHS[key];
}

/** Every legal doc as `{ key, path, title }` for nav lists and cross-link blocks. */
export function legalIndex(locale: Locale) {
  return LEGAL_ORDER.map((key) => ({
    key,
    path: LEGAL_PATHS[key],
    title: DOCS[key][locale].title,
    intro: DOCS[key][locale].intro,
  }));
}

export { LEGAL_PATHS };
export type { LegalDoc, LegalDocKey, LegalSection, LegalBlock } from "@/lib/legal/types";
