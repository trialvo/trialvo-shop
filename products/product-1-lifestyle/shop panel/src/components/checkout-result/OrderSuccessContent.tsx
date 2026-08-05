"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ArrowRight,
  Package,
  Printer,
  Download,
  Truck,
  Clock,
  Mail,
} from "lucide-react";
import type { CheckoutSuccessData } from "@/types/checkout-result";
import type { InvoiceData } from "@/types/invoice";
import { printInvoice, downloadInvoice } from "@/lib/invoice/invoice-utils";
import { DeliveryAddressCard } from "./DeliveryAddressCard";

interface OrderSuccessContentProps {
  data: CheckoutSuccessData;
  showTrackOrder: boolean;
  invoiceData?: InvoiceData | null;
}

/* ── Status timeline steps ─────────────────────────────────────── */

const TIMELINE = [
  { label: "Order Placed", icon: CheckCircle2, active: true },
  { label: "Processing", icon: Clock, active: false },
  { label: "Shipped", icon: Truck, active: false },
] as const;

/**
 * Left column of the order-success page — premium design with
 * animated checkmark, order badge, status timeline, and invoice CTAs.
 */
export function OrderSuccessContent({
  data,
  showTrackOrder,
  invoiceData,
}: OrderSuccessContentProps) {
  const handlePrint = () => {
    if (invoiceData) printInvoice(invoiceData);
  };

  const handleDownload = () => {
    if (invoiceData) downloadInvoice(invoiceData);
  };

  return (
    <div className="flex-1 space-y-8">
      {/* ── Hero with animated icon ────────────────────────── */}
      <div className="space-y-4">
        <div className="relative w-16 h-16">
          {/* Outer glow ring */}
          <span className="absolute inset-0 rounded-2xl bg-success/15 animate-pulse" />
          {/* Inner icon */}
          <span className="relative w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center">
            <CheckCircle2
              size={30}
              className="text-success drop-shadow-[0_0_6px_hsl(var(--success)/0.4)]"
            />
          </span>
        </div>

        <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground tracking-wide">
          Thank You for Your Order!
        </h1>

        {/* Order ID badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border/50">
          <Package size={13} strokeWidth={1.75} className="text-accent" />
          <span className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
            Order
          </span>
          <span className="text-[12px] font-bold text-foreground font-mono">
            #{data.orderId}
          </span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
          {data.confirmationEmail ? (
            <>
              A confirmation email has been sent to{" "}
              <span className="font-medium text-foreground">
                {data.confirmationEmail}
              </span>{" "}
              with your order details.
            </>
          ) : (
            "Your order has been placed successfully. We'll contact you shortly."
          )}
        </p>
      </div>

      {/* ── Compact status timeline ────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
        <h3 className="text-[10.5px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/70 mb-3">
          Order Status
        </h3>
        <div className="flex items-center gap-0">
          {TIMELINE.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      step.active
                        ? "bg-success/15 text-success"
                        : "bg-secondary text-muted-foreground/40"
                    }`}
                  >
                    <Icon size={14} strokeWidth={2} />
                  </span>
                  <span
                    className={`text-[10px] font-medium whitespace-nowrap ${
                      step.active ? "text-foreground" : "text-muted-foreground/50"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className="w-8 sm:w-12 h-px bg-border/60 mx-1 mb-5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Info cards ─────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/40">
          <span className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
            <Package size={13} strokeWidth={1.75} className="text-accent" />
          </span>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Your order is being processed and will be shipped within 2-3
            business days.
          </p>
        </div>
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/40">
          <span className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
            <Mail size={13} strokeWidth={1.75} className="text-accent" />
          </span>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            A confirmation email with tracking details will be sent once
            shipped.
          </p>
        </div>
      </div>

      {/* ── Delivery address ───────────────────────────────── */}
      <DeliveryAddressCard address={data.deliveryAddress} />

      {/* ── Desktop CTAs ───────────────────────────────────── */}
      <div className="hidden sm:flex flex-wrap items-center gap-2.5 pt-2">
        {showTrackOrder && (
          <Link
            href={data.trackOrderHref}
            className="h-10 px-5 border border-border text-foreground text-xs tracking-[0.15em] uppercase font-medium hover:bg-secondary transition-colors rounded-xl flex items-center justify-center gap-2"
          >
            <Package size={14} strokeWidth={1.75} />
            Track Order
          </Link>
        )}
        {invoiceData && (
          <>
            <button
              type="button"
              onClick={handlePrint}
              className="h-10 px-4 border border-border text-foreground text-xs tracking-[0.15em] uppercase font-medium hover:bg-secondary transition-colors rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer size={14} strokeWidth={1.75} />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="h-10 px-4 border border-border text-foreground text-xs tracking-[0.15em] uppercase font-medium hover:bg-secondary transition-colors rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={14} strokeWidth={1.75} />
              Download
            </button>
          </>
        )}
        <Link
          href={data.continueShoppingHref}
          className="h-10 px-5 bg-primary hover:bg-accent hover:text-accent-foreground text-primary-foreground text-xs tracking-[0.15em] uppercase font-medium transition-colors rounded-xl flex items-center justify-center gap-2"
        >
          Continue Shopping
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* ── Mobile sticky bar ──────────────────────────────── */}
      <div className="fixed z-20 inset-x-0 bottom-0 border-t border-border bg-background p-4 shadow-[0_-6px_18px_rgba(0,0,0,0.06)] sm:hidden">
        <div className="mx-auto flex w-full max-w-lg gap-2.5">
          {showTrackOrder && (
            <Link
              href={data.trackOrderHref}
              className="flex-1 h-11 border border-border text-foreground text-xs tracking-[0.15em] uppercase font-medium rounded-xl flex items-center justify-center"
            >
              Track Order
            </Link>
          )}
          {invoiceData && (
            <button
              type="button"
              onClick={handlePrint}
              className="h-11 px-4 border border-border text-foreground text-xs tracking-[0.15em] uppercase font-medium rounded-xl flex items-center justify-center cursor-pointer"
            >
              <Printer size={14} strokeWidth={1.75} />
            </button>
          )}
          <Link
            href={data.continueShoppingHref}
            className="flex-1 h-11 bg-primary text-primary-foreground text-xs tracking-[0.15em] uppercase font-medium rounded-xl flex items-center justify-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
