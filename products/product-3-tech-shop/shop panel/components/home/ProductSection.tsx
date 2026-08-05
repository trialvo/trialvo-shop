"use client";

import { useMemo } from "react";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton";
import { useProducts } from "@/hooks/useProducts";
import { toUIProduct, type ProductBadge } from "@/lib/adapters/product";
import type { Product } from "@/data/products";
import type { ProductListParams } from "@/lib/api/product/service";
import {
  SectionHeader,
  ViewAllLink,
} from "@/components/shared/SectionHeader";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  badge?: Product["badge"];
  limit?: number;
  viewAllLink?: string;
}

function badgeToQuery(
  badge: Product["badge"] | undefined,
  limit: number,
): { params: ProductListParams; forceBadge?: ProductBadge } {
  const base: ProductListParams = {
    limit,
    status: true,
    in_stock: true,
  };

  switch (badge) {
    case "hot":
      return { params: { ...base, featured: true }, forceBadge: "hot" };
    case "bestseller":
      return { params: { ...base, best_deal: true }, forceBadge: "bestseller" };
    case "new":
      return {
        params: {
          ...base,
          sort_by: "created_at",
          sort_order: "DESC",
        },
        forceBadge: "new",
      };
    case "sale":
      return { params: { ...base, best_deal: true }, forceBadge: "sale" };
    default:
      return { params: base };
  }
}

const ProductSection = ({
  title,
  subtitle,
  badge,
  limit = 4,
  viewAllLink = "/shop",
}: ProductSectionProps) => {
  const { params, forceBadge } = useMemo(
    () => badgeToQuery(badge, Math.max(limit, 8)),
    [badge, limit],
  );

  const { products: apiProducts, productsLoading } = useProducts(params);

  const products: Product[] = useMemo(() => {
    return apiProducts
      .map((p) => toUIProduct(p, { forceBadge }))
      .slice(0, limit);
  }, [apiProducts, forceBadge, limit]);

  if (!productsLoading && products.length === 0) return null;

  return (
    <section className="container py-12 md:py-16">
      <SectionHeader title={title} subtitle={subtitle} href={viewAllLink} />
      <div
        className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
        aria-busy={productsLoading || undefined}
        aria-label={productsLoading ? "Loading products" : undefined}
      >
        {productsLoading
          ? Array.from({ length: limit }, (_, index) => (
              <ProductCardSkeleton key={`section-skeleton-${index}`} />
            ))
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      <div className="mt-4 flex justify-center sm:hidden">
        <ViewAllLink href={viewAllLink} />
      </div>
    </section>
  );
};

export default ProductSection;
