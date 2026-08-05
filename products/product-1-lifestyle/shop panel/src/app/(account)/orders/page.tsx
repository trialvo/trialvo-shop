"use client";

import Link from "next/link";
import { Package, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { OrderCard } from "@/components/order";
import { AuthGuard, PageShell } from "@/components/shared";
import { useOrders } from "@/hooks/useOrders";

const ORDERS_QUERY_PARAMS = {
  limit: 50,
  offset: 0,
  sort_by: "created_at",
  sort_order: "desc",
} as const;

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const { orders, isLoading, error } = useOrders(
    ORDERS_QUERY_PARAMS,
    isAuthenticated,
  );

  if (!isAuthenticated) {
    return (
      <div>
        <AuthGuard
          icon={Package}
          heading="Sign in to view orders"
          description="Please sign in to access your order history"
        />
      </div>
    );
  }

  return (
    <div>
      <PageShell>
        <div className="flex items-center gap-3 mb-8">
          <Package size={20} className="text-accent" />
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
            My Orders
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <OrderCardSkeleton key={item} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle size={48} className="mx-auto text-destructive/50 mb-4" />
            <h2 className="font-display text-xl text-foreground mb-2">Unable to load orders</h2>
            <p className="text-sm text-muted-foreground">
              {error.message || "Please try again later"}
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="font-display text-xl text-foreground mb-2">No orders yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Start shopping to see your orders here
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-xs tracking-[0.2em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Start Shopping <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </PageShell>
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <div className="border border-border bg-card p-4 lg:p-6 rounded animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-secondary rounded" />
          <div className="h-3 w-36 bg-secondary rounded" />
        </div>
        <div className="h-6 w-28 bg-secondary rounded-full" />
      </div>
      <div className="flex gap-2 pb-1">
        {[1, 2, 3].map((item) => (
          <div key={item} className="w-14 h-14 bg-secondary rounded" />
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border space-y-3">
        <div className="h-3 w-full bg-secondary rounded" />
        <div className="h-3 w-2/3 bg-secondary rounded" />
      </div>
    </div>
  );
}
