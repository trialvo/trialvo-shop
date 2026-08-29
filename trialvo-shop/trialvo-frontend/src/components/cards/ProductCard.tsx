"use client";

import { useState } from "react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { usePublicTrialConfig } from "@/hooks/useTrialSettings";
import { resolveCategoryLabel } from "@/lib/digitalGoods";
import {
  ProductCardActions,
  ProductCardFeatures,
  ProductCardMedia,
  ProductCardPricing,
} from "@/components/cards/product";
import RequestTrialModal from "@/components/trial/RequestTrialModal";
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
  const { data: trialConfig } = usePublicTrialConfig();
  const [trialOpen, setTrialOpen] = useState(false);

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
    card.isTrialable && trialConfig?.trialsEnabled !== false,
  );
  const priceHint = language === "bn" ? "আজীবন লাইসেন্স" : "Lifetime license";

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-border/70 bg-card",
        "shadow-[0_1px_0_rgba(15,23,42,0.04)]",
        "transition-[transform,box-shadow,border-color] duration-300",
        "hover:-translate-y-1 hover:border-border hover:shadow-[0_22px_50px_-24px_rgba(15,23,42,0.38)]",
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
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
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
            onStartTrial={() => setTrialOpen(true)}
          />
        </div>
      </div>

      {canRequestTrial ? (
        <RequestTrialModal
          open={trialOpen}
          onOpenChange={setTrialOpen}
          productSlug={product.slug}
          productName={product.name[language] || product.name.en}
          supportsOption1={product.deployConfig?.supports_option1 !== false}
          supportsOption2={product.deployConfig?.supports_option2 !== false}
        />
      ) : null}
    </article>
  );
}

export default ProductCard;
