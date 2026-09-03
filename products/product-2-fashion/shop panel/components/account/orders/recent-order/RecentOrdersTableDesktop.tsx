"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useOrder } from "@/hooks/useOrder";
import { usePaymentSubmit } from "@/hooks/usePaymentSubmit";
import { openConfirmDelete } from "@/lib/modal/confirm-delete";
import { rememberReturnPath } from "@/lib/navigation/return-to";
import { toPublicUrl } from "@/lib/utils";
import { useAppDispatch } from "@/redux/hooks";
import { MoreVertical } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { RecentOrder } from "../../types";
import OrderStatusPill from "../OrderStatusPill";

type Props = {
    orders: RecentOrder[];
    onView?: (id: string) => void;
    isLoading?: boolean;
    isFetchingMore?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
};

const money = (n: number): string =>
    `BDT ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DesktopTableRow: React.FC<{
    order: RecentOrder;
    onView?: (id: string) => void;
    onSubmit: (id: number) => void;
    onCancel?: (id: string) => void;
}> = ({ order, onView, onCancel, onSubmit }) => {
    const router = useRouter();
    const pathname = usePathname();
    const isPaid = (order.paymentStatus ?? "").toLowerCase() === "paid";
    const isConfirmed = (order.order_status ?? "").toLowerCase() === "approved";

    return (
        <TableRow className="border-b border-[#F1F1F1]">
            <TableCell className="w-[24%] font-medium text-black">{order.id}</TableCell>
            <TableCell className="w-[18%] text-black/80">{order.placedOn}</TableCell>

            <TableCell className="w-[14%]">
                <div className="relative h-8 w-10 overflow-hidden border border-[#F1F1F1] bg-white">
                    <ImageWithFallback
                        src={toPublicUrl(order.itemThumbSrc) || "#"}
                        alt="item"
                        fill
                        className="object-cover"
                        sizes="40px"
                    />
                </div>
            </TableCell>

            <TableCell className="w-[22%] font-medium text-black">{money(order.total)}</TableCell>

            <TableCell className="w-[10%]">
                <OrderStatusPill status={order.order_status} />
            </TableCell>

            <TableCell className="w-[12%] text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-9 w-9 p-0 hover:bg-transparent group transition-colors duration-150"
                        >
                            <MoreVertical className="h-5 w-5 text-black/70 group-hover:text-black/90" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)]"
                    >
                        {isPaid ? null : (
                            <DropdownMenuItem onClick={() => onSubmit(Number(order.id))}>
                                Make Payment
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                            onClick={() => {
                                onView?.(order.id);
                                rememberReturnPath(pathname || "/account");
                                router.push(`/account/my-order/${order.id}`);
                            }}
                        >
                            View invoice
                        </DropdownMenuItem>

                        {isConfirmed ? null : (
                            <DropdownMenuItem
                                className="text-red-600! hover:text-red-600! transition-colors duration-150"
                                onClick={() => {
                                    onCancel?.(order.id);
                                }}
                            >
                                Cancel Order
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
};

const RecentOrdersTableDesktop: React.FC<Props> = ({
    orders,
    onView,
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
    const scrollRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const node = loadMoreRef.current;
        const root = scrollRef.current;
        if (!node || !root) return;
        if (!hasMore || isFetchingMore || isLoading) return;
        if (typeof IntersectionObserver === "undefined") return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onLoadMore?.();
                }
            },
            { root, rootMargin: "200px" },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, isFetchingMore, isLoading, onLoadMore]);

    return (
        <>
            <div className="w-full">
                <Table className="w-full table-fixed">
                    <TableHeader>
                        <TableRow className="bg-black/5">
                            <TableHead className="w-[24%] font-semibold text-black">Order #</TableHead>
                            <TableHead className="w-[18%] font-semibold text-black">Placed On</TableHead>
                            <TableHead className="w-[14%] font-semibold text-black">Items</TableHead>
                            <TableHead className="w-[22%] font-semibold text-black">Total</TableHead>
                            <TableHead className="w-[10%] font-semibold text-black">Status</TableHead>
                            <TableHead className="w-[12%] text-right font-semibold text-black">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>
            </div>

            <div ref={scrollRef} className="max-h-110 overflow-y-auto [scrollbar-gutter:stable]">
                <Table className="w-full table-fixed">
                    <TableBody>
                        {isLoading
                            ? Array.from({ length: 6 }).map((_, idx) => (
                                <TableRow key={`recent-order-skeleton-${idx}`} className="border-b border-[#F1F1F1]">
                                    <TableCell className="w-[24%]">
                                        <Skeleton className="h-4 w-24 rounded-sm" />
                                    </TableCell>
                                    <TableCell className="w-[18%]">
                                        <Skeleton className="h-4 w-20 rounded-sm" />
                                    </TableCell>
                                    <TableCell className="w-[14%]">
                                        <Skeleton className="h-8 w-10 rounded-sm" />
                                    </TableCell>
                                    <TableCell className="w-[18%]">
                                        <Skeleton className="h-4 w-24 rounded-sm" />
                                    </TableCell>
                                    <TableCell className="w-[14%]">
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </TableCell>
                                    <TableCell className="w-[12%] text-right">
                                        <Skeleton className="ml-auto h-9 w-9 rounded-none" />
                                    </TableCell>
                                </TableRow>
                            ))
                            : orders.map((order) => (
                                <DesktopTableRow
                                    key={order.id}
                                    order={order}
                                    onView={onView}
                                    onCancel={(id) => handleCancel(id)}
                                    onSubmit={onSubmit}
                                />
                            ))}

                        {isFetchingMore
                            ? Array.from({ length: 3 }).map((_, idx) => (
                                <TableRow key={`recent-order-more-${idx}`} className="border-b border-[#F1F1F1]">
                                    <TableCell className="w-[24%]">
                                        <Skeleton className="h-4 w-24 rounded-sm" />
                                    </TableCell>
                                    <TableCell className="w-[18%]">
                                        <Skeleton className="h-4 w-20 rounded-sm" />
                                    </TableCell>
                                    <TableCell className="w-[14%]">
                                        <Skeleton className="h-8 w-10 rounded-sm" />
                                    </TableCell>
                                    <TableCell className="w-[18%]">
                                        <Skeleton className="h-4 w-24 rounded-sm" />
                                    </TableCell>
                                    <TableCell className="w-[14%]">
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </TableCell>
                                    <TableCell className="w-[12%] text-right">
                                        <Skeleton className="ml-auto h-9 w-9 rounded-none" />
                                    </TableCell>
                                </TableRow>
                            ))
                            : null}
                    </TableBody>
                </Table>
                <div ref={loadMoreRef} className="h-px w-full" />
            </div>
        </>
    );
};

export default RecentOrdersTableDesktop;
