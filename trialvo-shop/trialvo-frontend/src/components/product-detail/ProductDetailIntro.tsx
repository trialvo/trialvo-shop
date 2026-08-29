"use client";

import { Eyebrow } from "@/components/section";
import { DynamicBadge } from "@/components/ui/DynamicBadge";
import { useCategories } from "@/hooks/useCategories";
import { resolveCategoryLabel } from "@/lib/digitalGoods";
import type { MarketplaceLanguage } from "@/types/marketplace";
import type { Product } from "@/types/product";

export type ProductDetailIntroProps = {
  product: Product;
  language: MarketplaceLanguage;
};

/** Category, real product markers, headline and summary. */
export function ProductDetailIntro({
  product,
  language,
}: Readonly<ProductDetailIntroProps>) {
  const { data: categories } = useCategories();
  const categoryLabel = resolveCategoryLabel(product.category, language, categories);
  const title = product.name[language] || product.name.en;
  const description =
    product.shortDescription[language] || product.shortDescription.en;

  return (
    <header>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <Eyebrow>{categoryLabel}</Eyebrow>
        {product.isFeatured ? (
          <DynamicBadge
            label={language === "bn" ? "ফিচার্ড" : "Featured"}
            variant="accent"
            surface="flat"
          />
        ) : null}
        {product.isTrialable ? (
          <DynamicBadge
            label={language === "bn" ? "ট্রায়াল উপলব্ধ" : "Trial available"}
            variant="trial"
            surface="flat"
          />
        ) : null}
      </div>

      <h1
        id="product-title"
        className="mt-4 font-display text-[2rem] font-bold leading-[1.14] tracking-tight sm:text-[2.25rem]"
        itemProp="name"
      >
        {title}
      </h1>

      {description ? (
        <p
          className="mt-4 text-[15px] leading-7 text-muted-foreground md:text-base md:leading-[1.7]"
          itemProp="description"
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}

export default ProductDetailIntro;
