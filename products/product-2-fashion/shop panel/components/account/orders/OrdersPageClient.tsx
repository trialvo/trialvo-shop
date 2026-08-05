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
    <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
      <Breadcrumbs items={[
        { label: t("breadcrumb.home"), href: "/" },
        { label: t("account.account"), href: "/account" },
        { label: t("account.orders.myOrder") }
      ]} />

      <div className="sm:mb-17.5">
        <AccountLayout sidebar={<AccountSidebar activeKey="my-order" />}>
          <div className="space-y-3">
            <div className="border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] bg-white px-4 py-2.5">
              <h1 className="text-2xl font-bold">{t("account.orders.myOrder")}</h1>
            </div>

            <div className="border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] bg-white pl-4 pr-0 sm:p-4">
              <OrdersTabs
                all={all} toPay={toPay} completed={completed} canceled={canceled}
                hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage}
                onLoadMore={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
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
