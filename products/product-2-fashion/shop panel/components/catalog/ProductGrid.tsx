"use client";

import ProductCard from "@/components/product/ProductCard";
import { useHandleFavoriteClick } from "@/hooks/useHandleFavoriteClick";
import { ProductDetail, ProductListItem } from "@/lib/api/product/service";
import { getLocalName } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAppDispatch } from "@/redux/hooks";
import { openModal } from "@/redux/slices/modalManagerSlice";
import React from "react";
import { FiSearch } from "react-icons/fi";
import CategorySkeleton from "./CategorySkeleton";
import { useTranslation } from "@/hooks/useTranslation";
import type { CompareSlot } from "@/hooks/useCompareStore";

export type ProductGridProps = {
  products: ProductListItem[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  filterParams?: {
    min_price?: number;
    max_price?: number;
    variant_ids?: string;
    color_ids?: string;
    sort_by?: string;
  };
  onClearFilters?: () => void;
  totalProducts?: number;
  activeFilterCount?: number;
  showLoadingMore?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
};

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  isError = false,
  onRetry,
  filterParams,
  onClearFilters,
  totalProducts = 0,
  activeFilterCount = 0,
  showLoadingMore = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}) => {
  const dispatch = useAppDispatch();
  const handleFavoriteClick = useHandleFavoriteClick();
  const { language } = useLanguage();
  const { t } = useTranslation();

  const observerTarget = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!onLoadMore || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '200px'
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [onLoadMore, hasNextPage, isFetchingNextPage]);

  const handleOpenQuickAdd = (id: number) => {
    dispatch(
      openModal({
        key: "quickAdd",
        payload: { id },
      }),
    );
  };

  const hasActiveFilters = React.useMemo(() => {
    if (!filterParams) return false;
    return (
      filterParams.min_price !== undefined ||
      filterParams.max_price !== undefined ||
      filterParams.variant_ids !== undefined ||
      filterParams.color_ids !== undefined ||
      filterParams.sort_by !== undefined ||
      activeFilterCount > 0
    );
  }, [filterParams, activeFilterCount]);

  if (isLoading && products.length === 0) {
    return <CategorySkeleton />;
  }

  if (isError && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <FiSearch className="h-6 w-6 text-black/35" />
        <h3 className="mt-3 text-sm font-semibold text-black">{t("catalog.loadError")}</h3>
        <p className="mt-1 max-w-md text-sm text-black/50">{t("catalog.loadErrorDesc")}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 border border-[#E5E5E5] px-4 py-2 text-sm text-black hover:border-black"
          >
            {t("catalog.retry")}
          </button>
        ) : null}
      </div>
    );
  }

  if (!products?.length && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <FiSearch className="h-6 w-6 text-black/35" />
        <h3 className="mt-3 text-sm font-semibold text-black">
          {hasActiveFilters ? t("catalog.noProductsFiltered") : t("catalog.noProducts")}
        </h3>
        <p className="mt-1 max-w-md text-sm text-black/50">
          {hasActiveFilters ? t("catalog.noProductsFilteredDesc") : t("catalog.noProductsDesc")}
        </p>

        {hasActiveFilters && onClearFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-4 border border-[#E5E5E5] px-4 py-2 text-sm text-black hover:border-black"
          >
            {t("catalog.clearFilters")}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 gap-y-6 min-[640px]:gap-4 min-[640px]:gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {products?.map((product) => {
          const firstImage = product?.thumbnail ?? product?.images?.[0]?.path;

          const discountArray = product?.variations?.filter(p => p?.has_discount);
          const defaultVariations = product?.variations[0];

          const hasDiscount = discountArray?.length > 0;

          const finalPrice = hasDiscount ? discountArray[0]?.final_price : defaultVariations?.final_price;
          const sellingPrice = hasDiscount ? discountArray[0]?.selling_price : defaultVariations?.selling_price;

          const compareProduct: CompareSlot = {
            id: product.id,
            name: product.name,
            slug: product.slug,
            thumbnail: product.thumbnail,
            images: product.images,
          };

          const cardProps = {
            href: `/products/${product?.slug}/${product?.id}/`,
            title: getLocalName(product?.name ?? "", product?.name_bd, language),
            isFavorite: Boolean(product?.is_favourite),
            price: finalPrice ?? 0,
            oldPrice: sellingPrice ?? 0,
            imageSrc: firstImage,
            avgRating: product?.avg_rating,
            reviewCount: product?.review_count,
            compareProduct,
            onQuickAdd: () => handleOpenQuickAdd(product?.id),
            onWishlist: () => {
              handleFavoriteClick(product as unknown as ProductDetail);
            },
          };

          return <ProductCard key={product.id} {...cardProps} />;
        })}
      </div>

      {isFetchingNextPage && (
        <div className="mt-8">
          <CategorySkeleton />
        </div>
      )}

      {hasNextPage && !isFetchingNextPage && (
        <div ref={observerTarget} className="mt-8 min-h-5" />
      )}
    </>
  );
};

export default ProductGrid;
