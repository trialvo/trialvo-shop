"use client";

import AccountLayout from "@/components/account/AccountLayout";
import AccountSidebar from "@/components/account/AccountSidebar";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAddress } from "@/hooks/useAddress";
import { usePhone } from "@/hooks/usePhone";
import { openConfirmDelete } from "@/lib/modal/confirm-delete";
import { openVerifyIdentity } from "@/lib/modal/verify-identity";
import { useAppDispatch } from "@/redux/hooks";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "next/navigation";
import React from "react";
import AddNewDeliveryAddressForm from "./AddNewAddress";
import AddressListPanel from "./AddressListPanel";

// ─── Skeletons ───────────────────────────────────────────────────────────────

function BreadcrumbSkeleton() {
  return (
    <div className="flex items-center gap-2 py-3">
      <Skeleton className="h-3.5 w-12 rounded" />
      <Skeleton className="h-3.5 w-3 rounded" />
      <Skeleton className="h-3.5 w-16 rounded" />
      <Skeleton className="h-3.5 w-3 rounded" />
      <Skeleton className="h-3.5 w-24 rounded" />
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-3">
      {/* Title skeleton */}
      <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
        <Skeleton className="h-7 w-40 rounded" />
      </div>

      {/* Tabs + cards skeleton */}
      <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
        {/* Tab bar skeleton */}
        <div className="border-b border-[#D9D9D9] pb-3 pt-2">
          <Skeleton className="h-4 w-32 rounded" />
        </div>

        {/* Address cards skeleton */}
        <div className="space-y-4 pt-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative">
              <div className="flex items-center justify-between border border-[#EDEDED] px-4 py-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="mt-1 h-5 w-5 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20 rounded-none" />
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3.5 w-64 rounded" />
                  </div>
                </div>
              </div>
              <div className="absolute right-4 top-4 z-10">
                <Skeleton className="h-5 w-24 rounded-none" />
              </div>
              <div className="absolute bottom-2 right-4 z-10 flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-none" />
                <Skeleton className="h-9 w-9 rounded-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const AddressBookPageClient: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { addresses, addressesLoading, deleteAddress, setDefaultAddress } = useAddress();
  const { verifyPhone, verifyPhoneOTP } = usePhone();
  const { t, isLangReady } = useTranslation();

  const [deliverySelected, setDeliverySelected] = React.useState<string>("");

  React.useEffect(() => {
    if (!addresses.length) return;

    setDeliverySelected((prev) => {
      if (prev && addresses.some((a) => String(a.id) === prev)) return prev;

      const def = addresses.find((a) => a.is_default === 1);
      if (def?.id != null) return String(def.id);

      const first = addresses[0];
      return first?.id == null ? "" : String(first.id);
    });
  }, [addresses, addressesLoading]);

  const handleDelete = (id: string | number) => {
    const idStr = String(id);

    openConfirmDelete(
      dispatch,
      async () => {
        await deleteAddress(Number(idStr));
        router.refresh();
        setDeliverySelected((prev) => (prev === idStr ? "" : prev));
      },
      {
        title: t("checkout.deleteAddressTitle"),
        description: t("checkout.deleteAddressDesc"),
        cancelText: t("checkout.notNow"),
        confirmText: t("checkout.yesDelete"),
      },
    );
  };

  const handleEdit = (id: string | number) => {
    router.push(`/account/address/${id}/edit`);
  };

  const handleMakeDefault = async (id: string | number) => {
    setDeliverySelected(String(id));
    try {
      const res = await setDefaultAddress(id);
      return res;
    } catch {
      // Error handled in mutation
    }
  };

  const handleVerifyPhone = async (phoneId: number, phoneNumber: string) => {
    try {
      await verifyPhone(phoneId);
      openVerifyIdentity(
        dispatch,
        {
          onVerify: async (code) => {
            await verifyPhoneOTP(phoneId, code);
          },
          onResend: async () => {
            await verifyPhone(phoneId);
          },
        },
        {
          maskedTarget: phoneNumber,
          length: 6,
          title: "Verify Phone Number",
          description: "Enter the OTP sent to the phone number linked to this address.",
        },
      );
    } catch {
      // Error dispatched inside mutations
    }
  };

  const showSkeleton = !isLangReady || addressesLoading;

  return (
    <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
      {isLangReady ? (
        <Breadcrumbs items={[{ label: t("breadcrumb.home"), href: "/" }, { label: t("account.account"), href: "/account" }, { label: t("account.addressBook.addressBookPage") }]} />
      ) : (
        <BreadcrumbSkeleton />
      )}

      <div className="sm:mb-17.5">
        <AccountLayout sidebar={<AccountSidebar activeKey="address-book" />}>
          {showSkeleton ? (
            <ContentSkeleton />
          ) : (
            <div className="space-y-3">
              <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
                <h1 className="text-2xl font-bold">{t("account.addressBook.addressBookPage")}</h1>
              </div>

              <div className="border-0 bg-white p-4 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
                <Tabs defaultValue="delivery" className="w-full">
                  <TabsList
                    className={`
                      h-auto w-full justify-start gap-0
                      rounded-none bg-transparent p-0
                      border-b border-[#D9D9D9]
                    `}
                  >
                    <TabsTrigger
                      value="delivery"
                      className={`
                        rounded-none px-0 pb-3 pt-2 text-sm font-semibold
                        data-[state=active]:border-b-2 data-[state=active]:border-black
                        data-[state=active]:text-black
                        text-black/70
                      `}
                    >
                      {t("account.addressBook.deliveryAddress")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="delivery" className="m-0 space-y-6 pt-5">
                    <AddressListPanel
                      isLoading={false}
                      items={addresses}
                      value={deliverySelected}
                      onChange={setDeliverySelected}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onMakeDefault={handleMakeDefault}
                      onVerifyPhone={handleVerifyPhone}
                      skeletonCount={3}
                    />

                    <AddNewDeliveryAddressForm />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </AccountLayout>
      </div>
    </section>
  );
};

export default AddressBookPageClient;
