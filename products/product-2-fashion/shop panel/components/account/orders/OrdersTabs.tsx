// src/components/orders/OrdersTabs.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrderTabs } from "@/hooks/useOrder";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import React from "react";
import OrdersTable from "./OrdersTable";
import type { MyOrderItem, OrderTabKey } from "./types";

type Props = {
  all?: MyOrderItem[];
  toPay?: MyOrderItem[];
  completed?: MyOrderItem[];
  canceled?: MyOrderItem[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  defaultTab?: OrderTabKey;
  isLoading?: boolean;
  error?: Error | null;
};

const OrdersTabs: React.FC<Props> = ({
  all, toPay, completed, canceled,
  hasNextPage, isFetchingNextPage, onLoadMore,
  defaultTab = "all", isLoading = false, error = null,
}) => {
  const useHook = !all && !toPay && !completed && !canceled;
  const hookData = useOrderTabs();
  const { t } = useTranslation();

  const ordersData = useHook
    ? {
      all: hookData.all, toPay: hookData.toPay, completed: hookData.completed, canceled: hookData.canceled,
      hasNextPage: hookData.hasNextPage, isFetchingNextPage: hookData.isFetchingNextPage,
      onLoadMore: () => { if (hookData.hasNextPage && !hookData.isFetchingNextPage) { hookData.fetchNextPage(); } },
      isLoading: hookData.isLoading, error: hookData.error,
    }
    : { all: all || [], toPay: toPay || [], completed: completed || [], canceled: canceled || [], hasNextPage, isFetchingNextPage, onLoadMore, isLoading, error };

  if (ordersData.error) {
    return (
      <div className="w-full py-8 text-center">
        <div className="text-sm text-red-500">{t("account.orders.failedToLoad")} {ordersData.error.message}</div>
      </div>
    );
  }

  const tabTriggerStyles = cn(
    "rounded-none border-x-transparent! border-t-transparent! border-b border-transparent",
    "px-0 pb-3 pt-4 text-sm font-semibold",
    "data-[state=active]:border-b-2 data-[state=active]:border-black",
    "data-[state=active]:text-black",
    "text-black/70",
    "shrink-0 whitespace-nowrap",
  );

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <div className={cn("border-b border-[#D9D9D9]", "overflow-x-auto overflow-y-hidden", "scroll-smooth", "[-webkit-overflow-scrolling:touch]", "[scrollbar-width:none]", "[&::-webkit-scrollbar]:hidden")}>
        <TabsList className={cn("h-auto w-max min-w-full justify-start gap-8", "rounded-none bg-transparent p-0", "border-0", "px-0")}>
          <TabsTrigger value="all" className={tabTriggerStyles}>
            {t("account.orders.allOrders")} ({ordersData.all.length})
          </TabsTrigger>

          <TabsTrigger value="to-pay" className={tabTriggerStyles}>
            {t("account.orders.toPay")} ({ordersData.toPay.length})
          </TabsTrigger>

          <TabsTrigger value="completed" className={tabTriggerStyles}>
            {t("account.orders.completedOrders")} ({ordersData.completed.length})
          </TabsTrigger>

          <TabsTrigger value="canceled" className={tabTriggerStyles}>
            {t("account.orders.canceledOrders")} ({ordersData.canceled.length})
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="pt-4">
        <TabsContent value="all" className="m-0">
          <OrdersTable items={ordersData.all} isLoading={ordersData.isLoading} isFetchingMore={ordersData.isFetchingNextPage} hasMore={ordersData.hasNextPage} onLoadMore={ordersData.onLoadMore} />
        </TabsContent>
        <TabsContent value="to-pay" className="m-0">
          <OrdersTable items={ordersData.toPay} isLoading={ordersData.isLoading} isFetchingMore={ordersData.isFetchingNextPage} hasMore={ordersData.hasNextPage} onLoadMore={ordersData.onLoadMore} />
        </TabsContent>
        <TabsContent value="completed" className="m-0">
          <OrdersTable items={ordersData.completed} isLoading={ordersData.isLoading} isFetchingMore={ordersData.isFetchingNextPage} hasMore={ordersData.hasNextPage} onLoadMore={ordersData.onLoadMore} />
        </TabsContent>
        <TabsContent value="canceled" className="m-0">
          <OrdersTable items={ordersData.canceled} isLoading={ordersData.isLoading} isFetchingMore={ordersData.isFetchingNextPage} hasMore={ordersData.hasNextPage} onLoadMore={ordersData.onLoadMore} />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export const OrdersTabsWithHook: React.FC<{ defaultTab?: OrderTabKey }> = ({ defaultTab = "all" }) => {
  const { all, toPay, completed, canceled, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } = useOrderTabs();
  return (
    <OrdersTabs
      all={all} toPay={toPay} completed={completed} canceled={canceled}
      hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
      defaultTab={defaultTab} isLoading={isLoading} error={error}
    />
  );
};

export default OrdersTabs;
