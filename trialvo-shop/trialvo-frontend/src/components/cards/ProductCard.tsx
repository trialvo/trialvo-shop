"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { resolveCategoryLabel } from "@/lib/digitalGoods";
import {
  ProductCardFeatures,
  ProductCardMedia,
  ProductCardPricing,
} from "@/components/cards/product";
import { DynamicBadge } from "@/components/ui/DynamicBadge";
import { toProductCardViewModel } from "@/types/productCard";
import type { ProductCardProps } from "@/types/marketplace";
import { cn } from "@/lib/utils";

/**
 * API-driven product card:
 * real thumbnail, all applicable badges, category from /categories,
 * features/facilities from product payload, live prices.
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

  const priceHint = language === "bn" ? "বিডিটি / এককালীন" : "BDT / ONE-TIME";
  const ctaLabel = card.isTrialable
    ? language === "bn"
      ? "ট্রায়াল শুরু"
      : "Start trial"
    : language === "bn"
      ? "বিস্তারিত দেখুন"
      : "View details";
  const trustLabel = card.isTrialable
    ? language === "bn"
      ? "সিকিউর চেকআউট। লাইভ ট্রায়াল উপলব্ধ।"
      : "Secure checkout. Live trial available."
    : language === "bn"
      ? "সিকিউর চেকআউট। ইনস্ট্যান্ট ডিজিটাল ডেলিভারি।"
      : "Secure checkout. Instant digital delivery.";

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card",
        "shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]",
        "transition-[transform,box-shadow] duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-16px_rgba(15,23,42,0.28)]",
      )}
      itemScope
      itemType="https://schema.org/Product"
    >
      <Link
        href={card.href}
        className="flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={card.title}
      >
        <ProductCardMedia
          images={card.images}
          imageAlt={card.title}
          badges={card.badges}
          language={language}
          showPlay={card.hasVideo}
        />

        <div
          className={cn(
            "flex flex-1 flex-col",
            compact ? "gap-3 p-4" : "gap-3.5 p-5 md:p-6",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <h3
              className="min-w-0 flex-1 text-[17px] font-bold leading-snug tracking-tight text-foreground md:text-lg"
              itemProp="name"
            >
              {card.title}
            </h3>
            {card.categoryLabel ? (
              <DynamicBadge
                label={card.categoryLabel}
                variant="category"
                surface="flat"
                size="md"
                className="shrink-0 normal-case tracking-normal"
              />
            ) : null}
          </div>

          {card.description ? (
            <p
              className="line-clamp-3 text-sm leading-relaxed text-muted-foreground"
              itemProp="description"
            >
              {card.description}
            </p>
          ) : null}

          <ProductCardFeatures features={card.features} />

          <div
            className="mt-auto pt-1"
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
              trustLabel={trustLabel}
            />
          </div>
        </div>
      </Link>
    </article>
  );
}

export default ProductCard;
