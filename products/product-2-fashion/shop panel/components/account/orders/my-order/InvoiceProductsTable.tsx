import { toPublicUrl } from "@/lib/utils";
import React from "react";
import type { OrderInvoiceItem } from "./types";

const money = (currency: string, n: number) =>
  `${currency} ${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type Props = {
  items: OrderInvoiceItem[];
  currency: string;
};

export const InvoiceProductsTable: React.FC<Props> = ({ items, currency }) => {
  return (
    <div
      data-invoice-products
      className="overflow-hidden rounded-[4px] border border-black/8 print:overflow-visible print:rounded-none"
    >
      <div
        data-invoice-products-header
        className="hidden grid-cols-[minmax(0,1.7fr)_0.9fr_0.45fr_0.9fr] gap-3 bg-[#F7F5F2] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#8A8A8A] min-[640px]:grid print:grid"
      >
        <div>Products</div>
        <div className="text-center">Unit price</div>
        <div className="text-center">Qty</div>
        <div className="text-right">Price</div>
      </div>

      <div>
        {items.map((it) => {
          const src =
            typeof it.imageSrc === "string" && it.imageSrc.trim().length > 0
              ? toPublicUrl(it.imageSrc)
              : null;

          return (
            <div
              key={it.id}
              data-print-product-row
              data-invoice-product-row
              className="grid grid-cols-1 gap-3 border-t border-black/6 px-4 py-4 first:border-t-0 min-[640px]:grid-cols-[minmax(0,1.7fr)_0.9fr_0.45fr_0.9fr] min-[640px]:items-center min-[640px]:gap-3 print:grid-cols-[minmax(0,1.7fr)_0.9fr_0.45fr_0.9fr] print:items-center print:gap-3 print:py-3"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[4px] border border-black/8 bg-white print:h-10 print:w-10">
                  {/* Plain img for reliable PDF/print capture */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src || "/placeholder-product.jpg"}
                    alt={it.title}
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <div className="line-clamp-2 text-[13px] font-medium text-[#191919] print:line-clamp-none">
                    {it.title}
                  </div>
                  <div className="mt-1 text-[11px] text-[#8A8A8A]">
                    Size <span className="text-[#5F5F5F]">{it.size}</span>
                    <span className="mx-1.5 text-black/20">|</span>
                    Color <span className="text-[#5F5F5F]">{it.color}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-[13px] tabular-nums text-[#5F5F5F] min-[640px]:block min-[640px]:text-center print:block print:text-center">
                <span className="min-[640px]:hidden print:hidden">Unit price</span>
                {money(currency, it.unitPrice)}
              </div>

              <div className="flex justify-between text-[13px] tabular-nums text-[#5F5F5F] min-[640px]:block min-[640px]:text-center print:block print:text-center">
                <span className="min-[640px]:hidden print:hidden">Qty</span>
                {String(it.qty).padStart(2, "0")}
              </div>

              <div className="flex justify-between text-[13px] font-semibold tabular-nums text-[#191919] min-[640px]:block min-[640px]:text-right print:block print:text-right">
                <span className="font-medium text-[#5F5F5F] min-[640px]:hidden print:hidden">
                  Price
                </span>
                {money(currency, it.totalPrice)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
