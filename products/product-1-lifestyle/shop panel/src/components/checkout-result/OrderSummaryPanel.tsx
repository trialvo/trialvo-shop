"use client";

import Image from "next/image";
import type {
  CheckoutOrderItem,
  CheckoutOrderMeta,
  CheckoutOrderTotals,
} from "@/types/checkout-result";

interface OrderSummaryPanelProps {
  meta: CheckoutOrderMeta;
  items: CheckoutOrderItem[];
  totals: CheckoutOrderTotals;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

const META_LABELS: Array<{ key: keyof CheckoutOrderMeta; label: string }> = [
  { key: "date", label: "Date" },
  { key: "orderId", label: "Order ID" },
  { key: "paymentMethod", label: "Payment" },
];

const formatCurrency = (value: number): string =>
  `৳${value.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

type TotalLine = { label: string; value: number; isNegative?: boolean };

const buildTotalLines = (t: CheckoutOrderTotals): TotalLine[] => {
  const lines: TotalLine[] = [
    { label: "Subtotal", value: t.subtotal },
    { label: "Delivery", value: t.delivery },
  ];

  if (t.discount > 0) lines.push({ label: "Discount", value: t.discount, isNegative: true });
  if (t.couponDiscount && t.couponDiscount > 0) lines.push({ label: "Coupon", value: t.couponDiscount, isNegative: true });
  if (t.bulkDiscount && t.bulkDiscount > 0) lines.push({ label: "Bulk Discount", value: t.bulkDiscount, isNegative: true });
  if (t.comboDiscount && t.comboDiscount > 0) lines.push({ label: "Combo Discount", value: t.comboDiscount, isNegative: true });
  if (t.cartWideDiscount && t.cartWideDiscount > 0) lines.push({ label: "Cart Discount", value: t.cartWideDiscount, isNegative: true });
  if (t.weightSurcharge && t.weightSurcharge > 0) {
    const weightLabel = t.weightKg ? `Weight (${t.weightKg}kg)` : "Weight Surcharge";
    lines.push({ label: weightLabel, value: t.weightSurcharge });
  }

  return lines;
};

/* ── Component ───────────────────────────────────────────────────────── */

/**
 * Right-column order summary panel — sticky on desktop, with gradient
 * header, polished item cards, and discount badge styling.
 */
export function OrderSummaryPanel({ meta, items, totals }: OrderSummaryPanelProps) {
  const totalLines = buildTotalLines(totals);

  return (
    <aside className="w-full lg:w-[400px] shrink-0 lg:sticky lg:top-6 lg:self-start">
      <div className="rounded-2xl border border-border/60 bg-background overflow-hidden">
        {/* ── Gradient header ──────────────────────────────── */}
        <div className="bg-gradient-to-r from-secondary via-secondary/60 to-secondary/30 px-5 py-4">
          <h2 className="text-[11px] font-semibold tracking-[0.18em] uppercase text-foreground/70">
            Order Summary
          </h2>
        </div>

        <div className="p-5 space-y-5">
          {/* ── Meta row ───────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 pb-4 border-b border-border/40">
            {META_LABELS.map(({ key, label }) => (
              <div key={key}>
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">
                  {label}
                </p>
                <p className="text-[12.5px] font-semibold text-foreground mt-1 truncate">
                  {meta[key]}
                </p>
              </div>
            ))}
          </div>

          {/* ── Items ──────────────────────────────────────── */}
          {items.length > 0 && (
            <div className="space-y-2.5 pb-4 border-b border-border/40">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-xl hover:bg-secondary/40 transition-colors"
                >
                  <div className="relative w-12 h-12 rounded-xl border border-border/40 overflow-hidden bg-secondary shrink-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                    {item.quantity > 1 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {item.quantity}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-foreground leading-tight truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Qty: {item.quantity}
                      {item.oldPrice !== undefined && item.oldPrice > item.price && (
                        <span className="ml-2 line-through text-muted-foreground/40">
                          {formatCurrency(item.oldPrice)}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-[12.5px] font-semibold text-foreground shrink-0">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── Totals ─────────────────────────────────────── */}
          <div className="space-y-2.5">
            {totalLines.map(({ label, value, isNegative }) => (
              <div key={label} className="flex justify-between items-center text-[12.5px]">
                <span className="text-muted-foreground">{label}</span>
                {isNegative ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[11px] font-semibold">
                    −{formatCurrency(value)}
                  </span>
                ) : (
                  <span className="text-foreground font-medium">
                    {formatCurrency(value)}
                  </span>
                )}
              </div>
            ))}

            {/* Grand total */}
            <div className="flex justify-between items-center pt-3 border-t border-border/40">
              <span className="text-sm font-semibold text-foreground tracking-wide">
                Total
              </span>
              <span className="text-base font-bold text-foreground">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
