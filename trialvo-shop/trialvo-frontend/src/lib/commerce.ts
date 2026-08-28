import type { Locale } from "@/lib/i18n";

/** Every shop product is a one-time lifetime license with lifetime support. */
export const LIFETIME = {
  bn: {
    license: "আজীবন লাইসেন্স",
    support: "আজীবন সাপোর্ট",
    updates: "আজীবন আপডেট",
    priceHint: "বিডিটি / আজীবন লাইসেন্স",
    paymentLine: "এককালীন পেমেন্ট • আজীবন সাপোর্ট ও আপডেট",
    trust: "একবার কিনুন। আজীবন সাপোর্ট, আপডেট ও সোর্স কোড।",
    ctaTrust: "✓ সম্পূর্ণ সোর্স কোড  •  ✓ আজীবন সাপোর্ট  •  ✓ আজীবন আপডেট",
    highlight: "আজীবন সাপোর্ট",
  },
  en: {
    license: "Lifetime license",
    support: "Lifetime support",
    updates: "Lifetime updates",
    priceHint: "BDT / LIFETIME LICENSE",
    paymentLine: "One-time payment • Lifetime support & updates",
    trust: "Buy once. Lifetime support, updates, and source code.",
    ctaTrust: "✓ Full source code  •  ✓ Lifetime support  •  ✓ Lifetime updates",
    highlight: "Lifetime support",
  },
} as const;

export function lifetimeCopy(locale: Locale) {
  return LIFETIME[locale];
}
