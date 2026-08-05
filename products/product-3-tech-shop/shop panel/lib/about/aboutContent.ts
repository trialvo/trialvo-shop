export type AboutStat = Readonly<{
  value: string;
  label: string;
}>;

export type AboutPillar = Readonly<{
  title: string;
  description: string;
  icon: "target" | "heart" | "award";
}>;

export type AboutPromise = Readonly<{
  title: string;
  detail: string;
}>;

export const ABOUT_PAGE = {
  eyebrow: "Since 2020",
  brand: "ShopLinkBD",
  headline: "Premium tech, delivered with trust.",
  summary:
    "Bangladesh's go-to shop for authentic accessories and smart gadgets — fair prices, fast delivery, and real after-sales support.",
  storyTitle: "Our story",
  storyParagraphs: [
    "ShopLinkBD started with a simple idea: premium, authentic tech should be easy to buy anywhere in Bangladesh — without inflated prices or shady sellers.",
    "Today we serve customers across all 64 districts with genuine products from authorized partners, official warranty coverage, and a support team that actually picks up.",
  ],
  stats: [
    { value: "50K+", label: "Happy customers" },
    { value: "5,000+", label: "Products listed" },
    { value: "64", label: "Districts covered" },
    { value: "4.8★", label: "Average rating" },
  ] as const satisfies readonly AboutStat[],
  pillars: [
    {
      icon: "target",
      title: "Mission",
      description:
        "Bring authentic tech accessories to every corner of Bangladesh — fast, fairly priced, and backed by warranty.",
    },
    {
      icon: "heart",
      title: "Values",
      description:
        "Authenticity first, clear communication, and customer satisfaction over short-term sales.",
    },
    {
      icon: "award",
      title: "Promise",
      description:
        "Official warranty on eligible products, easy returns when rules apply, and dedicated support when you need help.",
    },
  ] as const satisfies readonly AboutPillar[],
  promisesTitle: "What shopping with us feels like",
  promises: [
    {
      title: "100% authentic stock",
      detail: "Sourced through authorized distributors — no grey-market surprises.",
    },
    {
      title: "Nationwide delivery",
      detail: "From Dhaka to every district, with tracking and careful packaging.",
    },
    {
      title: "Clear warranty path",
      detail: "Manufacturer coverage where applicable, plus guidance if something goes wrong.",
    },
    {
      title: "Human support",
      detail: "Phone, WhatsApp, or contact form — we help with orders, returns, and product fit.",
    },
  ] as const satisfies readonly AboutPromise[],
  primaryCta: { label: "Shop now", href: "/shop" },
  secondaryCta: { label: "Contact us", href: "/contact" },
} as const;
