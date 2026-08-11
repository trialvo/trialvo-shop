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
  /** Card gallery — prefers API shop images (up to 4); falls back to thumbnail. */
  images: string[];
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

const CARD_GALLERY_LIMIT = 4;

/** Prefer shop gallery images; fill from thumbnail; keep unique; max 4. */
function pickCardImages(product: Product): string[] {
  const out: string[] = [];
  const push = (url?: string) => {
    const trimmed = url?.trim();
    if (!trimmed || out.includes(trimmed) || out.length >= CARD_GALLERY_LIMIT) return;
    out.push(trimmed);
  };

  const shop = product.images?.shop || [];
  for (const url of shop) push(url);
  push(product.thumbnail);
  return out;
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

  const features: ProductCardFeatureItem[] = source.map((label, index) => ({
    id: `api-feature-${index}`,
    label,
  }));

  return {
    href: `/products/${product.slug}`,
    title,
    description,
    categoryLabel: categoryLabel || product.category,
    thumbnail: product.thumbnail?.trim() || "",
    images: pickCardImages(product),
    priceBDT: Number(product.priceBDT) || 0,
    priceUSD: Number(product.priceUSD) || 0,
    isTrialable: Boolean(product.isTrialable),
    hasVideo: Boolean(product.videoUrl?.trim()),
    badges: getProductBadges(product),
    features,
  };
}

export type { ProductBadge };
