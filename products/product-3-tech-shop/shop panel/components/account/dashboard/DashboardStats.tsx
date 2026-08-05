"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { Heart, MapPin, ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardStatsProps = Readonly<{
  totalOrders: number;
  wishlistCount: number;
  addressCount: number;
  ordersLoading?: boolean;
  addressesLoading?: boolean;
}>;

type StatTileProps = Readonly<{
  href: string;
  label: string;
  value: number;
  loading?: boolean;
  icon: ReactElement;
}>;

function StatTile({
  href,
  label,
  value,
  loading = false,
  icon,
}: StatTileProps): ReactElement {
  return (
    <Link
      href={href}
      className="bg-card rounded-sm border border-border p-4 text-center hover:bg-secondary/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="mx-auto mb-1.5 flex justify-center">{icon}</div>
      {loading ? (
        <Skeleton className="h-7 w-10 mx-auto mb-1 rounded-sm" />
      ) : (
        <p className="text-xl font-bold font-heading tabular-nums">{value}</p>
      )}
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </Link>
  );
}

/**
 * Dashboard KPI tiles — orders, wishlist, addresses.
 */
export function DashboardStats({
  totalOrders,
  wishlistCount,
  addressCount,
  ordersLoading = false,
  addressesLoading = false,
}: DashboardStatsProps): ReactElement {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <StatTile
        href="/account?tab=orders"
        label="Total Orders"
        value={totalOrders}
        loading={ordersLoading}
        icon={
          <ShoppingBag className="h-6 w-6 text-primary" aria-hidden />
        }
      />
      <StatTile
        href="/account?tab=wishlist"
        label="Wishlist Items"
        value={wishlistCount}
        icon={<Heart className="h-6 w-6 text-destructive" aria-hidden />}
      />
      <StatTile
        href="/account?tab=addresses"
        label="Addresses"
        value={addressCount}
        loading={addressesLoading}
        icon={<MapPin className="h-6 w-6 text-primary" aria-hidden />}
      />
    </div>
  );
}
