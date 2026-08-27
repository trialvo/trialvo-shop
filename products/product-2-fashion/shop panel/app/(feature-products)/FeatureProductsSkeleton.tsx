import * as React from "react";

import FeatureProductHeaderSkeleton from "@/components/product-view-header/FeatureProductHeaderSkeleton";
import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

export default function FeatureProductsSkeleton(): React.ReactElement {
  const items = Array.from({ length: 10 });

  return (
    <section className="container mx-auto mb-15.5">
      <FeatureProductHeaderSkeleton />

      <div className="grid grid-cols-2 gap-3 sm:gap-y-15 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {items.map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
