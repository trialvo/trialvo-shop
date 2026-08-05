"use client";

import Link from "next/link";
import { Check, Eye, Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { useFavorite } from "@/hooks/useFavorite";
import { useCartProductIds } from "@/hooks/useCartProductIds";
import { useAppDispatch, useAppSelector } from "@/store";
import { addItem } from "@/store/slices/cartSlice";
import { openQuickView } from "@/store/slices/uiSlice";
import { selectIsInWishlist } from "@/store/slices/wishlistSlice";
import type { MegaSaleProduct } from "@/lib/mega-sale/normalizers";

interface MegaSaleProductCardProps {
  product: MegaSaleProduct;
}

export function MegaSaleProductCard({ product }: MegaSaleProductCardProps) {
  const dispatch = useAppDispatch();
  const { toggleFavorite } = useFavorite();
  const inWishlist = useAppSelector(selectIsInWishlist(product.id));
  const cartProductIds = useCartProductIds();
  const isInCart = cartProductIds.has(product.id);
  const size = product.sizes[0] || "One Size";
  const color = product.colors[0]?.name || "Default";

  const handleAddToCart = () => {
    if (!product.inStock || product.stock <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    if (!Number.isFinite(product.productVariationId) || product.productVariationId <= 0) {
      toast.error("This product variation is unavailable");
      return;
    }

    dispatch(addItem({
      productId: String(product.id),
      productVariationId: product.productVariationId,
      title: product.name,
      price: product.salePrice,
      originalPrice: product.originalPrice,
      size,
      color,
      image: product.image,
      quantity: 1,
      stock: product.stock,
      slug: product.slug,
    }));
    toast.success("Added to cart");
  };

  const handleToggleWishlist = () => {
    void toggleFavorite(product.id, inWishlist)
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
  };

  return (
    <div className="group relative bg-card border border-border overflow-hidden">
      <Link href={`/product/${product.slug}`}>
        <div className="aspect-[3/4] overflow-hidden relative">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            <span className="bg-destructive text-destructive-foreground text-[10px] tracking-wider uppercase px-2.5 py-1 font-bold">-{product.discount}%</span>
            {product.badge && <span className="bg-accent text-accent-foreground text-[10px] tracking-wider uppercase px-2.5 py-1 font-medium">{product.badge}</span>}
          </div>
          {/* Quick view on hover */}
          <div className="absolute inset-x-0 bottom-0 p-3 flex justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button onClick={(event) => { event.preventDefault(); dispatch(openQuickView(product.id)); }} className="w-9 h-9 rounded-full bg-background/90 hover:bg-accent hover:text-accent-foreground flex items-center justify-center shadow-md transition-colors active:scale-95">
              <Eye size={15} />
            </button>
          </div>
        </div>
      </Link>
      <button onClick={handleToggleWishlist} className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${inWishlist ? "bg-destructive text-destructive-foreground" : "bg-background/80 backdrop-blur-sm text-foreground hover:bg-background"}`}>
        <Heart size={14} fill={inWishlist ? "currentColor" : "none"} />
      </button>
      <div className="p-4">
        <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">{product.category}</p>
        <h3 className="text-sm font-medium text-foreground mb-2 line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-destructive">${product.salePrice}</span>
          <span className="text-xs text-muted-foreground line-through">${product.originalPrice}</span>
        </div>
        <button onClick={isInCart ? undefined : handleAddToCart} className={`w-full flex items-center justify-center gap-2 py-2.5 text-[10px] tracking-[0.15em] uppercase font-medium transition-colors ${isInCart ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground"}`}>
          {isInCart ? <><Check size={13} /> In Cart</> : <><ShoppingBag size={13} /> Add to Cart</>}
        </button>
      </div>
    </div>
  );
}
