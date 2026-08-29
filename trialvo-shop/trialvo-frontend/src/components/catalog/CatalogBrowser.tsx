"use client";

import { useMemo } from "react";
import { PackageSearch } from "lucide-react";
import { CatalogActiveFilters } from "./CatalogActiveFilters";
import { CatalogCategoryChips } from "./CatalogCategoryChips";
import { CatalogResultsMeta } from "./CatalogResultsMeta";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { useCatalogFilters } from "@/hooks/useCatalogFilters";
import { localize } from "@/lib/localize";

/**
 * Category chips, result count, and the product grid. Reads the query string,
 * so the caller keeps it behind its own Suspense boundary — that is what allows
 * the page heading and guide copy around it to stay server-rendered.
 */
export function CatalogBrowser() {
  const { language } = useLanguage();
  const {
    selectedCategory,
    query,
    selectCategory,
    clearSearch,
    clearFilters,
  } = useCatalogFilters();

  const { data: products, isLoading, isError, refetch } = useProducts(
    selectedCategory || undefined,
  );
  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();

  const searchQuery = query.toLowerCase();

  const filteredProducts = useMemo(() => {
    const list = products ?? [];
    if (!searchQuery) return list;
    return list.filter((product) => {
      const name = `${product.name.bn} ${product.name.en}`.toLowerCase();
      const desc =
        `${product.shortDescription.bn} ${product.shortDescription.en}`.toLowerCase();
      return (
        name.includes(searchQuery) ||
        desc.includes(searchQuery) ||
        product.category.toLowerCase().includes(searchQuery) ||
        product.slug.toLowerCase().includes(searchQuery)
      );
    });
  }, [products, searchQuery]);

  const selectedCategoryMeta = categories.find(
    (category) => category.slug === selectedCategory,
  );
  const categoryLabel = selectedCategoryMeta
    ? localize(selectedCategoryMeta.name, language, selectedCategory)
    : selectedCategory || undefined;

  const activeChips = [
    ...(selectedCategory && categoryLabel
      ? [
          {
            id: "category",
            label: categoryLabel,
            onRemove: () => selectCategory(""),
          },
        ]
      : []),
    ...(query
      ? [
          {
            id: "search",
            label: `“${query}”`,
            onRemove: clearSearch,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <CatalogCategoryChips
        categories={categories}
        selectedSlug={selectedCategory}
        onSelect={selectCategory}
        isLoading={categoriesLoading}
      />

      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <CatalogResultsMeta
          count={filteredProducts.length}
          isLoading={isLoading}
          searchQuery={query || undefined}
          categoryLabel={categoryLabel}
        />
        <CatalogActiveFilters chips={activeChips} onClearAll={clearFilters} />
      </div>

      {isError && !isLoading ? (
        <div className="rounded-xl border border-border bg-card px-6 py-14 text-center">
          <PackageSearch
            className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            {language === "bn"
              ? "প্রোডাক্ট লোড হয়নি। আবার চেষ্টা করুন।"
              : "Products could not be loaded. Please try again."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 rounded-lg"
            onClick={() => void refetch()}
          >
            {language === "bn" ? "আবার চেষ্টা" : "Retry"}
          </Button>
        </div>
      ) : (
        <>
          <ProductGrid
            products={filteredProducts}
            isLoading={isLoading}
            columns="catalog"
            emptyMessage={
              language === "bn"
                ? "এই ফিল্টারে কোনো প্রোডাক্ট নেই।"
                : "No products match these filters."
            }
          />
          {!isLoading && filteredProducts.length === 0 ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="rounded-lg"
              >
                {language === "bn" ? "সব প্রোডাক্ট দেখুন" : "View all products"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default CatalogBrowser;
