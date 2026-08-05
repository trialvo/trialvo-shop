"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import { CartDrawerEmpty } from "@/components/cart/CartDrawerEmpty";
import { CartDrawerFooter } from "@/components/cart/CartDrawerFooter";
import { CartDrawerHeader } from "@/components/cart/CartDrawerHeader";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuthContext } from "@/context/AuthContext";
import { useCart } from "@/hooks/useCart";
import { syncGuestCartOrder } from "@/lib/guest-order/syncGuestCart";
import { cartLineKey } from "@/store/cart/cartLine";

/**
 * Slide-over cart — edit lines, clear all (confirmed), checkout.
 * Coupon lives on the cart / checkout pages only.
 */
export default function CartDrawer(): ReactElement {
  const router = useRouter();
  const auth = useAuthContext();
  const {
    items,
    isCartOpen,
    setIsCartOpen,
    totalPrice,
    totalItems,
  } = useCart();
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const hasItems = items.length > 0;

  const closeDrawer = () => setIsCartOpen(false);

  const handleCheckout = async () => {
    closeDrawer();
    if (!auth.isAuthenticated && items.length > 0) {
      setCheckoutBusy(true);
      try {
        await syncGuestCartOrder(items);
      } catch {
        /* checkout page will retry sync */
      } finally {
        setCheckoutBusy(false);
      }
    }
    router.push("/checkout");
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md">
        <CartDrawerHeader totalItems={totalItems} hasItems={hasItems} />

        {!hasItems ? (
          <CartDrawerEmpty onContinue={closeDrawer} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              <ul className="space-y-2.5" aria-label="Cart items">
                {items.map((item) => (
                  <li
                    key={cartLineKey(
                      item.product.id,
                      item.productVariationId,
                    )}
                  >
                    <CartLineItem
                      item={item}
                      variant="drawer"
                      allowEdit={false}
                    />
                  </li>
                ))}
              </ul>
            </div>

            <CartDrawerFooter
              totalPrice={totalPrice}
              checkoutBusy={checkoutBusy}
              onViewCart={closeDrawer}
              onCheckout={() => void handleCheckout()}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
