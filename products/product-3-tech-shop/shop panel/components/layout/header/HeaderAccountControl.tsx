"use client";

import Link from "next/link";
import { useMemo, type ReactElement } from "react";
import { User } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { useAuthContext } from "@/context/AuthContext";
import { toHeaderAccountViewModel } from "@/lib/adapters/authUser";
import { HeaderAccountSkeleton } from "@/components/layout/header/HeaderAccountSkeleton";
import { HeaderAccountMenu } from "@/components/layout/header/HeaderAccountMenu";

/**
 * Header account slot (component-driven):
 * 1) loading / reload → skeleton
 * 2) guest (auth resolved, no session) → avatar icon
 * 3) authenticated → circular image + name + dropdown
 */
export function HeaderAccountControl(): ReactElement {
  const {
    isAuthenticated,
    isUserLoading,
    user,
    signOut,
    isSigningOut,
  } = useAuthContext();

  const account = useMemo(
    () => (user ? toHeaderAccountViewModel(user) : null),
    [user],
  );

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
    } catch {
      /* session cleared locally even if API fails */
    }
  };

  if (isUserLoading) {
    return <HeaderAccountSkeleton />;
  }

  if (isAuthenticated && account) {
    return (
      <HeaderAccountMenu
        account={account}
        isSigningOut={isSigningOut}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <Link href="/account" aria-label="Sign in">
      <AppButton variant="ghost" size="icon">
        <User className="h-5 w-5" aria-hidden />
      </AppButton>
    </Link>
  );
}

export default HeaderAccountControl;
