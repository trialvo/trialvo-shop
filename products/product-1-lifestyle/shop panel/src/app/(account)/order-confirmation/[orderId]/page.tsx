"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  Package,
  Truck,
  Clock,
  Mail,
  Printer,
  Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrderById } from "@/hooks/useOrderById";
import { mapOrderToInvoice, printInvoice, downloadInvoice } from "@/lib/invoice/invoice-utils";

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const numericOrderId = useMemo(() => {
    const id = parseInt(orderId, 10);
    return Number.isFinite(id) && id > 0 ? id : 0;
  }, [orderId]);

  const { data: order, isLoading } = useOrderById(numericOrderId);

  const invoiceData = useMemo(
    () => (order ? mapOrderToInvoice(order) : null),
    [order],
  );

  const handlePrint = () => {
    if (invoiceData) printInvoice(invoiceData);
  };

  const handleDownload = () => {
    if (invoiceData) downloadInvoice(invoiceData);
  };

  const TIMELINE = [
    { label: "Order Placed", icon: CheckCircle2, active: true },
    { label: "Processing", icon: Clock, active: false },
    { label: "Shipped", icon: Truck, active: false },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <section className="max-w-[640px] mx-auto px-4 sm:px-6 py-12 lg:py-20">
        {/* ── Animated checkmark hero ─────────────────────── */}
        <div className="text-center mb-8">
          <div className="relative w-18 h-18 mx-auto mb-6">
            <span className="absolute inset-0 rounded-2xl bg-success/15 animate-pulse" />
            <span className="relative w-18 h-18 rounded-2xl bg-success/10 flex items-center justify-center">
              <CheckCircle2
                size={36}
                className="text-success drop-shadow-[0_0_8px_hsl(var(--success)/0.4)]"
              />
            </span>
          </div>

          <h1 className="font-display text-3xl lg:text-4xl font-semibold text-foreground tracking-wide">
            Thank You!
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-md mx-auto">
            Your order has been placed successfully. We&apos;re preparing your
            items with care.
          </p>
        </div>

        {/* ── Order info card ─────────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-secondary/20 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10.5px] font-medium tracking-[0.15em] uppercase text-muted-foreground/60">
              Order ID
            </span>
            <span className="text-sm font-bold font-mono text-foreground">
              #{orderId}
            </span>
          </div>

          {/* Loading state for order details */}
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4 rounded-lg bg-secondary" />
              <Skeleton className="h-4 w-1/2 rounded-lg bg-secondary" />
            </div>
          ) : order ? (
            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div>
                <span className="text-muted-foreground/50">Customer</span>
                <p className="font-medium text-foreground mt-0.5">
                  {order.order.customer_name}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground/50">Payment</span>
                <p className="font-medium text-foreground mt-0.5 capitalize">
                  {order.order.payment_type === "cod"
                    ? "Cash on Delivery"
                    : order.order.payment_type === "gateway"
                      ? "Online Payment"
                      : order.order.payment_type}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground/50">Total</span>
                <p className="font-bold text-foreground mt-0.5">
                  ৳{order.totals.grand_total.toLocaleString("en-BD")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground/50">Items</span>
                <p className="font-medium text-foreground mt-0.5">
                  {order.summary.total_quantity} item
                  {order.summary.total_quantity !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ) : null}

          {/* Info items */}
          <div className="space-y-2.5 mt-4 pt-4 border-t border-border/40">
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Package size={12} strokeWidth={1.75} className="text-accent" />
              </span>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Your order is being processed and will be shipped within 2-3
                business days.
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Mail size={12} strokeWidth={1.75} className="text-accent" />
              </span>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                A confirmation email has been sent to your email address.
              </p>
            </div>
          </div>
        </div>

        {/* ── Status timeline ─────────────────────────────── */}
        <div className="rounded-2xl border border-border/60 bg-background p-5 mb-8">
          <h3 className="text-[10.5px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60 mb-4">
            Order Status
          </h3>
          <div className="flex items-center justify-center gap-0">
            {TIMELINE.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        step.active
                          ? "bg-success/15 text-success"
                          : "bg-secondary text-muted-foreground/40"
                      }`}
                    >
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span
                      className={`text-[10px] font-medium whitespace-nowrap ${
                        step.active
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className="w-10 sm:w-16 h-px bg-border/60 mx-2 mb-5" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Invoice CTAs ────────────────────────────────── */}
        {invoiceData && (
          <div className="flex justify-center gap-2.5 mb-8">
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-4 border border-border text-foreground text-[11px] tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer size={13} strokeWidth={1.75} />
              Print Invoice
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="h-9 px-4 border border-border text-foreground text-[11px] tracking-[0.12em] uppercase font-medium hover:bg-secondary transition-colors rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={13} strokeWidth={1.75} />
              Download
            </button>
          </div>
        )}

        {/* ── Navigation CTAs ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 h-11 bg-primary hover:bg-accent hover:text-accent-foreground text-primary-foreground text-xs tracking-[0.2em] uppercase font-medium transition-colors rounded-xl flex items-center justify-center gap-2"
          >
            Continue Shopping <ArrowRight size={14} />
          </Link>
          <Link
            href="/orders"
            className="flex-1 h-11 border border-border text-foreground text-xs tracking-[0.2em] uppercase font-medium hover:bg-secondary transition-colors rounded-xl flex items-center justify-center gap-2"
          >
            View My Orders
          </Link>
        </div>
      </section>
    </div>
  );
}
