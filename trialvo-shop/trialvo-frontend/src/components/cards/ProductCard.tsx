"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { resolveCategoryLabel } from "@/lib/digitalGoods";
import {
  ProductCardFeatures,
  ProductCardMedia,
  ProductCardPricing,
} from "@/components/cards/product";
import { toProductCardViewModel } from "@/types/productCard";
import type { ProductCardProps } from "@/types/marketplace";
import { cn } from "@/lib/utils";

/**
 * Clean marketplace card: image, title, a few chips, price.
 * Overlay badges limited to featured / live trial.
 */
export function ProductCard({
  product,
  density = "comfortable",
}: Readonly<ProductCardProps>) {
  const { language, t } = useLanguage();
  const { data: categories } = useCategories();

  const categoryLabel = resolveCategoryLabel(
    product.category,
    language,
    categories,
  );
  const card = toProductCardViewModel(product, language, categoryLabel);
  const compact = density === "compact";
  const overlayBadges = card.badges.filter(
    (badge) => badge.id === "featured" || badge.id === "trial",
  );

  const priceHint = language === "bn" ? "আজীবন লাইসেন্স" : "Lifetime license";
  const ctaLabel = card.isTrialable
    ? language === "bn"
      ? "ট্রায়াল"
      : "Trial"
    : language === "bn"
      ? "বিস্তারিত"
      : "Details";

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card",
        "transition-shadow duration-300 hover:shadow-[0_12px_40px_-20px_rgba(15,23,42,0.28)]",
      )}
      itemScope
      itemType="https://schema.org/Product"
    >
      <LocalizedLink
        href={card.href}
        className="flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={card.title}
      >
        <ProductCardMedia
          images={card.images}
          imageAlt={card.title}
          badges={overlayBadges}
          language={language}
          showPlay={card.hasVideo}
        />

        <div
          className={cn(
            "flex flex-1 flex-col",
            compact ? "gap-2.5 p-4" : "gap-3 p-5",
          )}
        >
          {card.categoryLabel ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {card.categoryLabel}
            </p>
          ) : null}

          <h3
            className="text-lg font-semibold leading-snug tracking-tight text-foreground"
            itemProp="name"
          >
            {card.title}
          </h3>

          {card.description ? (
            <p
              className="line-clamp-2 text-sm leading-relaxed text-muted-foreground"
              itemProp="description"
            >
              {card.description}
            </p>
          ) : null}

          <ProductCardFeatures features={card.features} />

          <div
            className="mt-auto"
            itemProp="offers"
            itemScope
            itemType="https://schema.org/Offer"
          >
            <ProductCardPricing
              amountBdt={card.priceBDT}
              amountUsd={card.priceUSD}
              discountPercent={card.discountPercent}
              currencyLabel={t("common.bdt")}
              language={language}
              priceHint={priceHint}
              ctaLabel={ctaLabel}
            />
          </div>
        </div>
      </LocalizedLink>
    </article>
  );
}

export default ProductCard;
