import type { Product } from "@/data/products";
import {
  getProductBadges,
  type ProductBadge,
} from "@/lib/digitalGoods";
import type { LocalizedString, MarketplaceLanguage } from "@/types/marketplace";

export type ProductCardFeatureItem = {
  id: string;
  label: string;
};

export type ProductCardViewModel = {
  href: string;
  title: string;
  description: string;
  categoryLabel: string;
  thumbnail: string;
  priceBDT: number;
  priceUSD: number;
  isTrialable: boolean;
  hasVideo: boolean;
  badges: ProductBadge[];
  features: ProductCardFeatureItem[];
};

function pickLocalized(
  value: LocalizedString | undefined,
  language: MarketplaceLanguage,
): string {
  if (!value) return "";
  return value[language]?.trim() || value.en?.trim() || value.bn?.trim() || "";
}

function pickLocalizedList(
  value: { bn?: string[]; en?: string[] } | undefined,
  language: MarketplaceLanguage,
): string[] {
  if (!value) return [];
  const primary = language === "bn" ? value.bn : value.en;
  const fallback = language === "bn" ? value.en : value.bn;
  const list = (primary?.length ? primary : fallback) || [];
  return list.map((item) => item.trim()).filter(Boolean);
}

/**
 * Maps API product + resolved category label into card view-model.
 * No invented ratings or fake feature copy.
 */
export function toProductCardViewModel(
  product: Product,
  language: MarketplaceLanguage,
  categoryLabel: string,
): ProductCardViewModel {
  const title = pickLocalized(product.name, language) || product.slug;
  const description = pickLocalized(product.shortDescription, language);

  // Prefer features; fall back to facilities — both come from API
  const featureLabels = pickLocalizedList(product.features, language);
  const facilityLabels = pickLocalizedList(product.facilities, language);
  const source = featureLabels.length > 0 ? featureLabels : facilityLabels;

  const features: ProductCardFeatureItem[] = source
    .slice(0, 3)
    .map((label, index) => ({
      id: `api-feature-${index}`,
      label,
    }));

  return {
    href: `/products/${product.slug}`,
    title,
    description,
    categoryLabel: categoryLabel || product.category,
    thumbnail: product.thumbnail?.trim() || "",
    priceBDT: Number(product.priceBDT) || 0,
    priceUSD: Number(product.priceUSD) || 0,
    isTrialable: Boolean(product.isTrialable),
    hasVideo: Boolean(product.videoUrl?.trim()),
    badges: getProductBadges(product),
    features,
  };
}

export type { ProductBadge };
