"use client";

import FeatureProductsSkeleton from "@/app/(feature-products)/FeatureProductsSkeleton";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import ProductDetails from "@/components/product-details/ProductDetails";
import ProductExtraSectionsSkeleton from "@/components/product-details/skeleton/ProductExtraSectionsSkeleton";
import ProductGallerySkeleton from "@/components/product-details/skeleton/ProductGallerySkeleton";
import ProductInfoPanelSkeleton from "@/components/product-details/skeleton/ProductInfoPanelSkeleton";
import { useProduct } from "@/hooks/useProduct";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import RelatedProducts from "./RelatedProducts";

type Props = {
  slug: string;
  id: number | string;
};

const ProductDetailsPageSkeleton: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="w-full">
      <Breadcrumbs items={[{ label: t("breadcrumb.home"), href: "/" }, { label: t("common.loading") }]} />

      <div className="sm:mt-4 mb-4 sm:mb-10 grid grid-cols-1 gap-4 sm:gap-15 md:grid-cols-12">
        <div className="md:col-span-6">
          <ProductGallerySkeleton />
        </div>

        <div className="md:col-span-6">
          <ProductInfoPanelSkeleton />
        </div>
      </div>

      <ProductExtraSectionsSkeleton />
    </div>
  );
};

export default function ProductPageClient({ slug, id }: Props): React.ReactElement {
  const { useProductById } = useProduct(undefined, { enabled: false });
  const { t } = useTranslation();

  const productId = React.useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [id]);

  const {
    data: productDetail,
    isLoading,
    isError,
  } = useProductById(productId);

  if (isLoading) {
    return (
      <>
        <ProductDetailsPageSkeleton />
        <FeatureProductsSkeleton />
      </>
    );
  }

  if (isError || !productDetail) {
    return (
      <div className="py-10 text-center">
        <p className="text-base font-medium">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <>
      <ProductDetails
        product={productDetail}
        breadcrumbCategoryLabel="Men's Fashion"
        breadcrumbCategoryHref="/category/mens-fashion"
      />
      <RelatedProducts relatedProducts={productDetail?.related_products ?? []} />
    </>
  );
}
