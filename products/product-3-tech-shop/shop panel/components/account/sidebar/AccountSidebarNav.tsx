"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import {
  Heart,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  type LucideIcon,
} from "lucide-react";
import {
  ACCOUNT_NAV_ITEMS,
  formatNavCount,
  type AccountNavIconKey,
  type AccountSidebarCounts,
  type AccountTabId,
} from "@/lib/adapters/accountNav";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<AccountNavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  orders: Package,
  wishlist: Heart,
  addresses: MapPin,
  settings: Settings,
};

type AccountSidebarNavProps = Readonly<{
  activeTab: AccountTabId;
  counts: AccountSidebarCounts;
}>;

/**
 * Account section navigation — desktop stack + mobile horizontal chips.
 */
export function AccountSidebarNav({
  activeTab,
  counts,
}: AccountSidebarNavProps): ReactElement {
  return (
    <nav
      aria-label="Account sections"
      className={cn(
        "flex gap-1 p-2",
        // Mobile: horizontal scroll chips
        "overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        // Desktop: vertical list
        "md:flex-col md:overflow-visible",
      )}
    >
      {ACCOUNT_NAV_ITEMS.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const active = activeTab === item.id;
        const count =
          item.countKey != null ? formatNavCount(counts[item.countKey]) : null;

        return (
          <Link
            key={item.id}
            href={item.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "md:w-full",
              active
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{item.label}</span>
            {count ? (
              <span
                className={cn(
                  "ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-sm px-1.5 py-0.5",
                  "text-[10px] font-semibold tabular-nums leading-none",
                  active
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
