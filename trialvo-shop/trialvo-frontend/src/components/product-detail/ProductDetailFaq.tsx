"use client";

import FaqAccordion from "@/components/faq/FaqAccordion";
import { Section, SectionIntro } from "@/components/section";
import type { FaqEntry } from "@/lib/content/faq";
import type { MarketplaceLanguage } from "@/types/marketplace";
import type { ProductFaqItem } from "@/types/product";

export type ProductDetailFaqProps = {
  items: ProductFaqItem[];
  language: MarketplaceLanguage;
  title: string;
};

export function ProductDetailFaq({
  items,
  language,
  title,
}: Readonly<ProductDetailFaqProps>) {
  const entries: FaqEntry[] = items
    .map((item, index) => ({
      id: `product-faq-${index + 1}`,
      question: item.question?.[language] || item.question?.en || "",
      answer: item.answer?.[language] || item.answer?.en || "",
    }))
    .filter((entry) => entry.question && entry.answer);

  if (entries.length === 0) return null;

  return (
    <Section labelledBy="product-faq-title" divider="top">
      <SectionIntro
        id="product-faq-title"
        eyebrow={language === "bn" ? "প্রশ্নোত্তর" : "Questions"}
        title={title}
        lead={
          language === "bn"
            ? "এই প্রোডাক্ট নিয়ে যা জানতে চান — সরাসরি উত্তর।"
            : "Straight answers about this product before you buy or start a trial."
        }
      />
      <FaqAccordion entries={entries} defaultOpenFirst />
    </Section>
  );
}

export default ProductDetailFaq;
