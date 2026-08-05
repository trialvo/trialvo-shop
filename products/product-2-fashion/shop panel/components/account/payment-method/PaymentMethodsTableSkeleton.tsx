"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
    TableCell,
    TableRow
} from "@/components/ui/table";


const PaymentMethodsTableSkeleton = () => {
    return (
        <TableRow>
            <TableCell className="py-5">
                <div className="flex items-center gap-4">
                    <div className="relative h-10 w-14 overflow-hidden border border-[#EFEFEF] bg-white">
                        <Skeleton className="h-full w-full rounded-none" />
                    </div>

                    <Skeleton className="h-4 w-44" />
                </div>
            </TableCell>

            <TableCell className="py-5">
                <Skeleton className="h-4 w-24" />
            </TableCell>

            <TableCell className="py-5">
                <div className="flex justify-center">
                    <Skeleton className="h-4 w-14" />
                </div>
            </TableCell>
        </TableRow>
    );
};

export default PaymentMethodsTableSkeleton;
