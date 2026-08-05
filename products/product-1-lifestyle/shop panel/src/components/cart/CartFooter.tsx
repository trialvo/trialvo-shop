interface CartFooterProps {
  subtotal: number;
  onCheckout: () => void;
  onClose: () => void;
}

/**
 * Cart drawer footer: subtotal display + Checkout button + Continue Shopping link.
 */
export function CartFooter({ subtotal, onCheckout, onClose }: CartFooterProps) {
  return (
    <div className="border-t border-border bg-background px-5 sm:px-6 py-4 sm:py-5 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="text-lg font-semibold font-display text-foreground">${subtotal}</span>
      </div>
      <button
        type="button"
        onClick={onCheckout}
        className="w-full bg-primary hover:bg-accent hover:text-accent-foreground text-primary-foreground py-3.5 text-xs tracking-[0.2em] uppercase font-medium transition-all duration-200 rounded active:scale-[0.98]"
      >
        Checkout
      </button>
      <button
        type="button"
        onClick={onClose}
        className="w-full mt-2 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground text-center py-2 transition-colors"
      >
        Continue Shopping
      </button>
    </div>
  );
}
