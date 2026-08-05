"use client";

import { useEffect, useMemo, useState } from "react";

import {
  MegaSaleFilters,
  MegaSaleHero,
  MegaSaleProductGrid,
} from "@/components/mega-sale";
import {
  useMegaSale,
  type MegaSaleSortOption,
} from "@/hooks/useMegaSale";

export default function MegaSalePage() {
  const [category, setCategory] = useState<string>("All");
  const [sort, setSort] = useState<MegaSaleSortOption>("featured");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const {
    products,
    countdown,
    showMegaSale,
    isLoading,
    isError,
    refetch,
  } = useMegaSale(sort);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  );

  useEffect(() => {
    if (!categories.includes(category)) {
      setCategory("All");
    }
  }, [categories, category]);

  const filtered = useMemo(() => {
    const visibleProducts =
      category === "All"
        ? products
        : products.filter((product) => product.category === category);

    if (sort === "price-asc") {
      return [...visibleProducts].sort((a, b) => a.salePrice - b.salePrice);
    }
    if (sort === "price-desc") {
      return [...visibleProducts].sort((a, b) => b.salePrice - a.salePrice);
    }
    if (sort === "rating") {
      return [...visibleProducts].sort((a, b) => b.rating - a.rating);
    }
    return visibleProducts;
  }, [category, products, sort]);

  const countdownValues = [
    countdown.days,
    countdown.hours,
    countdown.minutes,
    countdown.seconds,
  ];

  return (
    <div>
      <MegaSaleHero countdownValues={countdownValues} />
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <MegaSaleFilters
          categories={categories}
          category={category}
          sort={sort}
          showFilters={showFilters}
          onCategoryChange={setCategory}
          onSortChange={setSort}
          onToggleFilters={() => setShowFilters((current) => !current)}
        />
        <MegaSaleProductGrid
          products={filtered}
          isLoading={isLoading}
          isError={isError}
          showMegaSale={showMegaSale}
          onRetry={() => void refetch()}
        />
      </div>
    </div>
  );
};
