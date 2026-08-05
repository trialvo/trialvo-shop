"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys, useAuth } from "@/hooks/useAuth";
import { useAccountAddresses } from "@/hooks/useAccountAddresses";
import { useCancelOrder, useOrders } from "@/hooks/useOrders";
import { useLogout } from "@/hooks/useLogout";
import { mapApiUserToUiUser } from "@/store/slices/authSlice";
import { toast } from "sonner";
import { SettingsSidebar, ProfileTab, AddressTab, NotificationsTab, SecurityTab } from "@/components/settings";
import type { SettingsTab } from "@/components/settings/SettingsSidebar";

import { OrderCard } from "@/components/order";
import { ConfirmationModal, AuthGuard, PageShell } from "@/components/shared";
import type { PasswordFormData, ProfileFormData } from "@/lib/validation/profile";
import type { Address } from "@/types";

const ORDERS_QUERY_PARAMS = {
  limit: 50,
  offset: 0,
  sort_by: "created_at",
  sort_order: "desc",
} as const;

const SETTINGS_TABS: readonly SettingsTab[] = [
  "profile",
  "orders",
  "addresses",
  "notifications",
  "security",
];

export default function SettingsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { logout } = useLogout();
  const {
    user: apiUser,
    isAuthenticated,
    isLoading,
    updateProfile,
    changePassword,
    isUpdatingProfile,
    isPasswordChanging,
  } = useAuth();

  const activeTab = getSettingsTab(searchParams.get("tab"));
  const setActiveTab = useCallback(
    (tab: SettingsTab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", tab);
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Confirmation modals
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [cancelOrderTarget, setCancelOrderTarget] = useState<string | null>(null);
  const [deleteAddressTarget, setDeleteAddressTarget] = useState<string | null>(null);

  const uiUser = useMemo(
    () => (apiUser ? mapApiUserToUiUser(apiUser) : null),
    [apiUser],
  );

  const {
    addresses,
    isLoading: addressesLoading,
    error: addressesError,
    createAddress,
    updateAddress: saveAddress,
    deleteAddress,
    isSaving: addressSaving,
  } = useAccountAddresses(isAuthenticated);

  const settingsUser = useMemo(
    () => (uiUser ? { ...uiUser, addresses } : null),
    [addresses, uiUser],
  );

  const ordersEnabled = isAuthenticated && activeTab === "orders";
  const {
    orders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useOrders(ORDERS_QUERY_PARAMS, ordersEnabled);
  const cancelOrderMutation = useCancelOrder();

  useEffect(() => {
    if (searchParams.get("tab") === activeTab) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", activeTab);
    router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
  }, [activeTab, pathname, router, searchParams]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSaveProfile = async (data: ProfileFormData) => {
    if (!apiUser) return;

    if (data.email.trim().toLowerCase() !== apiUser.email.trim().toLowerCase()) {
      toast.error("Email changes require verification and are not available here.");
      return;
    }

    try {
      await updateProfile({
        ...splitFullName(data.name),
        phone: data.phone?.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: authKeys.user() });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Profile update failed"));
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    try {
      await changePassword({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Password updated successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Password update failed"));
      throw error;
    }
  };

  const handleAddAddress = async (addr: Omit<Address, "id">) => {
    try {
      const result = await createAddress(addr);
      toast.success("Address added");
      if (result.defaultAddressError) toast.error(result.defaultAddressError);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to add address"));
      throw error;
    }
  };

  const handleEditAddress = async (addr: Address) => {
    try {
      const result = await saveAddress(addr);
      toast.success("Address updated");
      if (result.defaultAddressError) toast.error(result.defaultAddressError);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update address"));
      throw error;
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      toast.success("Address removed");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove address"));
      throw error;
    }
  };

  const handleCancelOrder = async (id: string) => {
    try {
      await cancelOrderMutation.mutateAsync(id);
      toast.success("Order cancelled");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to cancel order"));
      throw error;
    }
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div>
        <AuthGuard
          icon={SettingsIcon}
          heading="Sign in to access settings"
          description="Please sign in to manage your account"
        />
      </div>
    );
  }

  if (!settingsUser || isLoading) {
    return (
      <div>
        <PageShell>
          <p className="text-sm text-muted-foreground">Loading account...</p>
        </PageShell>
      </div>
    );
  }

  return (
    <div>
      <PageShell>
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon size={20} className="text-accent" />
          <h1 className="font-display text-2xl lg:text-3xl font-semibold text-foreground">
            Account Settings
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <SettingsSidebar
            user={settingsUser}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={() => setShowLogoutConfirm(true)}
          />

          {/* Tab content */}
          <div className="flex-1 bg-card border border-border p-4 sm:p-6 lg:p-8 min-w-0">
            {activeTab === "profile" && (
              <ProfileTab
                user={settingsUser}
                saving={isUpdatingProfile}
                onSave={handleSaveProfile}
              />
            )}

            {activeTab === "orders" && (
              <div className="space-y-6">
                <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-foreground">
                  Order History
                </h2>
                {ordersLoading ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">Loading orders...</p>
                  </div>
                ) : ordersError ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-destructive">
                      {ordersError.message || "Unable to load orders"}
                    </p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                    <Link href="/" className="text-xs text-accent hover:text-accent/80 mt-2 inline-block">
                      Start Shopping
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        maxImages={5}
                        onCancel={(id) => setCancelOrderTarget(id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "addresses" && (
              <>
                {addressesLoading ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">Loading addresses...</p>
                  </div>
                ) : addressesError ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-destructive">
                      {addressesError.message || "Unable to load addresses"}
                    </p>
                  </div>
                ) : (
                  <AddressTab
                    addresses={addresses}
                    onAdd={handleAddAddress}
                    onEdit={handleEditAddress}
                    onDelete={(id) => setDeleteAddressTarget(id)}
                    saving={addressSaving}
                  />
                )}
              </>
            )}

            {activeTab === "notifications" && <NotificationsTab />}
            {activeTab === "security" && (
              <SecurityTab
                saving={isPasswordChanging}
                onChangePassword={handleChangePassword}
              />
            )}
          </div>
        </div>
      </PageShell>

      {/* Confirmation modals */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => { logout(); toast.success("Signed out"); }}
        title="Sign Out?"
        message="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
        variant="warning"
      />
      <ConfirmationModal
        isOpen={deleteAddressTarget !== null}
        onClose={() => setDeleteAddressTarget(null)}
        onConfirm={async () => {
          if (deleteAddressTarget) await handleDeleteAddress(deleteAddressTarget);
        }}
        title="Delete Address?"
        message="This address will be permanently removed from your account."
        confirmLabel="Delete"
        variant="danger"
        loading={addressSaving}
      />
      <ConfirmationModal
        isOpen={cancelOrderTarget !== null}
        onClose={() => setCancelOrderTarget(null)}
        onConfirm={async () => {
          if (cancelOrderTarget) await handleCancelOrder(cancelOrderTarget);
        }}
        title="Cancel Order?"
        message="This order will be cancelled. This action cannot be undone."
        confirmLabel="Cancel Order"
        variant="danger"
        loading={cancelOrderMutation.isPending}
      />
    </div>
  );
}

function splitFullName(name: string): { first_name: string; last_name?: string } {
  const [firstName = "", ...rest] = name.trim().split(/\s+/);
  const lastName = rest.join(" ").trim();

  return {
    first_name: firstName,
    ...(lastName ? { last_name: lastName } : {}),
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function getSettingsTab(tab: string | null): SettingsTab {
  return SETTINGS_TABS.includes(tab as SettingsTab) ? (tab as SettingsTab) : "profile";
}
