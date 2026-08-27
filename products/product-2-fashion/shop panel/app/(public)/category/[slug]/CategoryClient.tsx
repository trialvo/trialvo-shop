"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import CatalogHeader from "@/components/catalog/CatalogHeader";
import CatalogLayout from "@/components/catalog/CatalogLayout";
import ProductGrid from "@/components/catalog/ProductGrid";
import type { SortValue } from "@/components/catalog/types";
import FilterSidebar from "@/components/filters/FilterSidebar";
import { useCatalogFilterSidebarState } from "@/hooks/useCatalogFilterSidebarState";
import { useDebouncedPrice } from "@/hooks/useDebouncedPrice";
import { useMultiFilterIds } from "@/hooks/useMultiFilterIds";
import { useInfiniteProducts } from "@/hooks/useProduct";
import type { ProductListParams } from "@/lib/api/product/service";
import { decodeSlug, humanizeSlug } from "@/lib/string";
import { useParams, useSearchParams } from "next/navigation";
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";

export interface SortConfig {
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  featured?: boolean;
}

export function mapSortToApi(sort: SortValue): SortConfig {
  switch (sort) {
    case "featured":
      return { featured: true };
    case "name_asc":
      return { sort_by: "name", sort_order: "ASC" };
    case "name_desc":
      return { sort_by: "name", sort_order: "DESC" };
    case "price_asc":
      return { sort_by: "price", sort_order: "ASC" };
    case "price_desc":
      return { sort_by: "price", sort_order: "DESC" };
    case "date_asc":
      return { sort_by: "created_at", sort_order: "ASC" };
    case "date_desc":
      return { sort_by: "created_at", sort_order: "DESC" };
    default:
      return {};
  }
}

export function useDebouncedSort(
  sort: SortValue,
  debounceMs: number = 300
): SortConfig {
  const [debouncedSort, setDebouncedSort] = React.useState<SortConfig>(mapSortToApi(sort));

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSort(mapSortToApi(sort));
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [sort, debounceMs]);

  return debouncedSort;
}

export function toPositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  const i = Math.trunc(n);
  return i > 0 ? i : undefined;
}

export default function CategoryClient(): React.ReactElement {
  const params = useParams();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug.join("-") : rawSlug ?? "";

  const childId = toPositiveInt(searchParams.get("childId"));
  const subId = toPositiveInt(searchParams.get("subId"));

  const [sort, setSort] = React.useState<SortValue>("featured");

  const debouncedSort = useDebouncedSort(sort, 300);

  const { value: filters, onChange: onFiltersChange, onClear } = useCatalogFilterSidebarState();
  const { variantIds, colorIds } = useMultiFilterIds(filters, 1000);
  const debouncedPrice = useDebouncedPrice(filters.price, 1000);

  const normalizeTitle = React.useMemo(() => {
    const key = slug.trim().toLowerCase();
    if (!key || key === "all" || key === "all-products") return t("catalog.allProducts");
    return decodeSlug(humanizeSlug(slug));
  }, [slug, t]);

  const filterCount = React.useMemo(() => {
    const priceChanged = filters.price.min !== 0 || filters.price.max !== 10000;
    return filters.sizes.size + filters.colors.size + (priceChanged ? 1 : 0);
  }, [filters]);

  const queryParams: Omit<ProductListParams, "offset" | "page"> = React.useMemo(() => {
    const minPrice =
      typeof debouncedPrice.min === "number" && Number.isFinite(debouncedPrice.min)
        ? debouncedPrice.min
        : undefined;

    const maxPrice =
      typeof debouncedPrice.max === "number" && Number.isFinite(debouncedPrice.max)
        ? debouncedPrice.max
        : undefined;

    return {
      child_category_id: childId,
      sub_category_id: subId,
      variant_id: variantIds || undefined,
      color_id: colorIds || undefined,
      min_price: minPrice,
      max_price: maxPrice,
      sort_by: debouncedSort.sort_by,
      sort_order: debouncedSort.sort_order,
      featured: debouncedSort.featured,
      status: true,
    };
  }, [childId, subId, debouncedSort, debouncedPrice, variantIds, colorIds]);

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteProducts(queryParams, 12);

  const products = React.useMemo(() => {
    return data?.pages.flatMap(page => page.products) ?? [];
  }, [data]);

  const totalProducts = data?.pages[0]?.total;

  return (
    <>
      <Breadcrumbs items={[{ label: t("breadcrumb.home"), href: "/" }, { label: normalizeTitle }]} />

      <CatalogLayout
        sidebar={<FilterSidebar value={filters} onChange={onFiltersChange} />}
        header={
          <CatalogHeader
            title={normalizeTitle}
            sort={sort}
            onSortChange={setSort}
            count={typeof totalProducts === "number" ? totalProducts : undefined}
            filterCount={filterCount}
          />
        }
      >
        <ProductGrid
          products={products}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          onClearFilters={onClear}
          activeFilterCount={filterCount}
          filterParams={queryParams}
          totalProducts={totalProducts}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
        />
      </CatalogLayout>
    </>
  );
}
