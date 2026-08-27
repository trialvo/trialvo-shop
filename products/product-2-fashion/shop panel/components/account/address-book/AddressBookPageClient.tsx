"use client";

import AccountLayout from "@/components/account/AccountLayout";
import AccountSidebar from "@/components/account/AccountSidebar";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="space-y-4">
      <div className="border-b border-[#E5E5E5] pb-3">
        <Skeleton className="h-7 w-40 rounded-sm" />
      </div>

      <div className="overflow-hidden rounded-md border border-[#E5E5E5] bg-white">
        <div className="border-b border-[#E5E5E5] px-4 pt-3.5 pb-3">
          <Skeleton className="h-4 w-32 rounded-sm" />
        </div>

        <div className="flex flex-col items-center px-6 py-12">
          <Skeleton className="h-12 w-12 rounded-md" />
          <Skeleton className="mt-4 h-4 w-36 rounded-sm" />
          <Skeleton className="mt-2 h-3 w-56 rounded-sm" />
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
    <section className="container mx-auto px-3 pb-10 pt-2 min-[768px]:px-0 min-[768px]:pb-14 min-[768px]:pt-0">
      {isLangReady ? (
        <Breadcrumbs
          items={[
            { label: t("breadcrumb.home"), href: "/" },
            { label: t("account.account"), href: "/account" },
            { label: t("account.addressBook.addressBookPage") },
          ]}
        />
      ) : (
        <BreadcrumbSkeleton />
      )}

      <div className="mt-2 min-[768px]:mb-14">
        <AccountLayout sidebar={<AccountSidebar activeKey="address-book" />}>
          {showSkeleton ? (
            <ContentSkeleton />
          ) : (
            <div className="space-y-4">
              <h1 className="border-b border-[#E5E5E5] pb-3 text-xl font-semibold tracking-tight text-black min-[768px]:text-[22px]">
                {t("account.addressBook.addressBookPage")}
              </h1>

              <div className="overflow-hidden rounded-md border border-[#E5E5E5] bg-white transition-shadow duration-200 ease-out hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="border-b border-[#E5E5E5] px-4 py-3.5">
                  <h2 className="text-[15px] font-semibold text-black">
                    {t("account.addressBook.deliveryAddress")}
                  </h2>
                </div>

                <div className="space-y-0 p-4">
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

                  <div className="mt-5 border-t border-[#E5E5E5] pt-5">
                    <AddNewDeliveryAddressForm />
                  </div>
                </div>
              </div>
            </div>
          )}
        </AccountLayout>
      </div>
    </section>
  );
};

export default AddressBookPageClient;
