import type { LucideIcon } from "lucide-react";
import type { Product } from "@/data/products";
import type { Category } from "@/hooks/useCategories";

/** Bilingual copy used across marketplace surfaces */
export type LocalizedString = {
  bn: string;
  en: string;
};

export type MarketplaceLanguage = keyof LocalizedString;

export type NavLinkItem = {
  href: string;
  label: string;
};

export type FooterLinkGroup = {
  id: string;
  title: LocalizedString;
  links: NavLinkItem[];
};

export type HeroContent = {
  brand: LocalizedString;
  headline: LocalizedString;
  supporting: LocalizedString;
  primaryCta: LocalizedString;
  secondaryCta: LocalizedString;
  image: {
    src: string;
    alt: LocalizedString;
  };
};

export type TrustItem = {
  id: string;
  icon: LucideIcon;
  title: LocalizedString;
  description: LocalizedString;
};

export type HowItWorksStep = {
  id: string;
  step: number;
  icon: LucideIcon;
  title: LocalizedString;
  description: LocalizedString;
};

export type ProductCardProps = {
  product: Product;
  /** Compact density for dense catalog grids */
  density?: "comfortable" | "compact";
};

export type ProductGridProps = {
  products: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
};

export type CategoryBrowseItem = Pick<
  Category,
  "id" | "slug" | "name" | "description" | "icon" | "product_count"
>;

export type DigitalGoodsTag = {
  id: string;
  label: LocalizedString;
};

/** API row shape before mapping into Product — keeps parsers type-safe */
export type ProductApiRow = {
  id: string;
  slug: string;
  category: string;
  price_bdt: number | string;
  price_usd: number | string;
  discount_percent?: number | string | null;
  thumbnail: string;
  images: Product["images"] | string;
  video_url?: string | null;
  demo: Product["demo"] | string;
  name: Product["name"] | string;
  short_description: Product["shortDescription"] | string;
  features: Product["features"] | string;
  facilities: Product["facilities"] | string;
  faq: Product["faq"] | string;
  seo: Product["seo"] | string;
  is_featured: boolean | number;
  is_active: boolean | number;
  is_trialable?: boolean | number;
  sort_order?: number | string | null;
  deploy_config?: Record<string, unknown> | string | null;
  created_at: string;
};
