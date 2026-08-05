"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder } from "@/hooks/useOrder";
import { usePaymentSubmit } from "@/hooks/usePaymentSubmit";
import { openConfirmDelete } from "@/lib/modal/confirm-delete";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppDispatch } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import React from "react";
import OrderRow, { OrderRowSkeleton } from "./OrderRow";
import RecentOrdersTableMobile from "./recent-order/RecentOrdersTableMobile";
import type { MyOrderItem } from "./types";

type Props = {
  items: MyOrderItem[];
  isLoading?: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
};

const OrdersTable: React.FC<Props> = ({
  items,
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
  onLoadMore,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const { cancelOrder } = useOrder();
  const { onSubmit } = usePaymentSubmit();

  const handleCancel = (id: string | number) => {
    const orderId = Number(id);
    if (!Number.isFinite(orderId) || orderId <= 0) return;

    openConfirmDelete(
      dispatch,
      async () => {
        await cancelOrder.mutateAsync({ orderId });
        router.refresh();
      },
      {
        title: t("account.orders.cancelOrderTitle"),
        description: t("account.orders.cancelOrderDesc"),
        cancelText: t("account.orders.notNow"),
        confirmText: t("account.orders.yesCancel"),
      },
    );
  };

  const isEmpty = (items?.length ?? 0) === 0;
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    if (!hasMore || isFetchingMore || isLoading) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore?.();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isFetchingMore, isLoading, onLoadMore]);

  if (isEmpty && !isLoading) {
    return (
      <section className="flex min-h-[520px] w-full flex-col items-center justify-center px-4 pb-14 text-center">
        <img src="/empty-cart.svg" alt="No orders" className="h-25 w-25" />

        <h2 className="mt-6 text-2xl font-bold text-black">{t("account.orders.noOrdersYet")}</h2>
        <p className="mt-3 text-sm text-black/80">
          {t("account.orders.noOrdersDesc")}
        </p>

        <Button
          type="button"
          onClick={() => router.push("/")}
          className="mt-8 h-10 rounded-none bg-black px-14 text-sm font-semibold text-white hover:bg-black/90"
        >
          {t("account.orders.startShopping")}
        </Button>
      </section>
    );
  }

  return (
    <div className="sm:border sm:border-[#D9D9D9]">
      <div
        className="
        hidden sm:grid
           grid-cols-[1fr_0.9fr_0.9fr_0.8fr]
          items-center gap-4
          bg-[#F2F2F2]
          px-4 py-4
          text-sm font-semibold
          border-b border-[#D9D9D9]
        "
      >
        <div>{t("account.orders.orderHash")}</div>
        <div>{t("account.orders.status")}</div>
        <div>{t("account.orders.total")}</div>
        <div className="text-right">{t("account.orders.action")}</div>
      </div>

      <div className="max-h-140 overflow-y-auto pr-4 pb-2">
        <div className="hidden md:block">
          {isLoading
            ? Array.from({ length: 10 }).map((_, idx) => <OrderRowSkeleton key={`order-skeleton-${idx}`} />)
            : items.map((item) => {
              const compatibleItem = {
                ...item,
                status: item.order_status || "new",
                placedOn: item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A",
                total: item.grand_total || 0,
                qty: item.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0,
                showMakePayment: item.order_status === "new" && item.payment_status === "unpaid",
                payLine:
                  item.payment_status === "paid"
                    ? `Paid BDT ${Math.abs(item.paid_amount || 0).toLocaleString()}`
                    : `Due BDT ${Math.abs(item.due_amount || 0).toLocaleString()}`,
              };

              return (
                <OrderRow
                  key={`${item.id}-${item.order_status}-${item.created_at}`}
                  item={compatibleItem}
                  onMakePayment={() => {
                    onSubmit(item?.id);
                  }}
                  onViewDetails={() => {
                    router.push(`/account/my-order/${item?.id}`);
                  }}
                  onTrack={() => { }}
                  onCancel={(id) => handleCancel(id)}
                />
              );
            })}

          {isFetchingMore
            ? Array.from({ length: 3 }).map((_, idx) => <OrderRowSkeleton key={`order-more-${idx}`} />)
            : null}
        </div>

        <div className="md:hidden">
          {isLoading
            ? Array.from({ length: 6 }).map((_, idx) => (
              <div key={`order-mobile-skeleton-${idx}`} className="border-t border-black/10 first:border-t-0 p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24 rounded-sm" />
                    <Skeleton className="h-4 w-16 rounded-sm" />
                  </div>
                  <Skeleton className="h-3 w-28 rounded-sm" />
                  <Skeleton className="h-3 w-20 rounded-sm" />
                </div>
              </div>
            ))
            : items.map((item) => {
              const recentOrder = {
                id: String(item.id),
                placedOn: item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB") : "N/A",
                paymentStatus: item.payment_status,
                order_status: item.order_status || "new",
                itemThumbSrc: item.items?.[0]?.product_image || "/placeholder-item.png",
                total: item.grand_total || 0,
                QTY: item.items?.length || 0,
              };

              return (
                <div key={`${item.id}-mobile`} className="border-t border-black/10 first:border-t-0">
                  <RecentOrdersTableMobile
                    orders={[recentOrder]}
                    onView={() => router.push(`/account/my-order/${item.id}`)}
                    onInvoice={() => handleCancel(String(item.id))}
                  />
                </div>
              );
            })}
        </div>

        <div ref={loadMoreRef} className="h-px w-full" />
      </div>
    </div>
  );
};

export default OrdersTable;
