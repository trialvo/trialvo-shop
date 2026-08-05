"use client";

import SafeImage from "@/components/ui/SafeImage";
import { useCategory } from "@/hooks/useCategory";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, type FC } from "react";
import {
  buildCategoryShowcaseItems,
  type CategoryShowcaseItem,
} from "./CategoryShowcase.utils";

interface CategoryShowcaseGridProps {
  categories: ReadonlyArray<CategoryShowcaseItem>;
}

interface CategoryShowcaseCardProps {
  category: CategoryShowcaseItem;
}

const CategoryShowcase: FC = () => {
  const { categories } = useCategory();

  const showcaseCategories = useMemo<ReadonlyArray<CategoryShowcaseItem>>(
    () => buildCategoryShowcaseItems(categories),
    [categories]
  );

  return (
    <section className="w-full bg-secondary/40 py-8 sm:py-10 lg:py-14">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">
        <CategoryShowcaseHeader />
        <CategoryShowcaseGrid categories={showcaseCategories} />
      </div>
    </section>
  );
};

const CategoryShowcaseHeader: FC = () => {
  return (
    <div className="flex items-end justify-between mb-5 sm:mb-8">
      <div>
        <p className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.28em] uppercase text-accent font-semibold mb-1">
          Collections
        </p>
        <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-wide text-foreground">
          Shop by Category
        </h2>
        <p className="hidden sm:block text-muted-foreground text-sm mt-1 tracking-wide">
          Explore our curated collections
        </p>
      </div>
      <Link
        href="/shop"
        className="flex items-center gap-1.5 text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.18em] uppercase text-accent hover:text-accent/80 font-semibold transition-colors border border-accent/30 hover:border-accent/60 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-accent/5"
      >
        <span className="hidden sm:inline">Browse</span> All <ArrowRight size={10} />
      </Link>
    </div>
  );
};

const CategoryShowcaseGrid: FC<CategoryShowcaseGridProps> = ({ categories }) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 md:auto-rows-[180px] lg:auto-rows-[220px] lg:gap-4">
      {categories.map((category) => (
        <CategoryShowcaseCard key={`${category.href}-${category.title}`} category={category} />
      ))}
    </div>
  );
};

const CategoryShowcaseCard: FC<CategoryShowcaseCardProps> = ({ category }) => {
  return (
    <Link
      href={category.href}
      className={`relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-lg hover:shadow-foreground/8 transition-shadow duration-300 aspect-[4/3] md:aspect-auto ${category.desktopSpan} rounded-xl sm:rounded-2xl`}
    >
      <SafeImage
        src={category.image}
        alt={category.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/20 to-transparent" />
      <div className="absolute bottom-0 left-0 p-3 sm:p-4 md:p-5 lg:p-6 w-full">
        <h3 className={`font-display font-bold text-background tracking-wide uppercase drop-shadow-lg ${
          category.size === "large"
            ? "text-base sm:text-lg md:text-2xl lg:text-3xl"
            : "text-sm sm:text-base md:text-lg"
        }`}>
          {category.title}
        </h3>
        <p className="hidden sm:block text-background/65 text-[10px] sm:text-xs tracking-wide mt-0.5 drop-shadow">
          {category.subtitle}
        </p>
        <span className="hidden sm:flex items-center gap-1 mt-2 text-[10px] tracking-[0.2em] uppercase text-accent font-semibold opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-300">
          Shop Now <ArrowRight size={10} />
        </span>
      </div>
    </Link>
  );
};

export default CategoryShowcase;
