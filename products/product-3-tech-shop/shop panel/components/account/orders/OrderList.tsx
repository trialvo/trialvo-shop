"use client";

import { useEffect, useRef, type ReactElement } from "react";
import Link from "next/link";
import { Package, Loader2 } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { OrderListItemCard } from "@/components/account/orders/OrderListItemCard";
import { OrderListSkeleton } from "@/components/account/orders/OrderListSkeleton";
import { toAccountOrderRow } from "@/lib/adapters/accountOrder";
import type { OrderListItem } from "@/lib/api/order/service";

type OrderListProps = Readonly<{
  items: OrderListItem[];
  isLoading?: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  emptyHint?: string;
}>;

/**
 * Order list with intersection-observer infinite pagination.
 */
export function OrderList({
  items,
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
  onLoadMore,
  emptyHint = "You haven't placed any orders yet.",
}: OrderListProps): ReactElement {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    if (!hasMore || isFetchingMore || isLoading) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMore?.();
      },
      { rootMargin: "240px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isLoading, onLoadMore]);

  if (isLoading) {
    return <OrderListSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-3 opacity-30" aria-hidden />
        <p className="text-sm font-medium text-foreground">No orders yet</p>
        <p className="text-xs mt-1 max-w-xs mx-auto">{emptyHint}</p>
        <AppButton asChild variant="outline" className="mt-4">
          <Link href="/shop">Start Shopping</Link>
        </AppButton>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((order) => (
        <OrderListItemCard key={order.id} order={toAccountOrderRow(order)} />
      ))}

      <div ref={loadMoreRef} className="h-1" aria-hidden />

      {hasMore ? (
        <div className="flex justify-center pt-2">
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={isFetchingMore}
            isLoading={isFetchingMore}
            loadingText="Loading…"
            onClick={() => onLoadMore?.()}
          >
            Load more orders
          </AppButton>
        </div>
      ) : null}

      {isFetchingMore ? (
        <div className="flex justify-center py-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-label="Loading more" />
        </div>
      ) : null}
    </div>
  );
}
