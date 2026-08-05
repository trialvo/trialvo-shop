"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ACCOUNT_NAV_ITEMS,
  type AccountNavIconKey,
} from "@/lib/adapters/accountNav";
import type { HeaderAccountViewModel } from "@/lib/adapters/authUser";
import { HeaderUserAvatar } from "@/components/layout/header/HeaderUserAvatar";

const HEADER_NAV_ICONS: Record<AccountNavIconKey, LucideIcon> = {
  dashboard: LayoutDashboard,
  orders: Package,
  wishlist: Heart,
  addresses: MapPin,
  settings: Settings,
};

type HeaderAccountMenuProps = Readonly<{
  account: HeaderAccountViewModel;
  isSigningOut: boolean;
  onSignOut: () => Promise<void>;
}>;

/**
 * Authenticated header control — circular avatar + name + Radix dropdown.
 */
export function HeaderAccountMenu({
  account,
  isSigningOut,
  onSignOut,
}: HeaderAccountMenuProps): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AppButton
          variant="ghost"
          aria-label={`Account menu for ${account.displayName}`}
          className="relative h-9 gap-2 px-1.5 sm:px-2 max-w-[180px]"
        >
          <HeaderUserAvatar account={account} />
          <span className="hidden sm:inline text-sm font-medium truncate">
            {account.firstName}
          </span>
        </AppButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-sm p-1.5"
      >
        <DropdownMenuLabel className="font-normal px-2.5 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <HeaderUserAvatar account={account} className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {account.displayName}
              </p>
              {account.email ? (
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {account.email}
                </p>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {ACCOUNT_NAV_ITEMS.map((item) => {
          const Icon = HEADER_NAV_ICONS[item.icon];
          const label =
            item.id === "dashboard" ? "My Account" : item.label;
          return (
            <DropdownMenuItem
              key={item.id}
              asChild
              className="rounded-sm cursor-pointer"
            >
              <Link href={item.href} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span>{label}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={isSigningOut}
          className="rounded-sm cursor-pointer text-destructive focus:text-destructive"
          onSelect={(event) => {
            event.preventDefault();
            void onSignOut();
          }}
        >
          <LogOut className="h-4 w-4 mr-2" aria-hidden />
          {isSigningOut ? "Signing out…" : "Sign Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default HeaderAccountMenu;
