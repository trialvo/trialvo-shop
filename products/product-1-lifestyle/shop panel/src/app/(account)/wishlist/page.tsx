"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart, ArrowRight,
  Home, ChevronRight,
} from "lucide-react";
import { useAppDispatch } from "@/store";
import { addItem } from "@/store/slices/cartSlice";
import { openQuickView } from "@/store/slices/uiSlice";
import { toast } from "sonner";
import { ConfirmationModal, AuthGuard, PageShell } from "@/components/shared";
import {
  EmptyWishlist,
  WishlistErrorState,
  WishlistLoadingGrid,
  WishlistProductGrid,
} from "@/components/wishlist";
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { useCartProductIds } from "@/hooks/useCartProductIds";
import type { WishlistProduct } from "@/lib/wishlist/normalizers";

/* ── Main page ──────────────────────────────────────────────────────── */
export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();
  const cartProductIds = useCartProductIds();
  const {
    products: items,
    isLoading,
    isError,
    refetch,
    removeFavorite,
    isRemoving,
  } = useWishlist({
    enabled: isAuthenticated,
    userKey: user?.id ?? "current",
  });
  const [removeTarget, setRemoveTarget] = useState<number | null>(null);

  const handleAddToCart = (product: WishlistProduct) => {
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
      size: product.sizes[0] || "One Size",
      color: product.colors[0]?.name || "Default",
      image: product.image,
      quantity: 1,
      stock: product.stock,
      slug: product.slug,
      weight_kg: product.weightKg,
      freeDelivery: product.freeDelivery,
    }));
    toast.success(`${product.name} added to cart`);
  };

  const handleConfirmRemove = () => {
    if (removeTarget === null || isRemoving) return;

    void removeFavorite(removeTarget)
      .then(() => {
        toast.success("Removed from wishlist");
      })
      .catch((error: unknown) => {
        const message = error instanceof Error
          ? error.message
          : "Failed to remove from wishlist";
        toast.error(message);
      })
      .finally(() => {
        setRemoveTarget(null);
      });
  };

  if (!isAuthenticated) {
    return (
      <AuthGuard
        icon={Heart}
        heading="Sign in to view your wishlist"
        description="Save your favourite items and access them anytime, anywhere."
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageShell>

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground mb-6">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <Home size={12} /> Home
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-foreground font-medium">Wishlist</span>
        </nav>

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sale/10 dark:bg-sale/10 flex items-center justify-center shrink-0">
              <Heart size={18} className="text-sale fill-sale" />
            </div>
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold tracking-wide text-foreground leading-tight">
                My Wishlist
              </h1>
              <p className="text-[12px] text-muted-foreground tracking-wide mt-0.5">
                {items.length === 0
                  ? "No saved items yet"
                  : `${items.length} item${items.length !== 1 ? "s" : ""} saved`}
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <Link
              href="/shop"
              className="hidden sm:flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-accent hover:text-accent/80 font-semibold transition-colors border border-accent/30 hover:border-accent/60 px-4 py-2 rounded-full hover:bg-accent/5 cursor-pointer"
            >
              Continue Shopping <ArrowRight size={11} />
            </Link>
          )}
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <WishlistLoadingGrid />
        ) : isError ? (
          <WishlistErrorState onRetry={() => void refetch()} />
        ) : items.length === 0 ? (
          <EmptyWishlist />
        ) : (
          <WishlistProductGrid
            products={items}
            cartProductIds={cartProductIds}
            onRemove={setRemoveTarget}
            onAddToCart={handleAddToCart}
            onQuickView={(product) => dispatch(openQuickView(product.id))}
            onAddAllToCart={() => {
              items.forEach((product) => handleAddToCart(product));
              toast.success(`${items.length} items added to cart`);
            }}
          />
        )}
      </PageShell>

      {/* ── Confirm remove modal ── */}
      <ConfirmationModal
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        title="Remove from Wishlist?"
        message="This item will be removed from your wishlist. You can always add it back later."
        confirmLabel="Remove"
        variant="danger"
        loading={isRemoving}
      />
    </div>
  );
}
