export type LocalizedText = { bn: string; en: string };
export type LocalizedList = { bn: string[]; en: string[] };

export type ProductFaqItem = {
  question: LocalizedText;
  answer: LocalizedText;
};

export type ProductSeo = {
  title: LocalizedText;
  description: LocalizedText;
  keywords: LocalizedList;
};

export type ProductImages = {
  admin: string[];
  shop: string[];
};

/**
 * Legacy static demo credentials. Public shop and trials now use
 * `deployConfig`, so this stays for stored rows only.
 */
export type ProductDemoEntry = {
  label?: string;
  url?: string;
  username?: string;
  password?: string;
};

/** Client-side product shape, mapped from `ProductApiRow`. */
export type Product = {
  id: string;
  slug: string;
  category: string;
  priceBDT: number;
  priceUSD: number;
  discountPercent: number;
  thumbnail: string;
  images: ProductImages;
  videoUrl?: string;
  demo: ProductDemoEntry[];
  name: LocalizedText;
  shortDescription: LocalizedText;
  features: LocalizedList;
  facilities: LocalizedList;
  faq: ProductFaqItem[];
  seo: ProductSeo;
  isFeatured: boolean;
  isActive: boolean;
  isTrialable: boolean;
  sortOrder?: number;
  deployConfig: Record<string, unknown> | null;
  createdAt: string;
};
