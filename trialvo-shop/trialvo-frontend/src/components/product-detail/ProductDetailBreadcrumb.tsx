"use client";

import { ChevronRight } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
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
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <li>
          <LocalizedLink href="/" className="transition-colors hover:text-foreground">
            {language === "bn" ? "হোম" : "Home"}
          </LocalizedLink>
        </li>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <li>
          <LocalizedLink
            href="/products"
            className="transition-colors hover:text-foreground"
          >
            {productsLabel}
          </LocalizedLink>
        </li>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <li
          aria-current="page"
          className="max-w-[18rem] truncate font-medium text-foreground"
        >
          {title}
        </li>
      </ol>
    </nav>
  );
}

export default ProductDetailBreadcrumb;
