"use client";

import Breadcrumb from "@/components/navigation/Breadcrumb";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type ProductDetailBreadcrumbProps = {
  title: string;
  productsLabel: string;
  language: MarketplaceLanguage;
};

export function ProductDetailBreadcrumb({
  title,
  productsLabel,
  language,
}: Readonly<ProductDetailBreadcrumbProps>) {
  return (
    <Breadcrumb
      className="mb-6 md:mb-8"
      items={[
        { label: language === "bn" ? "হোম" : "Home", href: "/" },
        { label: productsLabel, href: "/products" },
        { label: title },
      ]}
    />
  );
}

export default ProductDetailBreadcrumb;
