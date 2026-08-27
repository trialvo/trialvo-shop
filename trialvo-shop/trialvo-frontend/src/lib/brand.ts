/**
 * Shop brand (Trialvo Shop) + company credit (Trialvo).
 * Company landing: https://trialvo.com/
 */
export const BRAND = {
  name: "Trialvo Shop",
  nameBn: "Trialvo Shop",
  tagline: {
    bn: "প্রফেশনাল ইকমার্স সলিউশন মার্কেটপ্লেস",
    en: "Premium ecommerce solutions marketplace",
  },
  blurb: {
    bn: "রেডিমেড শপ ও অ্যাডমিন—কাস্টমাইজেশন, DevOps, মেইনটেন্যান্স, আর প্রয়োজনমতো যেকোনো সফটওয়্যার বিল্ড।",
    en: "Ready-made shop and admin—plus customization, DevOps, maintenance, and custom software built to your needs.",
  },
  /** Company behind the marketplace */
  company: {
    name: "Trialvo",
    nameBn: "ট্রায়ালভো",
    url: "https://trialvo.com",
  },
  siteUrl: "https://shop.trialvo.com",
  contactEmail: "trialvo3@gmail.com",
  contactPhone: "01629-615314",
  contactPhoneHref: "tel:+8801629615314",
  address: {
    bn: "জামগড়া, সাভার, ঢাকা, বাংলাদেশ",
    en: "Jamgora, Savar, Dhaka, Bangladesh",
  },
  social: {
    facebook: "https://facebook.com/trialvo",
    youtube: "https://youtube.com/@trialvo",
    twitter: "@trialvo",
    whatsapp: "https://wa.me/8801629615314",
  },
} as const;

export function brandName(_lang?: "bn" | "en"): string {
  return BRAND.name;
}

export function companyName(lang: "bn" | "en"): string {
  return lang === "bn" ? BRAND.company.nameBn : BRAND.company.name;
}
