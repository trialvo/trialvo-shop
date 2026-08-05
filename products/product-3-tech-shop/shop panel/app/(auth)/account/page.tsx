"use client";

import Layout from "@/components/layout/Layout";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AccountSidebar } from "@/components/account/sidebar";
import { DashboardTab } from "@/components/account/dashboard";
import { OrdersTab } from "@/components/account/orders";
import { SettingsTab } from "@/components/account/settings";
import { WishlistTab } from "@/components/account/wishlist";
import { AddressesTab } from "@/components/account/addresses";
import { useAuthContext } from "@/context/AuthContext";
import { useWishlistProducts } from "@/hooks/useWishlistProducts";
import AuthPanel from "@/components/auth/AuthPanel";
import type { AuthMode } from "@/components/auth/types";
import { parseAccountTab } from "@/lib/adapters/accountNav";

const authModes: AuthMode[] = [
  "signin",
  "signup",
  "verify",
  "forgot-request",
  "forgot-verify",
  "forgot-reset",
];

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="container py-20 text-center text-muted-foreground">
            Loading...
          </div>
        </Layout>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}

function AccountPageContent() {
  const searchParams = useSearchParams();
  const tab = parseAccountTab(searchParams.get("tab"));
  const modeParam = searchParams.get("mode");
  const initialAuthMode: AuthMode =
    modeParam && authModes.includes(modeParam as AuthMode)
      ? (modeParam as AuthMode)
      : "signin";

  const auth = useAuthContext();
  const { count: wishlistCount } = useWishlistProducts({ limit: 50 });

  if (!auth.isAuthenticated) {
    return (
      <Layout>
        <div className="container py-12 max-w-md">
          <AuthPanel
            initialMode={initialAuthMode}
            initialEmail={searchParams.get("email") || ""}
            initialOtp={searchParams.get("otp") || ""}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          <AccountSidebar activeTab={tab} />

          <div className="flex-1 min-w-0">
            {tab === "dashboard" && (
              <DashboardTab user={auth.user} wishlistCount={wishlistCount} />
            )}
            {tab === "orders" && <OrdersTab />}
            {tab === "wishlist" && <WishlistTab />}
            {tab === "addresses" && <AddressesTab />}
            {tab === "settings" && <SettingsTab user={auth.user} />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
