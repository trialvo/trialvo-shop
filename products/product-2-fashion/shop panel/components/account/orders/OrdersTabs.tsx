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
  all,
  toPay,
  completed,
  canceled,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  defaultTab = "all",
  isLoading = false,
  error = null,
}) => {
  const useHook = !all && !toPay && !completed && !canceled;
  const hookData = useOrderTabs();
  const { t } = useTranslation();

  const ordersData = useHook
    ? {
        all: hookData.all,
        toPay: hookData.toPay,
        completed: hookData.completed,
        canceled: hookData.canceled,
        hasNextPage: hookData.hasNextPage,
        isFetchingNextPage: hookData.isFetchingNextPage,
        onLoadMore: () => {
          if (hookData.hasNextPage && !hookData.isFetchingNextPage) {
            hookData.fetchNextPage();
          }
        },
        isLoading: hookData.isLoading,
        error: hookData.error,
      }
    : {
        all: all || [],
        toPay: toPay || [],
        completed: completed || [],
        canceled: canceled || [],
        hasNextPage,
        isFetchingNextPage,
        onLoadMore,
        isLoading,
        error,
      };

  if (ordersData.error) {
    return (
      <div className="w-full px-4 py-10 text-center">
        <div className="text-sm text-red-600">
          {t("account.orders.failedToLoad")} {ordersData.error.message}
        </div>
      </div>
    );
  }

  const tabTriggerStyles = cn(
    "relative rounded-none border-0 bg-transparent px-0 pb-3 pt-3.5 text-sm font-medium shadow-none",
    "text-black/55 transition-colors duration-200 ease-out",
    "hover:text-black",
    "data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-black data-[state=active]:shadow-none",
    "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-black",
    "after:transition-transform after:duration-200 after:ease-out",
    "data-[state=active]:after:scale-x-100",
    "shrink-0 whitespace-nowrap",
  );

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <div
        className={cn(
          "border-b border-[#E5E5E5] px-4",
          "overflow-x-auto overflow-y-hidden scroll-smooth",
          "[-webkit-overflow-scrolling:touch]",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        <TabsList
          className={cn(
            "h-auto w-max min-w-full justify-start gap-6 rounded-none bg-transparent p-0",
          )}
        >
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

      <div className="p-4 pt-3">
        <TabsContent value="all" className="m-0">
          <OrdersTable
            items={ordersData.all}
            isLoading={ordersData.isLoading}
            isFetchingMore={ordersData.isFetchingNextPage}
            hasMore={ordersData.hasNextPage}
            onLoadMore={ordersData.onLoadMore}
          />
        </TabsContent>
        <TabsContent value="to-pay" className="m-0">
          <OrdersTable
            items={ordersData.toPay}
            isLoading={ordersData.isLoading}
            isFetchingMore={ordersData.isFetchingNextPage}
            hasMore={ordersData.hasNextPage}
            onLoadMore={ordersData.onLoadMore}
          />
        </TabsContent>
        <TabsContent value="completed" className="m-0">
          <OrdersTable
            items={ordersData.completed}
            isLoading={ordersData.isLoading}
            isFetchingMore={ordersData.isFetchingNextPage}
            hasMore={ordersData.hasNextPage}
            onLoadMore={ordersData.onLoadMore}
          />
        </TabsContent>
        <TabsContent value="canceled" className="m-0">
          <OrdersTable
            items={ordersData.canceled}
            isLoading={ordersData.isLoading}
            isFetchingMore={ordersData.isFetchingNextPage}
            hasMore={ordersData.hasNextPage}
            onLoadMore={ordersData.onLoadMore}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
};

export const OrdersTabsWithHook: React.FC<{ defaultTab?: OrderTabKey }> = ({
  defaultTab = "all",
}) => {
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
  } = useOrderTabs();
  return (
    <OrdersTabs
      all={all}
      toPay={toPay}
      completed={completed}
      canceled={canceled}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      defaultTab={defaultTab}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default OrdersTabs;
