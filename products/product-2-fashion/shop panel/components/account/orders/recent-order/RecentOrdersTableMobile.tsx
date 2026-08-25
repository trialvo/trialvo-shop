"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/hooks/useOrder";
import { usePaymentSubmit } from "@/hooks/usePaymentSubmit";
import { openConfirmDelete } from "@/lib/modal/confirm-delete";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import React from "react";
import { RecentOrder } from "../../types";
import OrderStatusPill from "../OrderStatusPill";
import OrderActionsMenu from "./OrderActionsMenu";

type Props = {
    orders: RecentOrder[];
    onView?: (id: string) => void;
    onInvoice?: (id: string) => void;
    isLoading?: boolean;
    isFetchingMore?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
};

const money = (n: number): string =>
    `BDT ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function pad2(n: number): string {
    const i = Math.trunc(Math.abs(n));
    return String(i).padStart(2, "0");
}

function getQtyText(qty: number | undefined): string {
    if (typeof qty === "number" && Number.isFinite(qty) && qty >= 0) {
        return `${pad2(qty)} Pcs.`;
    }
    return "-- Pcs.";
}

function getPaymentStatusText(order: RecentOrder): string {
    const paymentStatus = order.paymentStatus?.toLowerCase() || "";

    if (paymentStatus === "paid") return "Paid";
    if (paymentStatus === "due") return "due";

    return "Cash On Delivery";
}

function getPaymentColorClass(paymentText: string): string {
    const t = String(paymentText ?? "").toLowerCase();
    if (t === "paid") return "text-[#34C759]";
    if (t === "due") return "text-[#FF3B30]";
    return "text-black/60";
}

const MobileOrderCard: React.FC<{
    order: RecentOrder;
    onView?: (id: string) => void;
    onCancel?: (id: string) => void;
    onSubmit: (id: number) => void;
    router: ReturnType<typeof useRouter>;
}> = ({ order, onView, onCancel, router, onSubmit }) => {
    const paymentText = getPaymentStatusText(order);
    const paymentColor = getPaymentColorClass(paymentText);
    const isPaid = order?.paymentStatus.toLowerCase() === "paid";


    return (
        <div
            className={cn(
                "bg-white px-1 py-3.5",
                "border-b border-[#E5E5E5] last:border-b-0",
                "transition-colors duration-200 ease-out",
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-baseline gap-3">
                        <div className="text-sm font-semibold leading-none text-black">
                            Order #
                        </div>
                        <div className="truncate text-sm font-normal leading-none text-black">
                            {order.id}
                        </div>
                    </div>

                    <div className="mt-2 flex items-baseline gap-1.5">
                        <div className="text-xs font-normal leading-none text-black/45">
                            Placed On
                        </div>
                        <div className="text-xs font-normal leading-none text-black/75">
                            {order.placedOn}
                        </div>
                    </div>

                    <div className="mt-3.5 text-sm font-medium leading-none text-black">
                        {money(order.total)}
                    </div>

                    <div className="mt-2 flex items-baseline gap-1.5">
                        <div className="text-xs font-normal leading-none text-black/45">
                            Qty
                        </div>
                        <div className="text-xs font-medium leading-none text-black/80">
                            {getQtyText(order.QTY)}
                        </div>
                    </div>
                    {
                        !isPaid && (
                            <Button
                                type="button"
                                className={cn(
                                    "mt-2 h-7 rounded-md bg-black px-3",
                                    "text-xs font-medium text-white",
                                    "transition-colors duration-200 ease-out hover:bg-black/85",
                                )}
                                onClick={() => onSubmit(Number(order.id))}
                            >
                                Make Payment
                            </Button>
                        )
                    }
                </div>

                <div className="flex flex-col items-end gap-1">
                    <OrderStatusPill status={order.order_status} />

                    <div className={cn("text-xs font-normal leading-none", paymentColor)}>
                        {paymentText}
                    </div>

                    <div className="pt-3">
                        <OrderActionsMenu
                            order={order}
                            onView={onView}
                            onCancel={onCancel}
                            router={router}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const RecentOrdersTableMobile: React.FC<Props> = ({
    orders,
    onView,
    onInvoice,
    isLoading = false,
    isFetchingMore = false,
    hasMore = false,
    onLoadMore,
}) => {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { cancelOrder } = useOrder()
    const { onSubmit } = usePaymentSubmit();

    const handleCancel = (id: string | number) => {
        const orderId = Number(id);
        if (!Number.isFinite(orderId) || orderId <= 0) return;

        openConfirmDelete(
            dispatch,
            async () => {
                await cancelOrder.mutateAsync({ orderId });
                router.refresh();
            },
            {
                title: "Are you sure you want cancel this order?",
                description:
                    "This action cannot be undone. If you change your mind, you will need to place a new order",
                cancelText: "Not Now",
                confirmText: "Yes, Cancel",
            },
        );
    };

    const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const node = loadMoreRef.current;
        if (!node) return;
        if (!hasMore || isFetchingMore || isLoading) return;
        if (typeof IntersectionObserver === "undefined") return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onLoadMore?.();
                }
            },
            { rootMargin: "200px" },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, isFetchingMore, isLoading, onLoadMore]);

    return (
        <div className="space-y-3">
            {isLoading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <div key={`recent-order-skeleton-${idx}`} className="border-b border-black/10 py-3">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-24 rounded-sm" />
                                <Skeleton className="h-4 w-16 rounded-sm" />
                            </div>
                            <Skeleton className="h-3 w-28 rounded-sm" />
                            <Skeleton className="h-4 w-20 rounded-sm" />
                            <Skeleton className="h-7 w-24 rounded-none" />
                        </div>
                    </div>
                ))
                : orders.map((order) => (
                    <MobileOrderCard
                        key={order.id}
                        order={order}
                        onView={onView}
                        onCancel={(id) => handleCancel(id)}
                        router={router}
                        onSubmit={onSubmit}
                    />
                ))}

            {isFetchingMore
                ? Array.from({ length: 3 }).map((_, idx) => (
                    <div key={`recent-order-more-${idx}`} className="border-b border-black/10 py-3">
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-24 rounded-sm" />
                            <Skeleton className="h-3 w-28 rounded-sm" />
                            <Skeleton className="h-4 w-20 rounded-sm" />
                        </div>
                    </div>
                ))
                : null}

            <div ref={loadMoreRef} className="h-px w-full" />
        </div>
    );
};

export default RecentOrdersTableMobile;
