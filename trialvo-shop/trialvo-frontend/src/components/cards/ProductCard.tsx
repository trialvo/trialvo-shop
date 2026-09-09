"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { resolveCategoryLabel } from "@/lib/digitalGoods";
import {
  ProductCardActions,
  ProductCardFeatures,
  ProductCardMedia,
  ProductCardPricing,
} from "@/components/cards/product";
import { useTrialLaunch } from "@/components/trial/TrialLaunchProvider";
import { productSupportsDemo } from "@/lib/trial/types";
import { toProductCardViewModel } from "@/types/productCard";
import type { ProductCardProps } from "@/types/marketplace";
import { cn } from "@/lib/utils";

/**
 * Marketplace card: media, copy, price, and real trial / details actions.
 */
export function ProductCard({
  product,
  density = "comfortable",
}: Readonly<ProductCardProps>) {
  const { language, t } = useLanguage();
  const { data: categories } = useCategories();
  // One shared dialog host for the whole page — a grid of 20 cards must not
  // mount 20 modals.
  const trial = useTrialLaunch();

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
  const canRequestTrial = Boolean(
    card.isTrialable && trial.demoAvailable && productSupportsDemo(product),
  );
  const priceHint = language === "bn" ? "আজীবন লাইসেন্স" : "Lifetime license";

  return (
    <article
      className={cn(
        // Shares the site-wide elevation tokens so the lift reads correctly in
        // dark mode too, where a hardcoded rgba shadow would disappear.
        "surface surface-sheen surface-interactive",
        "group flex h-full flex-col overflow-hidden rounded-[1.35rem]",
      )}
      itemScope
      itemType="https://schema.org/Product"
    >
      <LocalizedLink
        href={card.href}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={card.title}
      >
        <ProductCardMedia
          images={card.images}
          imageAlt={card.title}
          badges={overlayBadges}
          language={language}
          showPlay={card.hasVideo}
        />
      </LocalizedLink>

      <div
        className={cn(
          "flex flex-1 flex-col",
          compact ? "gap-2.5 px-4 pb-4 pt-3.5" : "gap-3 px-5 pb-5 pt-4",
        )}
      >
        <LocalizedLink
          href={card.href}
          className="flex flex-1 flex-col gap-2.5 outline-none"
        >
          {card.categoryLabel ? (
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px]">
              {card.categoryLabel}
            </p>
          ) : null}

          <h3
            className="font-display text-[1.15rem] font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-accent"
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
        </LocalizedLink>

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
          />
          <ProductCardActions
            href={card.href}
            language={language}
            showTrial={canRequestTrial}
            compact={compact}
            onStartTrial={() => trial.openDemo({ product })}
          />
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
