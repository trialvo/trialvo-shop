"use client";

import type { FilterState, SortOption } from "@/components/product";
import {
  ActiveFilterTags,
  MobileFilterDrawer,
  ProductFilterSidebar,
  ProductGrid,
  ProductToolbar,
} from "@/components/product";
import {
  useCategory,
  type Category,
  type ChildCategory,
  type SubCategory,
} from "@/hooks/useCategory";
import { useFavorite } from "@/hooks/useFavorite";
import { useHeaderVisibility } from "@/hooks/useHeaderVisibility";
import { useInfiniteProducts } from "@/hooks/useProducts";
import type { ProductListItem, ProductListParams } from "@/lib/api/product/service";
import { useAppDispatch, useAppSelector } from "@/store";
import { addItem } from "@/store/slices/cartSlice";
import { openQuickView } from "@/store/slices/uiSlice";
import {
  selectWishlistIds,
  setWishlistProductState,
} from "@/store/slices/wishlistSlice";
import type { Product, ProductColor } from "@/types";
import { ChevronRight, Home, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { IMAGE_URL } from "@/config/env";
import { parseSearchQueryFromUrl } from "@/lib/routes";
import { useCartProductIds } from "@/hooks/useCartProductIds";


const PAGE_SIZE = 24;
const DEFAULT_PRICE_RANGE: [number, number] = [0, 100000];

interface CategoryFilterOption {
  label: string;
  mainCategoryId?: number;
  subCategoryId?: number;
  childCategoryId?: number;
}

interface DesktopFilterSidebarProps {
  filterProps: FilterState;
}

type ProductListItemMeta = ProductListItem & {
  category_name?: string | null;
  main_category_name?: string | null;
  sub_category_name?: string | null;
  child_category_name?: string | null;
  colors?: Array<string | { name?: string | null; value?: string | null; hex?: string | null }>;
  sizes?: string[];
  available_colors?: Array<{ name?: string | null; value?: string | null; hex?: string | null }>;
  available_variants?: Array<{ name?: string | null }>;
  merged_variants?: {
    colors?: string[];
    sizes?: string[];
  };
};

type ProductVariationMeta = ProductListItem["variations"][number] & {
  color?: { name?: string | null; hex?: string | null };
  variant?: { name?: string | null };
  weight_kg?: number | null;
  free_delivery?: boolean | null;
  in_stock?: boolean;
};

/* ── Adaptor: API ProductListItem → UI Product ────────────────────── */
function toUIProduct(product: ProductListItem): Product {
  const productMeta = product as ProductListItemMeta;
  const prices = product.variations
    .map((variation) => variation.final_price ?? variation.selling_price)
    .filter((price) => Number.isFinite(price));
  const minVariationPrice = prices.length ? Math.min(...prices) : 0;
  const minPrice = product.price_range?.min ?? minVariationPrice;
  const hasDiscount =
    product.price_range?.has_discount ??
    product.variations.some((variation) => Boolean(variation.has_discount) || variation.discount > 0);
  const maxPrice = product.price_range?.max ?? minPrice;
  const images = getProductImages(product);
  const mainImage = images[0] ?? "";

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: minPrice,
    oldPrice: hasDiscount ? maxPrice : null,
    image: mainImage,
    images: images.length ? images : [mainImage],
    category: getProductCategoryName(productMeta),
    sizes: getProductSizes(productMeta),
    colors: getProductColors(productMeta),
    badge: product.featured ? "HOT" : hasDiscount ? "SALE" : null,
    description: "",
    details: [],
    rating: product.avg_rating ?? 0,
    reviewCount: product.review_count ?? 0,
    inStock: product.variations.some((variation) => variation.stock > 0),
  };
}

function toImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  const normalizedPath = path.trim();
  if (!normalizedPath) return "";
  if (/^(https?:)?\/\//i.test(normalizedPath) || /^(data:|blob:)/i.test(normalizedPath)) {
    return normalizedPath;
  }

  return `${IMAGE_URL}${normalizedPath.startsWith("/") ? "" : "/"}${normalizedPath}`;
}

function getProductImages(product: ProductListItem): string[] {
  return dedupeStrings([
    toImageUrl(product.thumbnail),
    ...product.images.map((image) => toImageUrl(image.path)),
  ]);
}

function getProductCategoryName(product: ProductListItemMeta): string {
  return (
    product.child_category_name ??
    product.sub_category_name ??
    product.main_category_name ??
    product.category_name ??
    "Fashion"
  );
}

function getProductSizes(product: ProductListItemMeta): string[] {
  const variationSizes = product.variations
    .map((variation) => (variation as ProductVariationMeta).variant?.name)
    .filter(isFilledString);

  return dedupeStrings([
    ...(product.sizes ?? []),
    ...(product.merged_variants?.sizes ?? []),
    ...product.available_variants?.map((variant) => variant.name).filter(isFilledString) ?? [],
    ...variationSizes,
  ]);
}

function getProductColors(product: ProductListItemMeta): ProductColor[] {
  const colors = new Map<string, ProductColor>();

  const addColor = (name: string | null | undefined, value?: string | null) => {
    if (!isFilledString(name)) return;
    const normalizedName = name.trim();
    const key = normalizedName.toLowerCase();
    if (colors.has(key)) return;

    colors.set(key, {
      name: normalizedName,
      value: isFilledString(value) ? value.trim() : "#d1d5db",
    });
  };

  product.colors?.forEach((color) => {
    if (typeof color === "string") {
      addColor(color);
      return;
    }

    addColor(color.name, color.hex ?? color.value);
  });

  product.merged_variants?.colors?.forEach((color) => addColor(color));
  product.available_colors?.forEach((color) => addColor(color.name, color.hex ?? color.value));
  product.variations.forEach((variation) => {
    const variationMeta = variation as ProductVariationMeta;
    addColor(variationMeta.color?.name, variationMeta.color?.hex);
  });

  return Array.from(colors.values());
}

function buildCategoryFilterOptions(categories: ReadonlyArray<Category>): CategoryFilterOption[] {
  const options: CategoryFilterOption[] = [{ label: "All" }];
  const seen = new Set(["all"]);

  const addOption = (option: CategoryFilterOption) => {
    const key = normalizeFilterValue(option.label);
    if (!key || seen.has(key)) return;
    seen.add(key);
    options.push(option);
  };

  categories.forEach((category) => {
    addOption({ label: category.name, mainCategoryId: category.id });

    getVisibleSubCategories(category).forEach((subCategory) => {
      addOption({ label: subCategory.name, subCategoryId: subCategory.id });
    });
  });

  return options;
}

function getRouteCategoryLabel(
  categories: ReadonlyArray<Category>,
  categoryName: string,
  subCategoryId: number | null,
  childCategoryId: number | null
): string {
  if (childCategoryId) {
    const childCategory = findChildCategory(categories, childCategoryId);
    if (childCategory) return childCategory.name;
  }

  if (subCategoryId) {
    const subCategory = findSubCategory(categories, subCategoryId);
    if (subCategory) return subCategory.name;
  }

  return categoryName;
}

function findSubCategory(
  categories: ReadonlyArray<Category>,
  subCategoryId: number
): SubCategory | undefined {
  return categories
    .flatMap((category) => getVisibleSubCategories(category))
    .find((subCategory) => subCategory.id === subCategoryId);
}

function findChildCategory(
  categories: ReadonlyArray<Category>,
  childCategoryId: number
): ChildCategory | undefined {
  return categories
    .flatMap((category) => getVisibleSubCategories(category))
    .flatMap((subCategory) => getVisibleChildCategories(subCategory))
    .find((childCategory) => childCategory.id === childCategoryId);
}

function getVisibleSubCategories(category: Category): SubCategory[] {
  return (category.children ?? category.sub_categories ?? []).filter(
    (subCategory) => subCategory.status
  );
}

function getVisibleChildCategories(subCategory: SubCategory): ChildCategory[] {
  return (subCategory.children ?? subCategory.child_categories ?? []).filter(
    (childCategory) => childCategory.status
  );
}

function getCategoryQueryParams(
  selectedCategory: string,
  categoryOptions: ReadonlyArray<CategoryFilterOption>,
  routeCategoryLabel: string,
  subCategoryId: number | null,
  childCategoryId: number | null
): Pick<ProductListParams, "main_category_id" | "sub_category_id" | "child_category_id"> {
  if (selectedCategory === "All") return {};

  const selectedOption = categoryOptions.find(
    (option) => normalizeFilterValue(option.label) === normalizeFilterValue(selectedCategory)
  );

  if (selectedOption?.childCategoryId) return { child_category_id: selectedOption.childCategoryId };
  if (selectedOption?.subCategoryId) return { sub_category_id: selectedOption.subCategoryId };
  if (selectedOption?.mainCategoryId) return { main_category_id: selectedOption.mainCategoryId };

  if (normalizeFilterValue(selectedCategory) !== normalizeFilterValue(routeCategoryLabel)) return {};
  if (childCategoryId) return { child_category_id: childCategoryId };
  if (subCategoryId) return { sub_category_id: subCategoryId };

  return {};
}

function getSortParams(sortBy: SortOption): Pick<ProductListParams, "sort_by" | "sort_order"> {
  switch (sortBy) {
    case "az":
      return { sort_by: "name", sort_order: "asc" };
    case "za":
      return { sort_by: "name", sort_order: "desc" };
    case "price-asc":
      return { sort_by: "price", sort_order: "asc" };
    case "price-desc":
      return { sort_by: "price", sort_order: "desc" };
    case "oldest":
      return { sort_by: "created_at", sort_order: "asc" };
    case "newest":
    case "featured":
    default:
      return { sort_by: "created_at", sort_order: "desc" };
  }
}

function dedupeProductListItems(products: ProductListItem[]): ProductListItem[] {
  const seen = new Set<number>();
  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function dedupeStrings(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  values.forEach((value) => {
    if (!isFilledString(value)) return;
    const normalizedValue = value.trim();
    const key = normalizeFilterValue(normalizedValue);
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(normalizedValue);
  });

  return deduped;
}

function isFilledString(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null;
  const parsedValue = Number(value);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function normalizeFilterValue(value: string): string {
  return value.trim().toLowerCase();
}

function DesktopFilterSidebar({ filterProps }: DesktopFilterSidebarProps) {
  const { stickyTopPx, stickyMaxHeight } = useHeaderVisibility();

  return (
    <aside
      className="hidden lg:block w-[240px] xl:w-[260px] shrink-0 sticky overflow-y-auto scrollbar-hide pr-1 transition-all duration-300 ease-out"
      style={{
        top: `${stickyTopPx}px`,
        maxHeight: stickyMaxHeight,
      }}
    >
      <ProductFilterSidebar {...filterProps} />
    </aside>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
function ShopContent() {
  const searchParams    = useSearchParams();
  const categoryParam   = searchParams.get("category") || "All";
  const subCategoryParam = parsePositiveInt(searchParams.get("sub_category"));
  const childCategoryParam = parsePositiveInt(searchParams.get("child_category"));
  const searchQuery = useMemo(() => parseSearchQueryFromUrl(searchParams), [searchParams]);
  const router = useRouter();
  const { categories: categoryTree } = useCategory();
  const dispatch      = useAppDispatch();
  const { toggleFavorite } = useFavorite();
  const wishlistIds   = useAppSelector(selectWishlistIds);
  const cartProductIds = useCartProductIds();
  const wishlistedIds = useMemo(
    () => new Set<number>(wishlistIds),
    [wishlistIds]
  );

  /* ── Filter state ── */
  const [priceRange,        setPriceRange]        = useState<[number, number]>(DEFAULT_PRICE_RANGE);
  const [selectedSizes,     setSelectedSizes]     = useState<string[]>([]);
  const [selectedColors,    setSelectedColors]    = useState<string[]>([]);
  const [selectedCategory,  setSelectedCategory]  = useState<string>(categoryParam);
  const [sortBy,            setSortBy]            = useState<SortOption>("featured");
  const [sizeSearch,        setSizeSearch]        = useState<string>("");
  const [colorSearch,       setColorSearch]       = useState<string>("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [gridCols,          setGridCols]          = useState<2 | 3>(3);

  /* ── Derived data ── */
  const categoryOptions = useMemo(
    () => buildCategoryFilterOptions(categoryTree),
    [categoryTree]
  );

  const routeCategoryLabel = useMemo(
    () =>
      getRouteCategoryLabel(
        categoryTree,
        categoryParam,
        subCategoryParam,
        childCategoryParam
      ),
    [categoryTree, categoryParam, subCategoryParam, childCategoryParam]
  );

  useEffect(() => {
    setSelectedCategory(routeCategoryLabel);
  }, [routeCategoryLabel]);

  const categoryQueryParams = useMemo(
    () =>
      getCategoryQueryParams(
        selectedCategory,
        categoryOptions,
        routeCategoryLabel,
        subCategoryParam,
        childCategoryParam
      ),
    [
      selectedCategory,
      categoryOptions,
      routeCategoryLabel,
      subCategoryParam,
      childCategoryParam,
    ]
  );

  const sortParams = useMemo(() => getSortParams(sortBy), [sortBy]);
  const productQueryParams = useMemo<ProductListParams>(
    () => ({
      ...categoryQueryParams,
      ...sortParams,
      search: searchQuery || undefined,
      min_price:
        priceRange[0] > DEFAULT_PRICE_RANGE[0] ? priceRange[0] : undefined,
      max_price:
        priceRange[1] < DEFAULT_PRICE_RANGE[1] ? priceRange[1] : undefined,
      // Colors and sizes are filtered client-side only to avoid triggering
      // a new API fetch (and layout jump) on every color/size toggle.
      status: true,
    }),
    [categoryQueryParams, sortParams, priceRange, searchQuery]
  );

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteProducts(productQueryParams, PAGE_SIZE);

  const rawProducts = useMemo(
    () => dedupeProductListItems(data?.pages.flatMap((page) => page.products) ?? []),
    [data]
  );
  const products = useMemo(() => rawProducts.map(toUIProduct), [rawProducts]);

  useEffect(() => {
    rawProducts.forEach((product) => {
      dispatch(setWishlistProductState({
        productId: product.id,
        isFavorite: product.is_favourite === true,
      }));
    });
  }, [dispatch, rawProducts]);

  const allSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach((product) => {
      product.sizes.forEach((size) => sizes.add(size));
    });
    return Array.from(sizes);
  }, [products]);

  const allColors = useMemo(() => {
    const colors = new Map<string, ProductColor>();
    products.forEach((product) => {
      product.colors.forEach((color) => {
        colors.set(normalizeFilterValue(color.name), color);
      });
    });
    return Array.from(colors.values());
  }, [products]);

  const categories = useMemo(() => {
    const productCategories = products.map((product) => product.category);
    return dedupeStrings([
      ...categoryOptions.map((option) => option.label),
      ...productCategories,
    ]);
  }, [categoryOptions, products]);

  const hasServerCategoryFilter =
    Boolean(categoryQueryParams.main_category_id) ||
    Boolean(categoryQueryParams.sub_category_id) ||
    Boolean(categoryQueryParams.child_category_id);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "All" && !hasServerCategoryFilter) {
      result = result.filter(
        (product) =>
          normalizeFilterValue(product.category) === normalizeFilterValue(selectedCategory)
      );
    }

    result = result.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    if (selectedSizes.length > 0) {
      result = result.filter((product) =>
        product.sizes.some((size) => selectedSizes.includes(size))
      );
    }

    if (selectedColors.length > 0) {
      result = result.filter((product) =>
        product.colors.some((color) => selectedColors.includes(color.name))
      );
    }

    switch (sortBy) {
      case "az":         result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "za":         result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "price-asc":  result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "newest":     result.sort((a, b) => b.id - a.id); break;
      case "oldest":     result.sort((a, b) => a.id - b.id); break;
    }
    return result;
  }, [
    products,
    selectedCategory,
    hasServerCategoryFilter,
    priceRange,
    selectedSizes,
    selectedColors,
    sortBy,
  ]);

  const activeFilterCount =
    (selectedCategory !== "All" ? 1 : 0) +
    selectedSizes.length +
    selectedColors.length +
    (priceRange[0] > DEFAULT_PRICE_RANGE[0] || priceRange[1] < DEFAULT_PRICE_RANGE[1] ? 1 : 0);

  /* ── Handlers ── */
  const toggleSize  = (size: string) =>
    setSelectedSizes((prev) => prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]);

  const toggleColor = (color: string) =>
    setSelectedColors((prev) => prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]);

  const clearFilters = useCallback(() => {
    setPriceRange(DEFAULT_PRICE_RANGE);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedCategory("All");
    setSortBy("featured");

    // Sync URL — remove all filter/search query params from address bar
    router.push("/shop", { scroll: false });
  }, [router]);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleAddToCart = (product: Product) => {
    dispatch(addItem({
      productId: String(product.id), title: product.name, price: product.price,
      originalPrice: product.price,
      size: product.sizes[0] || "One Size",
      color: product.colors[0]?.name || "Default",
      image: product.image, slug: product.slug,
      quantity: 1, stock: 10,
    }));
    toast.success(`${product.name} added to cart`);
  };

  const handleToggleWishlist = useCallback(
    (product: Product) => {
      const isFavorite = wishlistedIds.has(product.id);

      void toggleFavorite(product.id, isFavorite)
        .then((response) => {
          const isNowFavorite = response.data?.is_favorite === true;
          toast.success(isNowFavorite ? "Added to wishlist" : "Removed from wishlist");
        })
        .catch((error: unknown) => {
          const message = error instanceof Error
            ? error.message
            : "Failed to update wishlist";
          toast.error(message);
        });
    },
    [toggleFavorite, wishlistedIds],
  );

  const filterProps: FilterState = {
    priceRange, priceBounds: DEFAULT_PRICE_RANGE, selectedSizes, selectedColors, selectedCategory,
    sizeSearch, colorSearch, categories, allSizes, allColors, activeFilterCount,
    onPriceChange: setPriceRange,
    onSizeToggle: toggleSize,
    onColorToggle: toggleColor,
    onCategoryChange: setSelectedCategory,
    onSizeSearch: setSizeSearch,
    onColorSearch: setColorSearch,
    onClearAll: clearFilters,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">

        {/* ── Breadcrumb ── */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-6"
        >
          <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Home size={12} /> Home
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          {searchQuery && (
            <>
              <ChevronRight size={12} className="opacity-40" />
              <span className="text-foreground font-medium flex items-center gap-1">
                <SearchIcon size={11} /> &ldquo;{searchQuery}&rdquo;
              </span>
            </>
          )}
          {!searchQuery && selectedCategory !== "All" && (
            <>
              <ChevronRight size={12} className="opacity-40" />
              <span className="text-foreground font-medium">{selectedCategory}</span>
            </>
          )}
        </nav>

        <div className="flex gap-6 xl:gap-8 items-start">
          {/* ── Desktop Sidebar ── */}
          <DesktopFilterSidebar filterProps={filterProps} />

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0">
            <ProductToolbar
              title={searchQuery ? `Results for "${searchQuery}"` : selectedCategory === "All" ? "All Products" : selectedCategory}
              count={filteredProducts.length}
              sortBy={sortBy}
              gridCols={gridCols}
              activeFilterCount={activeFilterCount}
              onSortChange={setSortBy}
              onGridChange={setGridCols}
              onOpenMobileFilters={() => setMobileFiltersOpen(true)}
            />

            <ActiveFilterTags
              selectedCategory={selectedCategory}
              selectedSizes={selectedSizes}
              selectedColors={selectedColors}
              priceRange={priceRange}
              defaultPriceRange={DEFAULT_PRICE_RANGE}
              onRemoveCategory={() => setSelectedCategory("All")}
              onRemoveSize={toggleSize}
              onRemoveColor={toggleColor}
              onRemovePrice={() => setPriceRange(DEFAULT_PRICE_RANGE)}
            />

            <ProductGrid
              products={filteredProducts}
              isLoading={isLoading}
              gridCols={gridCols}
              wishlistedIds={wishlistedIds}
              cartProductIds={cartProductIds}
              onToggleWishlist={handleToggleWishlist}
              onQuickView={(product: Product) => dispatch(openQuickView(product))}
              onAddToCart={handleAddToCart}
              onClearFilters={clearFilters}
              hasMore={Boolean(hasNextPage)}
              isFetchingMore={isFetchingNextPage}
              onLoadMore={handleLoadMore}
            />
          </div>
        </div>
      </div>

      <MobileFilterDrawer
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        {...filterProps}
      />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground tracking-wide">Loading products…</p>
          </div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
