"use client";

import LocalizedLink from "@/components/i18n/LocalizedLink";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { Button } from "@/components/ui/button";

/** Featured digital goods shelf — primary catalog surface on home */
export function FeaturedMarketplace() {
  const { language } = useLanguage();
  const { data: featuredProducts, isLoading, isError, refetch } = useFeaturedProducts();

  return (
    <section className="bg-background py-14 md:py-20" aria-labelledby="featured-title">
      <div className="container-custom">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {language === "bn" ? "মার্কেটপ্লেস" : "Marketplace"}
            </p>
            <h2
              id="featured-title"
              className="font-display text-2xl font-bold tracking-tight md:text-3xl"
            >
              {language === "bn"
                ? "ফিচার্ড ডিজিটাল প্রোডাক্ট"
                : "Featured digital products"}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground md:text-base">
              {language === "bn"
                ? "রেডিমেড ইকমার্স সলিউশন—লাইভ ট্রায়াল চালান, তারপর কিনুন।"
                : "Ready-made ecommerce solutions—trial live, then purchase."}
            </p>
          </div>
          <Button asChild variant="outline" className="h-10 rounded-md bg-card">
            <LocalizedLink href="/products">
              {language === "bn" ? "সব প্রোডাক্ট দেখুন" : "Browse all products"}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </LocalizedLink>
          </Button>
        </div>

        {isError && !isLoading ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
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
          </div>
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
      </div>
    </section>
  );
}

export default FeaturedMarketplace;
