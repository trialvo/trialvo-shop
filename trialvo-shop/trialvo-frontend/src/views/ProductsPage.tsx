"use client";

import { Suspense } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import {
  CatalogBrowser,
  CatalogBuyingGuide,
  CatalogPageHeader,
  CatalogSearchBar,
} from "@/components/catalog";
import { Section } from "@/components/section";

/**
 * Marketplace catalog — API products and categories, search via `?q=`,
 * category via `?category=slug`.
 *
 * Only the two query-string-driven pieces sit behind Suspense boundaries.
 * Anything reading `useSearchParams` is excluded from the prerender, so the
 * heading, intro, and buying guide are deliberately kept outside them to stay
 * in the server-rendered HTML.
 */
const ProductsPage = () => {
  const { language } = useLanguage();

  return (
    <Layout>
      <Section
        pattern="mesh"
        divider="bottom"
        className="py-12 md:py-16"
      >
        <CatalogPageHeader
          title={
            language === "bn"
              ? "রেডিমেড ইকমার্স ওয়েবসাইট ও ডিজিটাল প্রোডাক্ট"
              : "Ready-made ecommerce websites and digital products"
          }
          description={
            language === "bn"
              ? "প্রতিটি প্রোডাক্টে গ্রাহকমুখী শপ, সম্পূর্ণ অ্যাডমিন প্যানেল ও পূর্ণ সোর্স কোড থাকে—এককালীন পেমেন্ট, আজীবন লাইসেন্স, আজীবন সাপোর্ট ও আপডেট। কেনার আগে লাইভ ট্রায়াল চালিয়ে দেখুন, তারপর সিদ্ধান্ত নিন।"
              : "Every product ships with a customer-facing storefront, a complete admin panel, and the full source code — one-time payment, lifetime license, lifetime support and updates. Run a live trial before you decide."
          }
        />
        <Suspense
          fallback={
            <div className="h-[64px] max-w-2xl rounded-xl border border-border bg-card shadow-card" />
          }
        >
          <CatalogSearchBar className="max-w-2xl" />
        </Suspense>
      </Section>

      <Section size="sm" className="py-8 md:py-12">
        <Suspense
          fallback={<ProductGrid products={[]} isLoading columns="catalog" />}
        >
          <CatalogBrowser />
        </Suspense>
      </Section>

      <CatalogBuyingGuide />
    </Layout>
  );
};

export default ProductsPage;
