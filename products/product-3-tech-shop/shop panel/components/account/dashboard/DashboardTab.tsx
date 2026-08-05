"use client";

import type { ReactElement } from "react";
import { DashboardStats } from "@/components/account/dashboard/DashboardStats";
import { DashboardWelcomeHeader } from "@/components/account/dashboard/DashboardWelcomeHeader";
import { RecentOrdersPanel } from "@/components/account/dashboard/RecentOrdersPanel";
import { useAddress } from "@/hooks/useAddress";
import { useOrder } from "@/hooks/useOrder";
import type { User } from "@/lib/api/auth/service";

type DashboardTabProps = Readonly<{
  user: User | null | undefined;
  wishlistCount: number;
}>;

/**
 * Account → Dashboard overview.
 * Welcome + KPIs + recent orders (profile editing lives under Settings).
 */
export function DashboardTab({
  user,
  wishlistCount,
}: DashboardTabProps): ReactElement {
  const { totalOrders, ordersLoading } = useOrder({ limit: 1, offset: 0 });
  const { addresses, addressesLoading } = useAddress();

  return (
    <div className="space-y-4">
      <DashboardWelcomeHeader user={user} />
      <DashboardStats
        totalOrders={totalOrders}
        wishlistCount={wishlistCount}
        addressCount={addresses.length}
        ordersLoading={ordersLoading}
        addressesLoading={addressesLoading}
      />
      <RecentOrdersPanel />
    </div>
  );
}

export default DashboardTab;
