"use client";

import {
  NewArrivalProductCard,
  type NewArrivalProduct,
} from "@/components/home/NewArrivalProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorite } from "@/hooks/useFavorite";
import { useCartProductIds } from "@/hooks/useCartProductIds";
import { useProduct } from "@/hooks/useProducts";
import type { ProductListItem } from "@/lib/api/product/service";
import { useAppDispatch, useAppSelector } from "@/store";
import { addItem } from "@/store/slices/cartSlice";
import { openQuickView } from "@/store/slices/uiSlice";
import {
  selectWishlistIds,
  setWishlistProductState,
} from "@/store/slices/wishlistSlice";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";

import { IMAGE_URL } from "@/config/env";

const toImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
  return `${IMAGE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const getPreferredVariation = (product: ProductListItem) =>
  product.variations?.find((variation) => variation.stock > 0) ??
  product.variations?.[0];

const normalizeNewArrival = (p: ProductListItem): NewArrivalProduct => {
  const preferredVariation = getPreferredVariation(p);
  const minPrice = p.price_range?.min ?? preferredVariation?.final_price ?? preferredVariation?.selling_price ?? 0;
  const maxPrice = p.price_range?.max ?? preferredVariation?.selling_price ?? minPrice;
  const mainImage = toImageUrl(p.thumbnail || p.images?.[0]?.path);
  const images = p.images?.map((image) => toImageUrl(image.path)).filter(Boolean) ?? [];
  const hasDiscount = p.price_range?.has_discount ?? false;
  const stock = preferredVariation?.stock ?? 0;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: minPrice,
    oldPrice: hasDiscount ? maxPrice : null,
    image: mainImage,
    images: images.length ? images : [mainImage],
    badge: p.featured ? "HOT" : hasDiscount ? "SALE" : null,
    category: "Fashion",
    description: "",
    details: [],
    sizes: [],
    colors: [],
    rating: p.avg_rating ?? 0,
    reviewCount: p.review_count ?? 0,
    inStock: stock > 0,
    productVariationId: preferredVariation?.id,
    stock,
    originalPrice: maxPrice,
  };
};

const NewArrivals = () => {
  const dispatch = useAppDispatch();
  const { toggleFavorite } = useFavorite();
  const cartProductIds = useCartProductIds();
  const wishlistIds = useAppSelector(selectWishlistIds);
  const wishlistedIds = useMemo(() => new Set(wishlistIds), [wishlistIds]);
  const { products: rawProducts, productsLoading: isLoading } = useProduct({
    limit: 8,
    sort_by: "created_at",
    sort_order: "DESC",
    status: true,
  });

  const products = useMemo(
    () => rawProducts.map((p: ProductListItem) => normalizeNewArrival(p)),
    [rawProducts],
  );

  useEffect(() => {
    rawProducts.forEach((product) => {
      dispatch(setWishlistProductState({
        productId: product.id,
        isFavorite: product.is_favourite === true,
      }));
    });
  }, [dispatch, rawProducts]);

  const handleToggleWishlist = useCallback(
    (product: NewArrivalProduct) => {
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

  const handleAddToCart = useCallback(
    (product: NewArrivalProduct) => {
      if (!product.inStock || product.stock <= 0) {
        toast.error("This product is out of stock");
        return;
      }

      if (!product.productVariationId) {
        toast.error("This product variation is unavailable");
        return;
      }

      dispatch(addItem({
        productId: String(product.id),
        productVariationId: product.productVariationId,
        title: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        size: "One Size",
        color: "Default",
        image: product.image,
        quantity: 1,
        stock: product.stock,
        slug: product.slug,
      }));
      toast.success(`${product.name} added to cart`);
    },
    [dispatch],
  );

  const handleQuickView = useCallback(
    (product: NewArrivalProduct) => {
      dispatch(openQuickView(product));
    },
    [dispatch],
  );

  return (
    <section className="w-full bg-background py-8 sm:py-10 lg:py-14">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="flex items-end justify-between mb-5 sm:mb-8">
          <div>
            <p className="text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.28em] uppercase text-accent font-semibold mb-1">
              Fresh Drops
            </p>
            <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-wide text-foreground">
              New Arrivals
            </h2>
            <p className="hidden sm:block text-muted-foreground text-sm mt-1 tracking-wide">
              Handpicked styles fresh this season
            </p>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-1.5 text-[10px] sm:text-[11px] tracking-[0.15em] sm:tracking-[0.18em] uppercase text-accent hover:text-accent/80 font-semibold transition-colors border border-accent/30 hover:border-accent/60 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-accent/5"
          >
            <span className="hidden xs:inline">View</span> All <ArrowRight size={10} />
          </Link>
        </div>

        {/* Product grid — xs: 2-col, md: 3-col, lg: 4-col */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-3/4 rounded-xl sm:rounded-2xl" />
                <Skeleton className="h-3.5 w-3/4 mt-3" />
                <Skeleton className="h-3 w-1/3 mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {products?.map((p) => (
              <NewArrivalProductCard
                key={p.id}
                product={p}
                isWishlisted={wishlistedIds.has(p.id)}
                isInCart={cartProductIds.has(p.id)}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
                onQuickView={handleQuickView}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default NewArrivals;
