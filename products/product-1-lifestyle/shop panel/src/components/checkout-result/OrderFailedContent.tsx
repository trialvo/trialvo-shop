"use client";

import Link from "next/link";
import { XCircle, ArrowRight, RotateCcw, Package, ShieldAlert, Headphones } from "lucide-react";
import { useState } from "react";
import { orderService } from "@/lib/api/order/service";
import type { CheckoutFailedData } from "@/types/checkout-result";

interface OrderFailedContentProps {
  data: CheckoutFailedData;
}

const STEPS = [
  { num: 1, text: "Check your card or mobile banking balance" },
  { num: 2, text: "Try a different payment method" },
  { num: 3, text: "Retry payment using the button below" },
] as const;

/**
 * Left column of the order-failed page — premium design with
 * animated X icon, failure card, numbered steps, and retry CTA.
 */
export function OrderFailedContent({ data }: OrderFailedContentProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryPayment = async () => {
    const orderId = Number(data.orderId);
    if (!Number.isFinite(orderId) || orderId <= 0) return;

    try {
      setIsRetrying(true);
      const res = await orderService.initiatePayment(orderId, "sslcommerz");
      const redirectUrl = res.url ?? res.redirect_url;

      if (redirectUrl) {
        globalThis.location.href = redirectUrl;
      }
    } catch (error) {
      console.error("Retry payment failed:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex-1 space-y-8">
      {/* ── Hero with animated icon ─────────────────────────── */}
      <div className="space-y-4">
        <div className="relative w-16 h-16">
          <span className="absolute inset-0 rounded-2xl bg-destructive/15 animate-pulse" />
          <span className="relative w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <XCircle
              size={30}
              className="text-destructive drop-shadow-[0_0_6px_hsl(var(--destructive)/0.4)]"
            />
          </span>
        </div>

        <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground tracking-wide">
          {data.title}
        </h1>

        {/* Order ID badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border/50">
          <Package size={13} strokeWidth={1.75} className="text-destructive" />
          <span className="text-[11px] font-medium tracking-wider uppercase text-muted-foreground">
            Order
          </span>
          <span className="text-[12px] font-bold text-foreground font-mono">
            #{data.meta.orderId}
          </span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
          {data.message}
          {data.supportEmail && (
            <>
              {" "}Need help? Contact{" "}
              <span className="font-medium text-foreground">{data.supportEmail}</span>.
            </>
          )}
        </p>
      </div>

      {/* ── Failure reason card ─────────────────────────────── */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.03] p-4 flex items-start gap-3">
        <span className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert size={15} strokeWidth={1.75} className="text-destructive" />
        </span>
        <div>
          <p className="text-[13px] font-semibold text-foreground">
            Payment could not be processed
          </p>
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
            This can happen due to insufficient balance, network issues, or your
            bank declining the transaction. No amount has been charged.
          </p>
        </div>
      </div>

      {/* ── Numbered steps ──────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
        <p className="text-[10.5px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/70 mb-3">
          What you can do
        </p>
        <div className="space-y-3">
          {STEPS.map(({ num, text }) => (
            <div key={num} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 text-[11px] font-bold text-accent">
                {num}
              </span>
              <p className="text-[12.5px] text-muted-foreground leading-snug pt-0.5">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── What happens next ───────────────────────────────── */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/30 border border-border/40">
        <span className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
          <Headphones size={13} strokeWidth={1.75} className="text-accent" />
        </span>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Our support team has been automatically notified and will reach out if
          further assistance is needed.
        </p>
      </div>

      {/* ── CTAs ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={handleRetryPayment}
          disabled={isRetrying}
          className="h-10 px-5 border border-border text-foreground text-xs tracking-[0.15em] uppercase font-medium hover:bg-secondary disabled:opacity-50 transition-colors rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <RotateCcw
            size={14}
            strokeWidth={1.75}
            className={isRetrying ? "animate-spin" : ""}
          />
          {isRetrying ? "Processing…" : "Try Payment Again"}
        </button>
        <Link
          href={data.continueShoppingHref}
          className="h-10 px-5 bg-primary hover:bg-accent hover:text-accent-foreground text-primary-foreground text-xs tracking-[0.15em] uppercase font-medium transition-colors rounded-xl flex items-center justify-center gap-2"
        >
          Continue Shopping
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
