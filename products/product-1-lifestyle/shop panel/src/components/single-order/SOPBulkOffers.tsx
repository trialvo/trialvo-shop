"use client";

/**
 * components/single-order/SOPBulkOffers.tsx — Bulk discount tiers display
 */

import type { SOPBulkOffer } from "@/types/single-order";

interface SOPBulkOffersProps {
  offers: SOPBulkOffer[];
  currentQty: number;
}

export function SOPBulkOffers({ offers, currentQty }: SOPBulkOffersProps) {
  if (offers.length === 0) return null;

  return (
    <div className="rounded border border-green-200 bg-green-50/50 p-4">
      <p className="mb-2 text-sm font-semibold text-green-800">
        🎉 Bulk Discounts
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-green-700">
            <th className="pb-1">Min Qty</th>
            <th className="pb-1">Discount</th>
            <th className="pb-1">Unit Price</th>
            <th className="pb-1">Free Delivery</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((b) => {
            const disc =
              b.discount_type === 1
                ? `${b.discount_value}%`
                : `৳${b.discount_value}`;
            const bulkUnitPrice =
              b.discount_type === 1
                ? b.sku_selling_price * (1 - b.discount_value / 100)
                : b.sku_selling_price - b.discount_value;

            return (
              <tr
                key={b.id}
                className={`border-t border-green-200 ${
                  currentQty >= b.min_qty
                    ? "font-semibold text-green-800"
                    : "text-green-600"
                }`}
              >
                <td className="py-1">{b.min_qty}+</td>
                <td className="py-1">{disc}</td>
                <td className="py-1">৳{Math.round(bulkUnitPrice)}</td>
                <td className="py-1">{b.free_delivery ? "✓" : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
