"use client";

import type { ReactElement } from "react";
import { WishlistItemCard } from "@/components/account/wishlist/WishlistItemCard";
import { toWishlistItemViewModel } from "@/lib/adapters/accountWishlist";
import type { Product } from "@/data/products";

type WishlistGridProps = Readonly<{
  products: Product[];
}>;

export function WishlistGrid({ products }: WishlistGridProps): ReactElement {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {products.map((product) => (
        <WishlistItemCard
          key={product.id}
          item={toWishlistItemViewModel(product)}
        />
      ))}
    </div>
  );
}
