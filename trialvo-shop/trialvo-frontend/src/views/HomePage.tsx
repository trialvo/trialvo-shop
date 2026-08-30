"use client";

import Layout from "@/components/layout/Layout";
import {
  MarketplaceHero,
  CategoryBrowse,
  FeaturedMarketplace,
  WhyTrialvo,
  WhatsIncluded,
  MarketplaceHowItWorks,
  CompareOptions,
  HomeFaq,
  MarketplaceCTA,
} from "@/components/home";

/**
 * Public marketplace home (`/`).
 * Metadata and structured data live in the route segment, so the view is
 * purely the page body.
 */
export default function HomePage() {
  return (
    <Layout>
      <MarketplaceHero />
      <CategoryBrowse />
      <FeaturedMarketplace />
      <WhyTrialvo />
      <WhatsIncluded />
      <MarketplaceHowItWorks />
      <CompareOptions />
      <HomeFaq />
      <MarketplaceCTA />
    </Layout>
  );
}
