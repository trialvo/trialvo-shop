"use client";

import FeatureProductHeader from "@/components/product-view-header/FeatureProductHeader";
import ProductCard from "@/components/product/ProductCard";
import ProductCardMobile from "@/components/product/ProductCardMobile";
import { useHandleFavoriteClick } from "@/hooks/useHandleFavoriteClick";
import { useTranslation } from "@/hooks/useTranslation";
import { RelatedProduct } from "@/lib/api/product/service";
import { getLocalName } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import { openModal } from "@/redux/slices/modalManagerSlice";
import * as React from "react";
import { FiSearch } from "react-icons/fi";

type Props = {
  relatedProducts: RelatedProduct[];
};

const RelatedProducts: React.FC<Props> = ({ relatedProducts }) => {
  const dispatch = useAppDispatch();
  const handleFavoriteClick = useHandleFavoriteClick();
  const { language } = useTranslation();

  const handleOpenQuickAdd = (id: number) => {
    dispatch(
      openModal({
        key: "quickAdd",
        payload: {
          id
        },
      }),
    );
  };

  return (
    <section className="container mx-auto mb-15.5">
      <FeatureProductHeader title="Related Products" />

      {relatedProducts?.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:gap-y-15 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {relatedProducts?.map((product) => {
            const imagePath = product.image ?? null;

            const discountArray = product?.variations?.filter(p => p?.discount_type === 0);
            const defaultVariations = product?.variations[0];

            const hasDiscount = discountArray?.length > 0;

            const finalPrice = hasDiscount ? discountArray[0]?.final_price : defaultVariations?.final_price;
            const sellingPrice = hasDiscount ? discountArray[0]?.selling_price : defaultVariations?.selling_price;

            return (
              <div key={product.id}>
                <div className="block min-[501px]:hidden">
                  <ProductCardMobile
                    isFavorite={product?.is_favourite}
                    href={`/products/${product?.slug}/${product?.id}/`}
                    title={getLocalName(product.name, product.name_bd, language)}
                    price={finalPrice ?? 0}
                    oldPrice={sellingPrice ?? 0}
                    imageSrc={imagePath ?? "/pant.png"}
                    onQuickAdd={() => handleOpenQuickAdd(product?.id)}
                    onWishlist={() => { handleFavoriteClick(product) }}
                  />
                </div>

                <div className="hidden min-[501px]:block">
                  <ProductCard
                    isFavorite={product?.is_favourite}
                    href={`/products/${product?.slug}/${product?.id}/`}
                    title={getLocalName(product.name, product.name_bd, language)}
                    price={finalPrice ?? 0}
                    oldPrice={sellingPrice ?? 0}
                    imageSrc={imagePath ?? "/pant.png"}
                    onQuickAdd={() => handleOpenQuickAdd(product?.id)}
                    onWishlist={() => { handleFavoriteClick(product) }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-black/10 bg-white py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/5">
            <FiSearch className="h-7 w-7 text-black/60" />
          </div>

          <h3 className="mt-4 text-base font-semibold text-black">No products found</h3>
        </div>
      )}
    </section>
  );
};

export default RelatedProducts;
