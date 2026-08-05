"use client";

import Link from "next/link";
import { useMemo, useState, type ReactElement } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { CartClearConfirmDialog } from "@/components/cart/CartClearConfirmDialog";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CheckoutCouponField } from "@/components/checkout/CheckoutCouponField";
import { AppButton } from "@/components/shared/AppButton";
import { useAuthContext } from "@/context/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useDelivery } from "@/hooks/useDelivery";
import { readAppliedCoupon } from "@/lib/checkout/couponSession";
import { cartLineKey } from "@/store/cart/cartLine";

export default function CartPage(): ReactElement {
  const { items, totalPrice, totalItems, clearCart } = useCart();
  const { deliveryCharges, deliveryLoading } = useDelivery();
  const { user } = useAuthContext();
  const [couponTick, setCouponTick] = useState(0);
  const [clearOpen, setClearOpen] = useState(false);

  const applied = useMemo(() => {
    void couponTick;
    return readAppliedCoupon();
  }, [couponTick]);

  // Estimate: lowest active delivery charge (actual fee chosen at checkout)
  const shippingEstimate = useMemo(() => {
    if (!deliveryCharges.length) return null;
    const amounts = deliveryCharges
      .map((c) => Number(c.customer_charge) || 0)
      .filter((n) => Number.isFinite(n));
    if (!amounts.length) return null;
    return Math.min(...amounts);
  }, [deliveryCharges]);

  const couponDiscount = applied?.discountAmount ?? 0;
  const shippingFee = shippingEstimate ?? 0;
  const grandTotal = Math.max(0, totalPrice + shippingFee - couponDiscount);

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h1 className="font-heading text-xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Add some products to get started
          </p>
          <AppButton asChild className="mt-5 rounded-sm">
            <Link href="/shop">Continue Shopping</Link>
          </AppButton>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-xl md:text-3xl font-bold">
            Shopping Cart
            <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
              ({totalItems} {totalItems === 1 ? "item" : "items"})
            </span>
          </h1>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
            onClick={() => setClearOpen(true)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Clear all
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <CartLineItem
                key={cartLineKey(
                  item.product.id,
                  item.productVariationId,
                )}
                item={item}
                variant="page"
                allowEdit
              />
            ))}
          </div>

          <div className="bg-card rounded-sm border border-border p-5 h-fit sticky top-32">
            <h3 className="font-heading font-semibold text-base mb-3">
              Order Summary
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  ৳{totalPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {deliveryLoading
                    ? "…"
                    : shippingEstimate === null
                      ? "At checkout"
                      : shippingFee === 0
                        ? "Free"
                        : `from ৳${shippingFee.toLocaleString()}`}
                </span>
              </div>
              {couponDiscount > 0 ? (
                <div className="flex justify-between text-primary">
                  <span>Coupon</span>
                  <span className="tabular-nums">
                    −৳{couponDiscount.toLocaleString()}
                  </span>
                </div>
              ) : null}
              <CheckoutCouponField
                items={items}
                customerId={user?.id}
                onApplied={() => setCouponTick((n) => n + 1)}
                onCleared={() => setCouponTick((n) => n + 1)}
              />
              <div className="border-t border-border pt-2 flex justify-between font-heading font-semibold text-base">
                <span>Total</span>
                <span className="text-primary tabular-nums">
                  ৳{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
            <AppButton
              asChild
              fullWidth
              className="mt-4 font-semibold rounded-sm"
              size="lg"
            >
              <Link href="/checkout">Proceed to Checkout</Link>
            </AppButton>
            <AppButton
              asChild
              variant="outline"
              fullWidth
              className="mt-2 rounded-sm"
            >
              <Link href="/shop">Continue Shopping</Link>
            </AppButton>
          </div>
        </div>

        <CartClearConfirmDialog
          open={clearOpen}
          itemCount={totalItems}
          onOpenChange={setClearOpen}
          onConfirm={() => {
            clearCart();
            setClearOpen(false);
          }}
        />
      </div>
    </Layout>
  );
}
