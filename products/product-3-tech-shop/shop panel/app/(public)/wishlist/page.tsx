"use client";

import Layout from "@/components/layout/Layout";
import { useWishlistProducts } from "@/hooks/useWishlistProducts";
import ProductCard from "@/components/product/ProductCard";
import { ProductCardsSkeleton } from "@/components/product/ProductCardsSkeleton";
import { Heart } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import Link from "next/link";

export default function WishlistPage() {
  const { products, count, isLoading } = useWishlistProducts({ limit: 50 });

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-heading text-2xl md:text-3xl font-bold mb-8">
          My Wishlist ({isLoading ? "…" : count})
        </h1>

        {isLoading ? (
          <ProductCardsSkeleton
            count={4}
            className="gap-4 md:gap-6"
            label="Loading wishlist"
          />
        ) : count === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-20 w-20 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Your wishlist is empty</p>
            <AppButton asChild className="mt-4">
              <Link href="/shop">Browse Products</Link>
            </AppButton>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
