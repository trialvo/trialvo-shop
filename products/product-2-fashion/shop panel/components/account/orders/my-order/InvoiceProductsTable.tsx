import { toPublicUrl } from "@/lib/utils";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import React from "react";
import type { OrderInvoiceItem } from "./types";

const money = (currency: string, n: number) =>
  `${currency} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type Props = {
  items: OrderInvoiceItem[];
  currency: string;
};

export const InvoiceProductsTable: React.FC<Props> = ({ items, currency }) => {
  return (
    <div className="overflow-hidden border border-[#EDEDED]">
      {/* header */}
      <div className="grid grid-cols-[1.6fr_0.8fr_0.5fr_0.8fr] gap-4 bg-[#F2F2F2] px-4 py-3 text-xs font-semibold text-black">
        <div>Products</div>
        <div className="text-center">Unit Price</div>
        <div className="text-center">Qiy.</div>
        <div className="text-right">Price</div>
      </div>

      {/* rows */}
      <div>
        {items.map((it) => {
          const src = typeof it.imageSrc === "string" && it.imageSrc.trim().length > 0 ? toPublicUrl(it.imageSrc) : null;

          return (
            <div
              key={it.id}
              className="grid grid-cols-[1.6fr_0.8fr_0.5fr_0.8fr] gap-4 border-t border-[#EDEDED] px-4 py-4"
            >
              <div className="flex items-start gap-3">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-[#EDEDED] bg-white">
                  <ImageWithFallback
                    src={src ?? ""}
                    alt={it.title}
                    fill
                    className="object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <div className="line-clamp-1 text-xs font-medium text-black">
                    {it.title}
                  </div>
                  <div className="mt-1 text-[11px] text-black/60">
                    Size <span className="text-black/80">{it.size}</span>{" "}
                    <span className="mx-1">|</span>
                    Color <span className="text-black/80">{it.color}</span>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-black/80">
                {money(currency, it.unitPrice)}
              </div>

              <div className="text-center text-xs text-black/80">
                {String(it.qty).padStart(2, "0")}
              </div>

              <div className="text-right text-xs text-black/80">
                {money(currency, it.totalPrice)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};
