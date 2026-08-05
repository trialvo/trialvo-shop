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
        <aside className="w-full lg:w-110">
            <div className="space-y-2 sm:space-y-4">
                <h2 className="text-lg font-semibold text-black text-left">
                    {t("orderSummary.title")}
                </h2>
                <Separator className="bg-[#F1F1F1]" />
            </div>

            <div className="grid grid-cols-1 gap-3 py-4 text-sm sm:grid-cols-3 sm:gap-4 sm:text-lg">
                <div>
                    <div className="text-[#636363] font-normal text-xs">{t("orderSummary.date")}</div>
                    <div className="font-semibold text-xs text-black">{meta.date}</div>
                </div>

                <div>
                    <div className="text-[#636363] font-normal text-xs">{t("orderSummary.orderId")}</div>
                    <div className="font-semibold text-xs text-black">{meta.orderId}</div>
                </div>

                <div>
                    <div className="text-[#636363] font-normal text-xs">{t("orderSummary.paymentMethod")}</div>
                    <div className="font-semibold text-xs text-black">{meta.paymentMethod}</div>
                </div>
            </div>

            <Separator className="bg-[#F1F1F1]" />

            <OrderItems items={items} />

            <OrderTotals totals={{
                ...totals,
                discount,
                total: totals.subtotal
                    + totals.delivery
                    + (totals.weightSurcharge ?? 0)
                    - discount
                    - (totals.bulkDiscount ?? 0)
                    - (totals.comboDiscount ?? 0)
                    - (totals.cartWideDiscount ?? 0)
                    - (totals.couponDiscount ?? 0),
            }} />
        </aside>
    );
};

export default OrderSummaryPanel;
