"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useMainCategories } from "@/hooks/useMainCategories";
import { toFeaturedCategories } from "@/lib/adapters/category";
import { SectionHeader } from "@/components/shared/SectionHeader";

const FeaturedCategories = () => {
  const { mainCategories, mainCategoriesLoading } = useMainCategories();

  const categories = useMemo(
    () => toFeaturedCategories(mainCategories, 10),
    [mainCategories],
  );

  return (
    <section className="container py-12 md:py-16">
      <SectionHeader
        align="center"
        title="Shop by Category"
        subtitle="Find what you need from our wide range of tech categories"
        href="/shop"
        linkLabel="Browse Shop"
      />

      {mainCategoriesLoading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center p-3 md:p-4 rounded-sm bg-card border border-border animate-pulse"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-sm bg-secondary mb-2" />
              <div className="h-3 w-16 bg-secondary rounded-sm" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? null : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group flex flex-col items-center text-center p-3 md:p-4 rounded-sm bg-card border border-border hover:border-primary/30 hover:shadow-product-hover transition-all duration-300"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-sm overflow-hidden mb-2 bg-secondary">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <h3 className="text-[11px] md:text-sm font-medium group-hover:text-primary transition-colors leading-tight">
                {cat.name}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden sm:block">
                {cat.productCount} products
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedCategories;
