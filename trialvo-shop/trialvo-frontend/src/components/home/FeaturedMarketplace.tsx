"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { Button } from "@/components/ui/button";
import { Section, SectionIntro, Surface } from "@/components/section";

/** Featured digital goods shelf — primary catalog surface on home */
export function FeaturedMarketplace() {
  const { language } = useLanguage();
  const { data: featuredProducts, isLoading, isError, refetch } = useFeaturedProducts();

  return (
    <Section labelledBy="featured-title" tone="muted" pattern="mesh" size="lg">
      <SectionIntro
        id="featured-title"
        eyebrow={language === "bn" ? "মার্কেটপ্লেস" : "Marketplace"}
        title={
          language === "bn"
            ? "ফিচার্ড ডিজিটাল প্রোডাক্ট"
            : "Featured digital products"
        }
        lead={
          language === "bn"
            ? "রেডিমেড ইকমার্স সলিউশন—লাইভ ট্রায়াল চালান, তারপর কিনুন।"
            : "Ready-made ecommerce solutions—trial live, then purchase."
        }
        action={
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-lg bg-background shadow-card"
          >
            <LocalizedLink href="/products">
              {language === "bn" ? "সব প্রোডাক্ট দেখুন" : "Browse all products"}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </LocalizedLink>
          </Button>
        }
      />

      {isError && !isLoading ? (
        <Surface sheen className="px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {language === "bn" ? "প্রোডাক্ট লোড হয়নি।" : "Products could not be loaded."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-lg"
            onClick={() => void refetch()}
          >
            {language === "bn" ? "আবার চেষ্টা" : "Retry"}
          </Button>
        </Surface>
      ) : (
        <ProductGrid
          products={featuredProducts ?? []}
          isLoading={isLoading}
          columns="featured"
          emptyMessage={
            language === "bn"
              ? "এখনো কোনো ফিচার্ড ডিজিটাল প্রোডাক্ট নেই।"
              : "No featured digital products yet."
          }
        />
      )}
    </Section>
  );
}

export default FeaturedMarketplace;
