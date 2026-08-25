"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import NotificationPreferenceCard from "@/components/account/NotificationPreferenceCard";
import { useAuth } from "@/hooks/useAuth";
import { useOrderTabs } from "@/hooks/useOrder";
import { useTranslation } from "@/hooks/useTranslation";
import { getDefaultAddress } from "@/lib/get-default-address";
import { getDateRange } from "@/lib/utils";
import { useRouter } from "next/navigation";
import React from "react";
import { FiSearch } from "react-icons/fi";
import AccountLayout from "./AccountLayout";
import AccountSidebar from "./AccountSidebar";
import AddressBookCard from "./AddressBookCard";
import RecentOrdersTable from "./orders/recent-order/RecentOrdersTable";
import PersonalProfileCard from "./PersonalProfileCard";
import MyReportsCard from "./reports/MyReportsCard";
import type { Address, RecentOrder } from "./types";

const AccountDashboardClient: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const dateRange = getDateRange(7);

  const {
    all: orders,
    isLoading: ordersLoading,
    error: ordersError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useOrderTabs({
    date_from: dateRange.date_from,
    date_to: dateRange.date_to,
    limit: 10,
  });

  const recentOrders: RecentOrder[] = React.useMemo(() => {
    if (!orders || orders.length === 0) return [];

    return orders.map((order) => ({
      id: String(order.id) || `ORD${order.id}`,
      placedOn: order.created_at
        ? new Date(order.created_at).toLocaleDateString("en-GB")
        : "N/A",
      QTY: order?.items?.length ?? 0,
      paymentStatus: order?.payment_status || "",
      order_status: order?.order_status || "",
      itemThumbSrc: order.items?.[0]?.product_image || "/placeholder-item.png",
      total: order?.paid_amount || order.grand_total || 0,
    }));
  }, [orders]);

  const defaultAddressId = user?.default_address ?? null;
  const address = getDefaultAddress<Address>(user);

  const handleProfileEdit = () => {
    router.push("/account/profile-edit/");
  };

  const handleAddressEdit = () => {
    router.push(`/account/address/${defaultAddressId}/edit`);
  };

  const isLoading = isAuthLoading || ordersLoading;

  return (
    <section className="container mx-auto px-3 pb-10 pt-11 min-[768px]:px-0 min-[768px]:pb-14 min-[768px]:pt-0">
      <Breadcrumbs
        items={[
          { label: t("breadcrumb.home"), href: "/" },
          { label: t("account.accountDetails") },
        ]}
      />

      <div className="mt-2 min-[768px]:mb-14">
        <AccountLayout sidebar={<AccountSidebar activeKey="account-details" />}>
          <div className="space-y-4">
            <h1 className="border-b border-[#E5E5E5] pb-3 text-xl font-semibold tracking-tight text-black min-[768px]:text-[22px]">
              {t("account.myAccount")}
            </h1>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <PersonalProfileCard profile={user} onEdit={handleProfileEdit} />
              <AddressBookCard
                isLoading={isAuthLoading}
                addressBook={address}
                onEdit={handleAddressEdit}
              />
            </div>

            <NotificationPreferenceCard />

            <MyReportsCard />

            <div>
              {ordersError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-8 text-center text-sm text-red-600">
                  {t("account.errorLoadingOrders")}
                </div>
              ) : recentOrders.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-black/15 bg-white py-12 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5">
                    <FiSearch className="h-5 w-5 text-black/50" />
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-black">
                    {t("account.noOrdersLast7Days")}
                  </h3>
                </div>
              ) : (
                <RecentOrdersTable
                  orders={recentOrders}
                  isLoading={isLoading}
                  isFetchingMore={isFetchingNextPage}
                  hasMore={hasNextPage}
                  onLoadMore={() => {
                    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                  }}
                />
              )}
            </div>
          </div>
        </AccountLayout>
      </div>
    </section>
  );
};

export default AccountDashboardClient;
