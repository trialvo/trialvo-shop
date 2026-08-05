"use client";

import ImageWithFallback from "@/components/common/ImageWithFallback";
import { Button } from "@/components/ui/button";
import { useExportPdf } from "@/hooks/useExportPdf";
import { cn } from "@/lib/utils";
import React from "react";
import { toast } from "sonner";
import { InvoiceLineRow } from "./InvoiceLineRow";
import { InvoiceMetaTable } from "./InvoiceMetaTable";
import { InvoiceProductsTable } from "./InvoiceProductsTable";
import { InvoiceTotals } from "./InvoiceTotals";
import type { OrderInvoice } from "./types";

type Props = {
  invoice: OrderInvoice;
  className?: string;
};

const OrderInvoiceCard: React.FC<Props> = ({ invoice, className }) => {
  const invoiceRef = React.useRef<HTMLDivElement | null>(null);
  const { exportPdf, isExporting } = useExportPdf();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const el = invoiceRef.current;
    if (!el) return;

    try {
      await exportPdf({
        element: el,
        fileName: `invoice-${invoice.orderId}.pdf`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to download PDF");
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="hidden sm:flex items-center gap-3 print:hidden">
        <Button
          type="button"
          onClick={handlePrint}
          className={cn(
            "h-10 rounded-none bg-black px-10 text-sm font-medium text-white",
            "hover:bg-black/90",
          )}
        >
          Print
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleDownload}
          disabled={isExporting}
          className={cn(
            "h-10 rounded-none border-[#BDBDBD] px-10 text-sm font-medium text-black",
            "hover:bg-black/5",
          )}
        >
          {isExporting ? "Preparing..." : "Download"}
        </Button>
      </div>

      <div
        ref={invoiceRef}
        data-print-root
        className={cn(
          "mx-auto w-full max-w-[1120px] bg-white",
          "p-4 sm:p-10",
          "shadow-[0px_0px_10px_rgba(0,0,0,0.12)]",
          "print:shadow-none print:max-w-none print:p-0",
          className,
        )}
      >
        <div className={cn("flex items-start justify-between gap-10")}>
          <div className="min-w-[340px] flex-1">
            <div className="relative h-14 w-44">
              <ImageWithFallback
                src={invoice.brand.logoSrc}
                alt={invoice.brand.name}
                fill
                className="object-contain object-left"
                preload
              />
            </div>

            <div className="mt-4 space-y-3 text-sm text-black/80">
              <div className="leading-6">{invoice.brand.address}</div>
              <InvoiceLineRow label="Email" value={invoice.brand.email} />
              <InvoiceLineRow label="Contract Number" value={invoice.brand.phone} />
            </div>
          </div>

          <div className="w-full max-w-[360px]">
            <InvoiceMetaTable meta={invoice.meta} />
          </div>
        </div>

        <div className="mb-3 sm:my-10 h-px w-full bg-[#E6E6E6]" />

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-black">Invoice To:</h3>

          <div className="space-y-2 text-sm text-black/80">
            <div className="inline-flex rounded bg-[#EAF3FF] px-2 py-1 text-xs font-medium text-black">
              {invoice.invoiceTo.tag}
            </div>

            <div className="text-base font-semibold text-black">{invoice.invoiceTo.name}</div>
            <div className="text-sm">{invoice.invoiceTo.phone}</div>
            <div className="text-sm">{invoice.invoiceTo.address}</div>
          </div>
        </div>

        <div className="mt-10">
          <InvoiceProductsTable items={invoice.items} currency={invoice.currency} />
        </div>

        <div className="mt-10 flex items-end justify-between gap-8">
          <div className="sm:min-w-[320px] min-w-full sm:ml-auto">
            <InvoiceTotals totals={invoice.totals} currency={invoice.currency} />
          </div>
        </div>
      </div>

      <div className="fixed z-20 inset-x-0 bottom-0 border-t border-black/10 bg-white p-4 shadow-[0_-6px_18px_rgba(0,0,0,0.08)] sm:hidden print:hidden">
        <div className="mx-auto flex w-full max-w-lg">
          <Button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className={cn(
              "h-11 w-full rounded-none bg-black text-sm font-semibold text-white",
              "hover:bg-black/90",
              "disabled:opacity-50",
            )}
          >
            {isExporting ? "Preparing..." : "Download Invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
};


export default OrderInvoiceCard;
