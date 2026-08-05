"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShoppingBag } from "lucide-react";
import ConfirmationModal from "@/components/shared/ConfirmationModal";
import { CartItemRow, CartFooter } from "@/components/cart";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useAppSelector, useAppDispatch } from "@/store";
import { selectCartItems, selectTotalItems, selectSubtotal, removeItem, clearCart } from "@/store/slices/cartSlice";
import type { CartItem } from "@/types";
import { toast } from "sonner";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type RemoveTarget = Pick<CartItem, "id" | "size" | "color" | "title">;

const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const totalItems = useAppSelector(selectTotalItems);
  const subtotal = useAppSelector(selectSubtotal);
  const router = useRouter();
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);

  useBodyScrollLock(isOpen);

  const handleRemoveRequest = useCallback((item: RemoveTarget) => {
    setRemoveTarget(item);
  }, []);

  const handleCheckout = () => {
    onClose();
    router.push("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-background z-[60] shadow-2xl transition-transform duration-300 ease-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-foreground" />
            <h2 className="font-display text-lg font-semibold tracking-wider uppercase text-foreground">Your Cart</h2>
            <span className="text-xs text-muted-foreground">({totalItems})</span>
          </div>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="text-[10px] tracking-[0.15em] uppercase text-destructive hover:text-destructive/80 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors active:scale-90"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag size={48} className="text-muted-foreground/20 mb-4" />
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 text-xs tracking-[0.15em] uppercase text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, idx) => (
                <CartItemRow
                  key={`${item.id}-${item.size}-${item.color}`}
                  item={item}
                  animationDelay={idx * 50}
                  onClose={onClose}
                  onRemove={handleRemoveRequest}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <CartFooter subtotal={subtotal} onCheckout={handleCheckout} onClose={onClose} />
        )}
      </div>

      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={() => { dispatch(clearCart()); toast.success("Cart cleared"); }}
        title="Clear Cart?"
        message="All items will be removed from your cart. This cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
      />

      <ConfirmationModal
        isOpen={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) {
            dispatch(removeItem({ id: removeTarget.id }));
            toast.success(`${removeTarget.title} removed from cart`);
          }
        }}
        title="Remove Item?"
        message={removeTarget ? `Remove "${removeTarget.title}" from your cart?` : ""}
        confirmLabel="Remove"
        variant="danger"
      />
    </>
  );
};

export default CartDrawer;
