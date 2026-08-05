import OffersPageClient from "@/components/offers/OffersPageClient";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import React from "react";

const title = "Offers | Graduate";
const description =
  "Discover the latest bulk offers and combo deals at Graduate. Save more with quantity discounts and curated bundle pricing.";

export const metadata: Metadata = buildMetadata({
  title,
  description,
  canonical: "/offers",
  ogTitle: title,
  ogDescription:
    "Explore exclusive bulk and combo offers from Graduate with transparent savings and easy add-to-cart shopping.",
  ogImage: "/og-offers.jpg",
});

const OffersPage: React.FC = () => {
  return <OffersPageClient />;
};

export default OffersPage;
