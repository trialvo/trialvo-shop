"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import React from "react";
import PaymentMethodsTableSkeleton from "./PaymentMethodsTableSkeleton";
import type { PaymentMethodItem } from "./types";

type Props = {
  items: PaymentMethodItem[];
  isLoading?: boolean;
  skeletonRows?: number;
  onDelete?: (id: string) => void;
};

const PaymentMethodsTable: React.FC<Props> = ({
  items,
  isLoading = false,
  skeletonRows = 3,
  onDelete,
}) => {
  const showSkeleton = isLoading;

  return (
    <div className="border border-[#E9E9E9]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F3F3F3] hover:bg-[#F3F3F3]">
            <TableHead className="text-sm font-semibold text-black">
              Card Number
            </TableHead>
            <TableHead className="text-sm font-semibold text-black">
              Expiry Date
            </TableHead>
            <TableHead className="text-center text-sm font-semibold text-black">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {showSkeleton ? (
            Array.from({ length: skeletonRows }).map((_, i) => (
              <PaymentMethodsTableSkeleton key={i}/>
            ))
          ) : (
            <>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative h-10 w-14 overflow-hidden border border-[#EFEFEF] bg-white">
                        <ImageWithFallback
                          src={row.brandIconSrc}
                          alt={row.brandAlt}
                          fill
                          className="object-contain p-1"
                          sizes="56px"
                        />
                      </div>

                      <span className="text-sm font-medium text-black">
                        {row.maskedNumber}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-5 text-sm text-black">
                    {row.expiry ?? "None"}
                  </TableCell>

                  <TableCell className="py-5 text-center">
                    <button
                      type="button"
                      onClick={() => onDelete?.(row.id)}
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))}

              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No payment methods found.
                  </TableCell>
                </TableRow>
              ) : null}
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaymentMethodsTable;
