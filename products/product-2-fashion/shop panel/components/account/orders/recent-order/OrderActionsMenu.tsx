"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
import { RecentOrder } from "../../types";

type Props = {
    order: RecentOrder;
    onView?: (id: string) => void;
    onCancel?: (id: string) => void;
    router: ReturnType<typeof useRouter>;
    onSubmit?: (id: number) => void;
};

const OrderActionsMenu: React.FC<Props> = ({ order, onView, onCancel, router, onSubmit }) => {
    const paymentStatus = order.paymentStatus ?? "";
    const orderStatus = order.order_status ?? "";

    const isPaid = paymentStatus.toLowerCase() === "paid";
    const isConfirmed = orderStatus.toLowerCase() === "approved";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-transparent">
                    <MoreVertical className="h-6 w-6 text-black/70" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="rounded-none border-0 shadow-[6px_0_18px_rgba(0,0,0,0.06)]"
            >
                {onSubmit && !isPaid ? (
                    <DropdownMenuItem onClick={() => onSubmit(Number(order.id))}>
                        Make Payment
                    </DropdownMenuItem>
                ) : null}

                <DropdownMenuItem
                    onClick={() => {
                        onView?.(order.id);
                        router.push(`/account/my-order/${order.id}`);
                    }}
                >
                    View invoice
                </DropdownMenuItem>

                {!isConfirmed ? (
                    <DropdownMenuItem
                        className="text-red-600! hover:text-red-600! transition-colors duration-150"
                        onClick={() => {
                            onCancel?.(order.id);
                        }}
                    >
                        Cancel Order
                    </DropdownMenuItem>
                ) : null}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default OrderActionsMenu;
