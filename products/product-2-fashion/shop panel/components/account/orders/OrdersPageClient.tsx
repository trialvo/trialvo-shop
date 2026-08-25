"use client";

import AccountLayout from "@/components/account/AccountLayout";
import AccountSidebar from "@/components/account/AccountSidebar";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { useOrderTabs } from "@/hooks/useOrder";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import OrdersTabs from "./OrdersTabs";

const OrdersPageClient: React.FC = () => {
  const { all, toPay, completed, canceled, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useOrderTabs();
  const { t } = useTranslation();

  return (
    <section className="container mx-auto px-3 pb-10 pt-11 min-[768px]:px-0 min-[768px]:pb-14 min-[768px]:pt-0">
      <Breadcrumbs
        items={[
          { label: t("breadcrumb.home"), href: "/" },
          { label: t("account.account"), href: "/account" },
          { label: t("account.orders.myOrder") },
        ]}
      />

      <div className="mt-2 min-[768px]:mb-14">
        <AccountLayout sidebar={<AccountSidebar activeKey="my-order" />}>
          <div className="space-y-4">
            <h1 className="border-b border-[#E5E5E5] pb-3 text-xl font-semibold tracking-tight text-black min-[768px]:text-[22px]">
              {t("account.orders.myOrder")}
            </h1>

            <div className="overflow-hidden rounded-md border border-[#E5E5E5] bg-white transition-shadow duration-200 ease-out hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
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
                isLoading={isLoading}
              />
            </div>
          </div>
        </AccountLayout>
      </div>
    </section>
  );
};

export default OrdersPageClient;
