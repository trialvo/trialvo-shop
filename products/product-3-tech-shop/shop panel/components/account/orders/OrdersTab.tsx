"use client";

import { useCallback, useMemo, type ReactElement } from "react";
import { AppButton } from "@/components/shared/AppButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderList } from "@/components/account/orders/OrderList";
import { useOrderTabs } from "@/hooks/useOrder";
import type { AccountOrderTabKey } from "@/lib/adapters/accountOrder";
import { cn } from "@/lib/utils";

const TAB_LABELS: Record<AccountOrderTabKey, string> = {
  all: "All",
  "to-pay": "To pay",
  completed: "Completed",
  canceled: "Canceled",
};

/**
 * Account → Orders tab.
 * Infinite pagination via `useOrderTabs` (react-query useInfiniteQuery).
 */
export function OrdersTab(): ReactElement {
  const {
    all,
    toPay,
    completed,
    canceled,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    totalOrders,
  } = useOrderTabs();

  const onLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const counts = useMemo(
    () => ({
      all: all.length,
      "to-pay": toPay.length,
      completed: completed.length,
      canceled: canceled.length,
    }),
    [all.length, canceled.length, completed.length, toPay.length],
  );

  const triggerClass = cn(
    "rounded-sm px-3 py-1.5 text-xs font-medium shadow-none",
    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
    "text-muted-foreground",
  );

  if (error) {
    return (
      <div className="bg-card rounded-sm border border-border p-5">
        <h2 className="font-heading text-lg font-bold mb-4">My Orders</h2>
        <div className="text-center py-10 space-y-3">
          <p className="text-sm text-destructive">
            Failed to load orders: {error.message}
          </p>
          <AppButton
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
          >
            Try again
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-sm border border-border p-5">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <h2 className="font-heading text-lg font-bold">My Orders</h2>
          {!isLoading && totalOrders > 0 ? (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {totalOrders} order{totalOrders === 1 ? "" : "s"} total
            </p>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="h-auto w-full justify-start flex-wrap gap-1 bg-secondary/50 p-1 rounded-sm mb-4">
          {(Object.keys(TAB_LABELS) as AccountOrderTabKey[]).map((key) => (
            <TabsTrigger key={key} value={key} className={triggerClass}>
              {TAB_LABELS[key]}
              <span className="ml-1 opacity-70">({counts[key]})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="m-0">
          <OrderList
            items={all}
            isLoading={isLoading}
            isFetchingMore={isFetchingNextPage}
            hasMore={hasNextPage}
            onLoadMore={onLoadMore}
          />
        </TabsContent>
        <TabsContent value="to-pay" className="m-0">
          <OrderList
            items={toPay}
            isLoading={isLoading}
            isFetchingMore={isFetchingNextPage}
            hasMore={hasNextPage}
            onLoadMore={onLoadMore}
            emptyHint="No unpaid orders in the loaded list."
          />
        </TabsContent>
        <TabsContent value="completed" className="m-0">
          <OrderList
            items={completed}
            isLoading={isLoading}
            isFetchingMore={isFetchingNextPage}
            hasMore={hasNextPage}
            onLoadMore={onLoadMore}
            emptyHint="No completed orders in the loaded list."
          />
        </TabsContent>
        <TabsContent value="canceled" className="m-0">
          <OrderList
            items={canceled}
            isLoading={isLoading}
            isFetchingMore={isFetchingNextPage}
            hasMore={hasNextPage}
            onLoadMore={onLoadMore}
            emptyHint="No canceled orders in the loaded list."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default OrdersTab;
