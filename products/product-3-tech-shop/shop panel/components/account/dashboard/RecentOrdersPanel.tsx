"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { AppButton } from "@/components/shared/AppButton";
import { OrderList } from "@/components/account/orders/OrderList";
import { useOrder } from "@/hooks/useOrder";
import { DASHBOARD_RECENT_ORDERS_LIMIT } from "@/lib/adapters/accountDashboard";

/**
 * Compact recent-orders panel — first page only (not infinite scroll).
 * Full history lives under Account → Orders.
 */
export function RecentOrdersPanel(): ReactElement {
  const {
    orders,
    ordersLoading,
    ordersError,
    ordersRefetch,
    totalOrders,
  } = useOrder({
    limit: DASHBOARD_RECENT_ORDERS_LIMIT,
    offset: 0,
  });

  const hasMoreOnServer = totalOrders > orders.length;

  return (
    <section
      className="bg-card rounded-sm border border-border p-5"
      aria-labelledby="dashboard-recent-orders-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h2
            id="dashboard-recent-orders-heading"
            className="font-heading text-lg font-bold"
          >
            Recent Orders
          </h2>
          {!ordersLoading && totalOrders > 0 ? (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Latest {orders.length}
              {hasMoreOnServer ? ` of ${totalOrders}` : ""}
            </p>
          ) : null}
        </div>
        <AppButton asChild variant="outline" size="sm" className="text-xs">
          <Link href="/account?tab=orders">View all orders</Link>
        </AppButton>
      </div>

      {ordersError ? (
        <div className="text-center py-8 space-y-3" role="alert">
          <p className="text-sm text-destructive">
            Failed to load orders: {ordersError.message}
          </p>
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void ordersRefetch()}
          >
            Try again
          </AppButton>
        </div>
      ) : (
        <OrderList
          items={orders}
          isLoading={ordersLoading}
          isFetchingMore={false}
          hasMore={false}
          emptyHint="Place an order to see it here."
        />
      )}

      {!ordersLoading && !ordersError && hasMoreOnServer ? (
        <div className="mt-4 pt-3 border-t border-border text-center">
          <AppButton asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/account?tab=orders">
              See all {totalOrders} orders
            </Link>
          </AppButton>
        </div>
      ) : null}
    </section>
  );
}
