"use client";

import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { Section, SectionIntro } from "@/components/section";
import type { MarketplaceLanguage } from "@/types/marketplace";
import type { Product } from "@/types/product";

export type ProductDetailRelatedProps = {
  products: Product[];
  language: MarketplaceLanguage;
  title: string;
};

export function ProductDetailRelated({
  products,
  language,
  title,
}: Readonly<ProductDetailRelatedProps>) {
  if (products.length === 0) return null;

  return (
    <Section labelledBy="product-related-title" tone="muted" divider="top">
      <SectionIntro
        id="product-related-title"
        eyebrow={language === "bn" ? "আরও দেখুন" : "Keep looking"}
        title={title}
        lead={
          language === "bn"
            ? "একই ক্যাটাগরির অন্য প্রোডাক্ট — তুলনা করে সিদ্ধান্ত নিন।"
            : "Other products in the same category, in case you want to compare."
        }
      />
      <ProductGrid products={products} columns="featured" />
    </Section>
  );
}

export default ProductDetailRelated;
