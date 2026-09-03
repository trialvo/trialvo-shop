"use client";

import { Button } from "@/components/ui/button";
import { useExportPdf } from "@/hooks/useExportPdf";
import { useTranslation } from "@/hooks/useTranslation";
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
  const { t } = useTranslation();

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const el = invoiceRef.current;
    if (!el || isExporting) return;

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
      <div className="hidden items-center gap-2.5 print:hidden sm:flex">
        <Button
          type="button"
          onClick={handlePrint}
          className={cn(
            "h-10 min-w-[110px] rounded-full bg-[#191919] px-6 text-[13px] font-semibold text-white",
            "hover:bg-black",
          )}
        >
          {t("account.orders.print")}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleDownload}
          disabled={isExporting}
          aria-busy={isExporting}
          className={cn(
            // Stable width: Bengali "প্রস্তুত হচ্ছে…" must not expand the row
            "relative h-10 min-w-[148px] rounded-full border-black/12 bg-white px-6 text-[13px] font-semibold text-[#191919]",
            "hover:border-black/20 hover:bg-[#FAF8F5]",
          )}
        >
          <span className={cn(isExporting && "invisible")}>
            {t("account.orders.download")}
          </span>
          {isExporting ? (
            <span className="absolute inset-0 flex items-center justify-center">
              {t("account.orders.preparing")}
            </span>
          ) : null}
        </Button>
      </div>

      {/* Full-width on screen — PDF export forces A4 width on a detached clone only */}
      <div
        ref={invoiceRef}
        data-print-root
        className={cn("w-full bg-white print:shadow-none", className)}
      >
        <div
          data-invoice-header
          className="flex flex-col gap-6 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between print:flex-row print:items-start print:justify-between print:gap-6"
        >
          <div data-invoice-brand className="min-w-0 flex-1">
            <div data-invoice-logo-wrap className="flex h-10 w-40 items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-invoice-logo
                src={invoice.brand.logoSrc}
                alt={invoice.brand.name}
                width={160}
                height={40}
                className="h-10 w-auto max-w-[160px] object-contain object-left"
              />
            </div>

            <div className="mt-4 space-y-1.5 text-[13px] leading-relaxed text-[#5F5F5F]">
              <div className="whitespace-pre-line">{invoice.brand.address}</div>
              <InvoiceLineRow label="Email" value={invoice.brand.email} />
              <InvoiceLineRow label="Contact" value={invoice.brand.phone} />
            </div>
          </div>

          <div
            data-invoice-meta-wrap
            className="w-full min-[768px]:max-w-[300px] print:max-w-[300px] print:shrink-0"
          >
            <InvoiceMetaTable meta={invoice.meta} />
          </div>
        </div>

        <div className="my-6 h-px w-full bg-black/10" />

        <div className="space-y-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
            Invoice to
          </h3>

          <div className="space-y-1 text-[13px] text-[#5F5F5F]">
            <div className="inline-flex rounded-[4px] bg-[#F3F1ED] px-2 py-0.5 text-[11px] font-semibold text-[#5F5F5F]">
              {invoice.invoiceTo.tag}
            </div>
            <div className="text-[15px] font-semibold text-[#191919]">
              {invoice.invoiceTo.name}
            </div>
            <div>{invoice.invoiceTo.phone}</div>
            <div className="max-w-xl leading-relaxed">{invoice.invoiceTo.address}</div>
          </div>
        </div>

        <div className="mt-6">
          <InvoiceProductsTable items={invoice.items} currency={invoice.currency} />
        </div>

        <div data-invoice-totals-wrap className="mt-6 flex justify-end">
          <div className="w-full max-w-[320px]">
            <InvoiceTotals totals={invoice.totals} currency={invoice.currency} />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/8 bg-white/95 p-3 backdrop-blur-sm sm:hidden print:hidden">
        <div className="mx-auto w-full max-w-lg pb-[env(safe-area-inset-bottom)]">
          <Button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className={cn(
              "h-11 w-full rounded-full bg-[#191919] text-[13px] font-semibold text-white",
              "hover:bg-black disabled:opacity-50",
            )}
          >
            {isExporting
              ? t("account.orders.preparing")
              : t("account.orders.downloadInvoice")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderInvoiceCard;
