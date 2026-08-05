"use client";

import { useMemo, type ReactElement } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { AccountSidebarNav } from "@/components/account/sidebar/AccountSidebarNav";
import { AccountSidebarProfile } from "@/components/account/sidebar/AccountSidebarProfile";
import { AccountSidebarSkeleton } from "@/components/account/sidebar/AccountSidebarSkeleton";
import { AppButton } from "@/components/shared/AppButton";
import { useAddress } from "@/hooks/useAddress";
import { useAuthContext } from "@/context/AuthContext";
import { useOrder } from "@/hooks/useOrder";
import { useWishlistProducts } from "@/hooks/useWishlistProducts";
import {
  toAccountSidebarViewModel,
  type AccountSidebarCounts,
  type AccountTabId,
} from "@/lib/adapters/accountNav";
import { getUnknownErrorMessage } from "@/lib/api/errors";

type AccountSidebarProps = Readonly<{
  activeTab: AccountTabId;
}>;

/**
 * Account area sidebar — profile from auth API + live section counts.
 */
export function AccountSidebar({
  activeTab,
}: AccountSidebarProps): ReactElement {
  const auth = useAuthContext();
  const { count: wishlistCount, isLoading: wishlistLoading } =
    useWishlistProducts({ limit: 50 });
  const { addresses, addressesLoading } = useAddress();
  // Lightweight list call — pagination.total drives the Orders badge.
  const { totalOrders, ordersLoading } = useOrder({
    limit: 1,
    offset: 0,
  });

  const profile = useMemo(
    () => toAccountSidebarViewModel(auth.user),
    [auth.user],
  );

  const counts = useMemo((): AccountSidebarCounts => {
    return {
      orders: ordersLoading ? null : totalOrders,
      wishlist: wishlistLoading ? null : wishlistCount,
      addresses: addressesLoading ? null : addresses.length,
    };
  }, [
    addresses.length,
    addressesLoading,
    ordersLoading,
    totalOrders,
    wishlistCount,
    wishlistLoading,
  ]);

  if (auth.isUserLoading && !auth.user) {
    return <AccountSidebarSkeleton />;
  }

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      toast.success("Signed out");
    } catch (err) {
      toast.error(getUnknownErrorMessage(err, "Failed to sign out"));
    }
  };

  return (
    <aside className="md:w-64 shrink-0">
      <div className="sticky top-32 overflow-hidden rounded-sm border border-border bg-card">
        <AccountSidebarProfile profile={profile} />

        <AccountSidebarNav activeTab={activeTab} counts={counts} />

        <div className="border-t border-border p-2">
          <AppButton
            type="button"
            variant="ghost"
            className="h-9 w-full cursor-pointer justify-start gap-2 rounded-sm px-3 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={auth.isSigningOut}
            isLoading={auth.isSigningOut}
            loadingText="Signing out…"
            leftIcon={<LogOut className="h-4 w-4" aria-hidden />}
            onClick={() => void handleSignOut()}
          >
            Sign out
          </AppButton>
        </div>
      </div>
    </aside>
  );
}
