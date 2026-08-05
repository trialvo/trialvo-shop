"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import React from "react";

import ProductExtraSections from "./extra/ProductExtraSections";
import ProductGallery from "./ProductGallery";
import ProductInfoPanel from "./ProductInfoPanel";

import type { ProductDetail } from "@/lib/api/product/service";
import { useTranslation } from "@/hooks/useTranslation";
import ReviewSection from "@/components/review/ReviewSection";

type Props = {
  product: ProductDetail;
  breadcrumbCategoryLabel?: string;
  breadcrumbCategoryHref?: string;
};

const ProductDetails: React.FC<Props> = ({
  product,
  breadcrumbCategoryLabel = "Men's Fashion",
  breadcrumbCategoryHref = "/category/mens-fashion",
}) => {
  const { t } = useTranslation();

  // Lifted from ProductInfoPanel so ProductGallery can filter by color AND size
  const [selectedColorId, setSelectedColorId] = React.useState<number>(0);
  const [selectedVariantId, setSelectedVariantId] = React.useState<number>(0);

  // Reset when product changes
  React.useEffect(() => {
    setSelectedColorId(0);
    setSelectedVariantId(0);
  }, [product?.id]);

  return (
    <div className="w-full">
      <Breadcrumbs
        items={[
          { label: t("breadcrumb.home"), href: "/" },
          { label: breadcrumbCategoryLabel, href: breadcrumbCategoryHref },
        ]}
      />

      <div className="sm:mt-4 mb-4 sm:mb-10 grid grid-cols-1 gap-4 sm:gap-15 md:grid-cols-12">
        <ProductGallery
          images={product?.images ?? []}
          selectedColorId={selectedColorId}
          selectedVariantId={selectedVariantId}
        />
        <ProductInfoPanel
          product={product}
          onColorChange={(colorId) => {
            setSelectedColorId(colorId);
            setSelectedVariantId(0); // reset size filter when switching colors
          }}
          onVariantChange={setSelectedVariantId}
        />
      </div>

      <ProductExtraSections
        data={{
          description: product?.long_description ?? "",
          shippingPolicy: [
            "Free delivery across Bangladesh is available only on eligible orders, depending on product type, delivery location, or ongoing campaign conditions. To confirm whether your order qualifies for free delivery, please contact our customer support team before placing the order. Orders are usually processed within 24 hours and delivered within 2–3 working days inside Dhaka and 3–5 working days outside Dhaka. Delivery times may vary during holidays or special campaigns.",
            "Delivery charge: ৳80 inside Dhaka and ৳150 outside Dhaka. If the order is not accepted at the time of delivery, this charge must be paid.",
            "Additional Note: If the product weight exceeds 1kg, an extra charge of ৳30 per additional kg will be applied.",
            "For delivery questions or order support, please contact our customer service team.",
          ].join("\n\n"),
        }}
      />

      {product?.id && <ReviewSection productId={product.id} />}
    </div>
  );
};

export default ProductDetails;
