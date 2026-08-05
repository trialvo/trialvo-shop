"use client";

import * as React from "react";

import FeatureProductHeader from "@/components/product-view-header/FeatureProductHeader";
import ProductCard from "@/components/product/ProductCard";
import ProductCardMobile from "@/components/product/ProductCardMobile";

import { Button } from "@/components/ui/button";
import { useHandleFavoriteClick } from "@/hooks/useHandleFavoriteClick";
import { useProduct } from "@/hooks/useProduct";
import { useTranslation } from "@/hooks/useTranslation";
import { ProductDetail } from "@/lib/api/product/service";
import { getLocalName } from "@/lib/utils";
import { useLanguage } from "@/providers/LanguageProvider";
import { useAppDispatch } from "@/redux/hooks";
import { openModal } from "@/redux/slices/modalManagerSlice";
import { useRouter } from "next/navigation";
import FeatureProductsSkeleton from "./FeatureProductsSkeleton";

const FeatureProducts: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { products, productsLoading, productsError, productsRefetch } = useProduct({ limit: 40, offset: 0 });
  const handleFavoriteClick = useHandleFavoriteClick();
  const { t, language } = useTranslation();

  const handleOpenQuickAdd = (id: number) => {
    dispatch(
      openModal({
        key: "quickAdd",
        payload: { id },
      }),
    );
  };

  if (productsLoading) {
    return <FeatureProductsSkeleton />;
  }

  if (productsError && products.length === 0) {
    return (
      <section className="container mx-auto mb-15.5">
        <FeatureProductHeader
          title={t("home.featureProducts.title")}
          viewAllLabel={t("home.featureProducts.viewAll")}
          viewAllHref="/category/feature-products"
        />
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-black/10 bg-white py-16 gap-3">
          <p className="text-sm text-black/50">{t("home.featureProducts.loadError") ?? "Failed to load products. Please try again."}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => productsRefetch()}
            className="h-8 px-5 rounded-none border-black text-black text-xs hover:bg-black hover:text-white transition-colors"
          >
            {t("home.featureProducts.retry") ?? "Retry"}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto mb-15.5">
      <FeatureProductHeader
        title={t("home.featureProducts.title")}
        viewAllLabel={t("home.featureProducts.viewAll")}
        viewAllHref="/category/feature-products"
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-y-15 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {products?.map((product, idx) => {
          const firstImage = product?.thumbnail ?? product?.images?.[0]?.path;

          const discountArray = product?.variations?.filter(p => p?.has_discount);
          const defaultVariations = product?.variations[0];
          const hasDiscount = discountArray?.length > 0;

          const finalPrice = hasDiscount ? discountArray[0]?.final_price : defaultVariations?.final_price;
          const sellingPrice = hasDiscount ? discountArray[0]?.selling_price : defaultVariations?.selling_price;

          return (
            <div key={product.id}>
              <div className="block min-[501px]:hidden">
                <ProductCardMobile
                  href={`/products/${product?.slug}/${product?.id}/`}
                  title={getLocalName(product?.name ?? "", product?.name_bd, language)}
                  isFavorite={product?.is_favourite}
                  price={finalPrice ?? 0}
                  oldPrice={sellingPrice ?? 0}
                  imageSrc={firstImage}
                  priority={idx < 4}
                  onQuickAdd={() => handleOpenQuickAdd(product?.id)}
                  onWishlist={() => { handleFavoriteClick(product as unknown as ProductDetail); }}
                />
              </div>

              <div className="hidden min-[501px]:block">
                <ProductCard
                  href={`/products/${product?.slug}/${product?.id}/`}
                  title={getLocalName(product?.name ?? "", product?.name_bd, language)}
                  isFavorite={product?.is_favourite}
                  price={finalPrice ?? 0}
                  oldPrice={sellingPrice ?? 0}
                  imageSrc={firstImage}
                  priority={idx < 4}
                  onQuickAdd={() => handleOpenQuickAdd(product?.id)}
                  onWishlist={() => { handleFavoriteClick(product as unknown as ProductDetail); }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center mt-10 sm:mt-20">
        <Button
          type="button"
          onClick={() => router?.push("/category/all-products")}
          className="h-8 w-40 rounded-none bg-black border border-transparent text-white transition-colors duration-300 hover:bg-white/80 hover:text-black hover:border-black"
        >
          {t("home.featureProducts.viewAllProducts")}
        </Button>
      </div>
    </section>
  );
};

export default FeatureProducts;
