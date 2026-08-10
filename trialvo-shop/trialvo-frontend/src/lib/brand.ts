/**
 * Public brand + site constants — single source for marketplace UI copy.
 */
export const BRAND = {
  name: "Trialvo",
  nameBn: "ট্রায়ালভো",
  tagline: {
    bn: "প্রফেশনাল ইকমার্স সলিউশন মার্কেটপ্লেস",
    en: "Premium ecommerce solutions marketplace",
  },
  blurb: {
    bn: "রেডিমেড শপ, অ্যাডমিন ও API—ট্রায়াল, হোস্টিং ও সোর্স কোড এক জায়গায়।",
    en: "Ready-made shop, admin, and API—trials, hosting, and source code in one place.",
  },
  siteUrl: "https://shop.trialvo.com",
  contactEmail: "hello@trialvo.com",
  contactPhone: "+880 1700-000000",
  contactPhoneHref: "tel:+8801700000000",
  address: {
    bn: "ঢাকা, বাংলাদেশ",
    en: "Dhaka, Bangladesh",
  },
  social: {
    facebook: "https://facebook.com/trialvo",
    youtube: "https://youtube.com/@trialvo",
    twitter: "@trialvo",
  },
} as const;

export function brandName(lang: "bn" | "en"): string {
  return lang === "bn" ? BRAND.nameBn : BRAND.name;
}
