import type { Product } from "@/types/product";
import type { LocalizedString, MarketplaceLanguage } from "@/types/marketplace";

export type GigCardMediaProps = {
  imageSrc: string;
  imageAlt: string;
  showTrialBadge?: boolean;
  trialLabel: string;
};

export type GigCardSellerProps = {
  name: string;
  subtitle?: string;
  avatarLetter: string;
};

export type GigCardPriceProps = {
  amount: number;
  currencyLabel: string;
  language: MarketplaceLanguage;
  fromLabel: string;
};

export type GigCardViewModel = {
  href: string;
  title: string;
  categoryLabel: string;
  avatarLetter: string;
  priceBDT: number;
  isTrialable: boolean;
  thumbnail: string;
};

export function toGigCardViewModel(
  product: Product,
  language: MarketplaceLanguage,
  categoryLabels: Record<string, LocalizedString>,
): GigCardViewModel {
  const categoryLabel =
    categoryLabels[product.category]?.[language] ||
    categoryLabels[product.category]?.en ||
    product.category;

  const title =
    product.name[language]?.trim() ||
    product.name.en?.trim() ||
    product.name.bn?.trim() ||
    product.slug;

  return {
    href: `/products/${product.slug}`,
    title,
    categoryLabel,
    avatarLetter: categoryLabel.charAt(0).toUpperCase(),
    priceBDT: product.priceBDT,
    isTrialable: Boolean(product.isTrialable),
    thumbnail: product.thumbnail,
  };
}
