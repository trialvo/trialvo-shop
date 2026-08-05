"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBrands } from "@/hooks/useBrands";
import { toBrandViewModel } from "@/lib/adapters/brand";
import { SectionHeader } from "@/components/shared/SectionHeader";

const BrandShowcase = () => {
  const { brands, brandsLoading } = useBrands({ limit: 12, status: true });

  const items = useMemo(() => brands.map(toBrandViewModel), [brands]);

  if (!brandsLoading && items.length === 0) return null;

  return (
    <section className="container py-12 md:py-16">
      <SectionHeader
        align="center"
        title="Top Brands"
        subtitle="We carry products from the world's leading tech brands"
        href="/shop"
        linkLabel="Shop Brands"
      />
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {brandsLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="px-3 py-6 rounded-sm bg-card border border-border animate-pulse"
              />
            ))
          : items.map((brand) => (
              <Link
                key={brand.id}
                href={brand.href}
                className="px-3 py-3 rounded-sm bg-card border border-border hover:border-primary/30 hover:shadow-product transition-all text-center flex flex-col items-center justify-center gap-2 min-h-[72px]"
              >
                {brand.image ? (
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className="h-8 w-auto object-contain max-w-full"
                    loading="lazy"
                  />
                ) : null}
                <span className="font-heading font-semibold text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {brand.name}
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
};

export default BrandShowcase;
