"use client";

/**
 * components/single-order/checkout/SOPOrderSummary.tsx
 *
 * Order summary sidebar showing items, delivery, discounts, and totals.
 */

import Image from "next/image";
import { X, Truck, ReceiptText, Percent, Scale } from "lucide-react";

import type { SOPMiniCartItem } from "@/types/single-order";
import { toSOPImageUrl } from "@/hooks/useSingleOrderProduct";

interface SOPOrderSummaryProps {
  items: SOPMiniCartItem[];
  productImage: string;
  subtotal: number;
  itemDiscount: number;
  deliveryAmount: number;
  weightExtraCharge: number;
  bulkDiscount: number;
  grandTotal: number;
  allFreeDelivery: boolean;
  hasMixedDelivery: boolean;
  paidWeightKg: number;
  onRemoveItem: (skuId: number) => void;
}

export function SOPOrderSummary({
  items,
  productImage,
  subtotal,
  itemDiscount,
  deliveryAmount,
  weightExtraCharge,
  bulkDiscount,
  grandTotal,
  allFreeDelivery,
  hasMixedDelivery,
  paidWeightKg,
  onRemoveItem,
}: SOPOrderSummaryProps) {
  return (
    <div className="lg:sticky lg:top-20 lg:self-start border border-border bg-card rounded">
      {/* Title */}
      <div className="flex items-center gap-2 text-lg font-semibold border-b border-border py-4 px-4">
        <ReceiptText size={20} className="text-foreground" />
        <span className="text-foreground">Order Summary</span>
      </div>

      {/* Cart Items */}
      <div className="px-4 mb-4 pt-3">
        <p className="text-sm font-semibold mb-3 text-foreground">
          Items in Cart
        </p>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.skuId} className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 border border-border bg-secondary rounded overflow-hidden">
                <Image
                  src={toSOPImageUrl(productImage)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.colorName} / {item.variantName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.qty} × BDT {item.unitPrice.toLocaleString()}
                </p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  BDT {(item.unitPrice * item.qty).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.skuId)}
                  className="text-destructive/60 hover:text-destructive p-0.5 transition-colors"
                  aria-label={`Remove ${item.colorName} ${item.variantName}`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mixed delivery notice */}
      {hasMixedDelivery && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
          <Truck size={14} className="mt-0.5 shrink-0" />
          <p>
            Your cart has <strong>mixed delivery</strong>: some items ship free,
            others don&apos;t. A delivery charge applies, but free-delivery items
            are <strong>excluded from weight surcharge</strong>.
          </p>
        </div>
      )}

      {/* Totals */}
      <div className="space-y-3 py-4 px-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold text-foreground">
            BDT {subtotal.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Truck size={16} /> Delivery Charge
          </span>
          {deliveryAmount === 0 || allFreeDelivery ? (
            <span className="font-semibold text-green-600 flex items-center gap-1">
              🚚 FREE
            </span>
          ) : (
            <span className="font-semibold text-foreground">
              BDT {deliveryAmount.toLocaleString()}
            </span>
          )}
        </div>

        {weightExtraCharge > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Scale size={16} /> Weight surcharge
                {paidWeightKg > 0 ? ` (${paidWeightKg.toFixed(2)} kg)` : ""}
              </span>
              <span className="font-semibold text-orange-500">
                +BDT {weightExtraCharge.toLocaleString()}
              </span>
            </div>
            {hasMixedDelivery && (
              <p className="text-[10px] text-amber-600 -mt-1 pl-1">
                ⚠️ Surcharge applies to paid-delivery items only
              </p>
            )}
          </>
        )}

        {bulkDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              ⚡ Bulk Discount
            </span>
            <span className="font-semibold text-green-600">
              -BDT {bulkDiscount.toLocaleString()}
            </span>
          </div>
        )}

        {itemDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Percent size={16} /> Item Discount
            </span>
            <span className="font-semibold text-green-600">
              -BDT {itemDiscount.toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
          <span className="text-foreground">Total Amount</span>
          <span className="text-foreground">
            BDT {grandTotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
