"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface OrderResultErrorProps {
  orderId: string;
  errorMessage?: string;
  isAuthenticated: boolean;
}

/**
 * Shown when the order detail API returns an error or no data.
 * Provides navigation back to orders (authenticated) or home.
 */
export function OrderResultError({
  orderId,
  errorMessage,
  isAuthenticated,
}: OrderResultErrorProps) {
  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-md mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={24} className="text-destructive" />
        </div>

        <h2 className="font-display text-xl font-semibold text-foreground mb-2">
          Unable to Load Order
        </h2>

        <p className="text-sm text-muted-foreground mb-1">
          {errorMessage ?? "Order not found or invalid order ID."}
        </p>

        {orderId && (
          <p className="text-xs text-muted-foreground/60 mb-8">
            Order ID: {orderId}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isAuthenticated && (
            <Link
              href="/orders"
              className="h-10 px-5 border border-border text-foreground text-xs tracking-[0.15em] uppercase font-medium hover:bg-secondary transition-colors rounded-xl flex items-center justify-center"
            >
              View All Orders
            </Link>
          )}
          <Link
            href="/"
            className="h-10 px-5 bg-primary hover:bg-accent hover:text-accent-foreground text-primary-foreground text-xs tracking-[0.15em] uppercase font-medium transition-colors rounded-xl flex items-center justify-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </section>
  );
}
