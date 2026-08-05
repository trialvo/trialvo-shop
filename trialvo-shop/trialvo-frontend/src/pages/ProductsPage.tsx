import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";
import { ProductGrid } from "@/components/marketplace/ProductGrid";
import {
  CatalogActiveFilters,
  CatalogCategoryChips,
  CatalogPageHeader,
  CatalogResultsMeta,
  CatalogSearch,
} from "@/components/catalog";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { localize } from "@/lib/localize";
import { Button } from "@/components/ui/button";

/**
 * Marketplace catalog — API products + API categories, search via ?q=,
 * category via ?category=slug.
 */
const ProductsPage = () => {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedCategory = searchParams.get("category") || "";
  const urlQuery = (searchParams.get("q") || "").trim();

  const [searchDraft, setSearchDraft] = useState(urlQuery);

  useEffect(() => {
    setSearchDraft(urlQuery);
  }, [urlQuery]);

  const { data: products, isLoading, isError, refetch } = useProducts(
    selectedCategory || undefined,
  );
  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useCategories();

  const searchQuery = urlQuery.toLowerCase();

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

  const patchParams = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams);
    mutate(next);
    setSearchParams(next);
  };

  const handleCategorySelect = (slug: string) => {
    patchParams((next) => {
      if (!slug || slug === selectedCategory) {
        next.delete("category");
      } else {
        next.set("category", slug);
      }
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = searchDraft.trim();
    patchParams((next) => {
      if (q) next.set("q", q);
      else next.delete("q");
    });
  };

  const clearSearch = () => {
    setSearchDraft("");
    patchParams((next) => {
      next.delete("q");
    });
  };

  const clearFilters = () => {
    setSearchDraft("");
    setSearchParams({});
  };

  const activeChips = [
    ...(selectedCategory && categoryLabel
      ? [
          {
            id: "category",
            label: categoryLabel,
            onRemove: () => handleCategorySelect(""),
          },
        ]
      : []),
    ...(urlQuery
      ? [
          {
            id: "search",
            label: `“${urlQuery}”`,
            onRemove: clearSearch,
          },
        ]
      : []),
  ];

  const seoData = {
    bn: {
      title: "সকল প্রোডাক্ট - ডিজিটাল ইকমার্স সলিউশন",
      description:
        "রেডিমেড ইকমার্স সলিউশন ব্রাউজ করুন। ক্যাটাগরি ও সার্চ দিয়ে আপনার প্রোডাক্ট খুঁজুন।",
      keywords: ["ইকমার্স প্রোডাক্ট", "রেডিমেড ওয়েবসাইট", "ডিজিটাল সলিউশন"],
    },
    en: {
      title: "All Products - Digital Ecommerce Solutions",
      description:
        "Browse ready-made ecommerce solutions. Filter by category or search to find the right product.",
      keywords: ["ecommerce products", "ready-made website", "digital solutions"],
    },
  };

  return (
    <Layout>
      <SEOHead
        title={seoData[language].title}
        description={seoData[language].description}
        keywords={seoData[language].keywords}
      />

      <section className="border-b border-border bg-gradient-to-b from-muted/50 to-background py-10 md:py-14">
        <div className="container-custom">
          <CatalogPageHeader
            title={t("nav.products")}
            description={
              language === "bn"
                ? "রেডিমেড ডিজিটাল প্রোডাক্ট ব্রাউজ করুন—লাইভ ট্রায়াল চালান, তারপর কিনুন।"
                : "Browse ready-made digital products—trial live, then purchase."
            }
          />
          <CatalogSearch
            value={searchDraft}
            onChange={setSearchDraft}
            onSubmit={handleSearchSubmit}
            onClear={clearSearch}
            className="max-w-2xl"
          />
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="container-custom space-y-6">
          <CatalogCategoryChips
            categories={categories}
            selectedSlug={selectedCategory}
            onSelect={handleCategorySelect}
            isLoading={categoriesLoading}
          />

          <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
            <CatalogResultsMeta
              count={filteredProducts.length}
              isLoading={isLoading}
              searchQuery={urlQuery || undefined}
              categoryLabel={categoryLabel}
            />
            <CatalogActiveFilters
              chips={activeChips}
              onClearAll={clearFilters}
            />
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
                    {language === "bn"
                      ? "সব প্রোডাক্ট দেখুন"
                      : "View all products"}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ProductsPage;
