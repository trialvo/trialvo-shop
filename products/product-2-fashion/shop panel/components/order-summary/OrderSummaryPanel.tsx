"use client";

import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import { OrderItem, OrderMeta, OrderTotals as Totals } from "./order.types";
import OrderItems from "./OrderItems";
import OrderTotals from "./OrderTotals";

type Props = {
  meta: OrderMeta;
  items: OrderItem[];
  totals: Totals;
};

const OrderSummaryPanel: React.FC<Props> = ({ meta, items, totals }) => {
  const [discount] = React.useState(totals.discount);
  const { t } = useTranslation();

  return (
    <aside className="w-full min-w-0 min-[992px]:w-[400px] min-[992px]:shrink-0">
      <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
        <div className="border-b border-black/6 px-4 py-4 min-[768px]:px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
            {t("orderSummary.title")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 px-4 py-4 min-[480px]:grid-cols-3 min-[768px]:px-5">
          <div>
            <div className="text-[11px] font-medium text-[#8A8A8A]">
              {t("orderSummary.date")}
            </div>
            <div className="mt-0.5 text-[13px] font-semibold text-[#191919]">
              {meta.date}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[#8A8A8A]">
              {t("orderSummary.orderId")}
            </div>
            <div className="mt-0.5 text-[13px] font-semibold text-[#191919]">
              #{meta.orderId}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium text-[#8A8A8A]">
              {t("orderSummary.paymentMethod")}
            </div>
            <div className="mt-0.5 text-[13px] font-semibold text-[#191919]">
              {meta.paymentMethod}
            </div>
          </div>
        </div>

        <Separator className="bg-black/6" />

        <div className="px-4 min-[768px]:px-5">
          <OrderItems items={items} />

          <OrderTotals
            totals={{
              ...totals,
              discount,
              total:
                totals.subtotal +
                totals.delivery +
                (totals.weightSurcharge ?? 0) -
                discount -
                (totals.bulkDiscount ?? 0) -
                (totals.comboDiscount ?? 0) -
                (totals.cartWideDiscount ?? 0) -
                (totals.couponDiscount ?? 0),
            }}
          />
        </div>
      </div>
    </aside>
  );
};

export default OrderSummaryPanel;
