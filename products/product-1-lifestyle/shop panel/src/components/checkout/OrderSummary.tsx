import type { CartItem, OrderType } from "@/types";

interface OrderSummaryProps {
  items: CartItem[];
  orderType: OrderType;
  subtotal: number;
  discount: number;
  discountRate: number;
  shipping: number;
  tax: number;
  total: number;
}

/**
 * Sticky checkout sidebar — item list + discount banner + totals breakdown.
 * Extracted from the lg:col-span-2 panel in checkout/page.tsx.
 */
export function OrderSummary({
  items,
  orderType,
  subtotal,
  discount,
  discountRate,
  shipping,
  tax,
  total,
}: OrderSummaryProps) {
  return (
    <div className="bg-secondary/50 rounded-lg p-6 sticky top-6">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4 tracking-wide">
        Order Summary
      </h3>

      {(orderType === "bulk" || orderType === "combo") && (
        <div className="mb-4 px-3 py-2 bg-accent/10 border border-accent/20 rounded text-xs text-accent font-medium tracking-wide uppercase">
          {orderType === "bulk" ? "Bulk offer pricing" : "Combo deal pricing"}
        </div>
      )}
      {orderType === "guest" && (
        <div className="mb-4 px-3 py-2 bg-secondary border border-border rounded text-xs text-muted-foreground tracking-wide">
          Guest order — tracked via unique GO- ID
        </div>
      )}

      {/* Item list */}
      <div className="space-y-4 mb-6">
        {items.map((item, idx) => (
          <div key={`${item.id}-${item.size}-${item.color}-${idx}`} className="flex gap-3">
            <div className="w-14 h-18 rounded overflow-hidden shrink-0 bg-secondary">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.size} · {item.color} · Qty {item.quantity}
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                ${item.price * item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-accent">
            <span>Discount ({Math.round(discountRate * 100)}%)</span>
            <span>-${discount}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping}`}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Tax (5%)</span><span>${tax}</span>
        </div>
        <div className="flex justify-between font-semibold text-foreground text-base pt-2 border-t border-border">
          <span>Total</span>
          <span className="font-display">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
