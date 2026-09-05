"use client";

import Layout from "@/components/layout/Layout";
import {
  MarketplaceHero,
  CategoryBrowse,
  FeaturedMarketplace,
  TrialPathways,
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
      {/* The two-step trial is the differentiator — it sits right after the
          hero so a visitor understands the offer before browsing products. */}
      <TrialPathways />
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
