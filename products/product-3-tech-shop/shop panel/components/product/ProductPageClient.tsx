"use client";

import { notFound } from "next/navigation";
import ProductDetailClient from "@/components/product/ProductDetailClient";
import { useProductDetail } from "@/hooks/useProductDetail";
import {
  toUIProductFromDetail,
  toUIProductFromRelated,
} from "@/lib/adapters/product";
import { useMemo } from "react";
import Layout from "@/components/layout/Layout";

type ProductPageClientProps = {
  slug: string;
};

export default function ProductPageClient({ slug }: ProductPageClientProps) {
  const {
    product: apiProduct,
    isLoading,
    isNotFound,
    isError,
    refetch,
    reviews,
    reviewSummary,
  } = useProductDetail(slug);

  const product = useMemo(
    () => (apiProduct ? toUIProductFromDetail(apiProduct) : null),
    [apiProduct],
  );

  const related = useMemo(() => {
    if (!apiProduct?.related_products?.length) return [];
    return apiProduct.related_products.slice(0, 8).map(toUIProductFromRelated);
  }, [apiProduct]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="h-3 w-48 bg-muted animate-pulse rounded-sm mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="aspect-square bg-muted animate-pulse rounded-sm" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-16 h-16 bg-muted animate-pulse rounded-sm"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-muted animate-pulse rounded-sm" />
              <div className="h-4 w-1/4 bg-muted animate-pulse rounded-sm" />
              <div className="h-10 w-1/3 bg-muted animate-pulse rounded-sm" />
              <div className="h-24 w-full bg-muted animate-pulse rounded-sm" />
              <div className="h-10 w-full bg-muted animate-pulse rounded-sm" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <p className="font-heading text-lg font-bold mb-2">
            Couldn&apos;t load this product
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            className="inline-flex items-center justify-center px-4 py-2 rounded-sm text-sm font-semibold gradient-primary text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  if (isNotFound || !product || !apiProduct) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={product}
      detail={apiProduct}
      related={related}
      reviews={reviews}
      reviewSummary={reviewSummary}
    />
  );
}
