"use client";

/**
 * SingleOrderPageClient.tsx — Client component for SOP product page
 *
 * Composes all SOP product components with hooks for state management.
 */

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useSingleOrderProduct } from "@/hooks/useSingleOrderProduct";
import { useSingleOrderCart, SOP_CART_KEY } from "@/hooks/useSingleOrderCart";
import {
  SOPHeader,
  SOPProductGallery,
  SOPProductInfo,
  SOPVariantSelector,
  SOPBulkOffers,
  SOPQuantitySelector,
  SOPMiniCart,
  SOPMobileBottomBar,
  SOPLoadingSkeleton,
  SOPErrorState,
} from "@/components/single-order";

interface Props {
  slug: string;
  id: string;
}

export default function SingleOrderPageClient({ slug, id }: Props) {
  const router = useRouter();
  const productId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [id]);

  // Selection state
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [initialized, setInitialized] = useState(false);

  // Product hook
  const {
    product,
    isLoading,
    error,
    selectedSku,
    filteredImages,
    skuBulkOffers,
    unitPrice,
  } = useSingleOrderProduct(productId, selectedColorId, selectedVariantId);

  // Initialize selections from first variation when product loads
  if (product && !initialized) {
    const v0 = product.variations[0];
    if (v0?.color?.id && selectedColorId === null) setSelectedColorId(v0.color.id);
    if (v0?.variant?.id && selectedVariantId === null) setSelectedVariantId(v0.variant.id);
    setInitialized(true);
  }

  // Cart hook
  const cart = useSingleOrderCart(
    product?.id ?? 0,
    product?.name ?? "",
    product?.images[0]?.path ?? "",
    product?.free_delivery ?? false,
    product?.bulk_offers ?? [],
  );

  // Add to cart handler
  const handleAddToCart = useCallback(() => {
    if (!selectedSku || !product) return;
    cart.addToCart(selectedSku, qty, unitPrice);
    setQty(1);
  }, [selectedSku, product, cart, qty, unitPrice]);

  // Proceed to checkout
  const handleCheckout = useCallback(() => {
    if (!product || cart.items.length === 0) return;
    // Persist full cart to sessionStorage for checkout page
    const cartPayload = cart.getCartPayload();
    sessionStorage.setItem(SOP_CART_KEY, JSON.stringify(cartPayload));
    router.push(`/single-order-page/${slug}/${id}/checkout`);
  }, [product, cart, slug, id, router]);

  // ── Render ─────────────────────────────────────────────────────────────

  if (isLoading) return <SOPLoadingSkeleton />;
  if (error || !product) return <SOPErrorState message={error ?? undefined} />;

  return (
    <div className="min-h-screen bg-background">
      <SOPHeader />

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        {/* Product Top: Gallery + Info */}
        <div className="sm:mt-4 mb-4 sm:mb-10 grid grid-cols-1 gap-4 sm:gap-10 md:grid-cols-12">
          <SOPProductGallery
            images={filteredImages}
            productName={product.name}
            selectedColorId={selectedColorId}
          />

          <div className="relative col-span-12 md:col-span-6">
            <div className="space-y-5">
              <SOPProductInfo
                product={product}
                selectedSku={selectedSku}
                unitPrice={unitPrice}
              />

              <SOPVariantSelector
                colors={product.available_colors}
                variants={product.available_variants}
                selectedColorId={selectedColorId}
                selectedVariantId={selectedVariantId}
                selectedSku={selectedSku}
                onColorChange={setSelectedColorId}
                onVariantChange={setSelectedVariantId}
              />

              <SOPBulkOffers offers={skuBulkOffers} currentQty={qty} />

              <SOPQuantitySelector
                qty={qty}
                maxStock={selectedSku?.stock ?? 99}
                onDecrease={() => setQty((q) => Math.max(1, q - 1))}
                onIncrease={() =>
                  setQty((q) => Math.min(selectedSku?.stock ?? 99, q + 1))
                }
              />

              {/* Add to Order */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!selectedSku || selectedSku.stock === 0}
                  className="h-10 flex-1 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
                >
                  Add to Order +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Cart */}
        <SOPMiniCart
          items={cart.items}
          total={cart.miniCartTotal}
          onUpdateQty={cart.updateCartQty}
          onRemove={cart.removeFromCart}
          onCheckout={handleCheckout}
        />

        {/* Description */}
        {product.long_description && (
          <section className="w-full">
            <div className="py-2.5 border-b border-border">
              <h3 className="text-base font-medium text-foreground">
                Description
              </h3>
            </div>
            <div
              className="mt-4 space-y-6 text-sm leading-6 text-muted-foreground prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.long_description }}
            />
          </section>
        )}

        {/* Shipping Policy */}
        <section className="w-full pt-10">
          <div className="py-2.5 border-b border-border">
            <h3 className="text-base font-medium text-foreground">
              Shipping Policy
            </h3>
          </div>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <p>
              Free delivery across Bangladesh is available only on eligible
              orders. Delivery within 2-3 working days inside Dhaka, 3-5
              working days outside Dhaka.
            </p>
            <p>
              Delivery charge: ৳80 inside Dhaka and ৳150 outside Dhaka. If the
              order is not accepted at the time of delivery, this charge must be
              paid.
            </p>
            <p className="rounded border border-border bg-secondary px-4 py-3 font-medium text-foreground">
              Additional Note: If the product weight exceeds 1kg, an extra
              charge of ৳30 per additional kg will be applied.
            </p>
          </div>
        </section>

        {/* Sticky Bottom Bar (mobile) */}
        {cart.items.length > 0 && (
          <SOPMobileBottomBar
            itemCount={cart.items.length}
            total={cart.miniCartTotal}
            onCheckout={handleCheckout}
          />
        )}
      </section>
    </div>
  );
}
