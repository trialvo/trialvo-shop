"use client";

import { Button } from "@/components/ui/button";
import React from "react";

import DeliverySelector from "@/components/delivery/DeliverySelector";
import PaymentMethod from "@/components/payment/PaymentMethod";

import { useAddress } from "@/hooks/useAddress";
import { usePhone } from "@/hooks/usePhone";
import { UpdateGuestOrderPayload } from "@/lib/api/guest-order/service";
import { CustomerInformationFormRef } from "@/form/CustomerInformationForm";
import { openConfirmDelete } from "@/lib/modal/confirm-delete";
import { openVerifyIdentity } from "@/lib/modal/verify-identity";
import { rememberReturnPath } from "@/lib/navigation/return-to";
import { useAppDispatch } from "@/redux/hooks";
import { openModal } from "@/redux/slices/modalManagerSlice";
import { useTranslation } from "@/hooks/useTranslation";
import { usePathname, useRouter } from "next/navigation";
import AddressListPanel from "../account/address-book/AddressListPanel";
import CustomerInformation from "./CustomerInformation";
import { FiPlus } from "react-icons/fi";

type Props = {
  isAuthenticate: boolean;

  selectedAddressId: string;
  onSelectAddress: React.Dispatch<React.SetStateAction<string>>;

  deliveryChargeId: string;
  setDeliveryChargeId: React.Dispatch<React.SetStateAction<string>>;

  paymentProvider: string;
  setPaymentProvider: React.Dispatch<React.SetStateAction<string>>;

  coupon: string;
  setCoupon: React.Dispatch<React.SetStateAction<string>>;

  errors?: {
    addressId?: string;
    deliveryChargeId?: string;
    paymentProvider?: string;
  };

  onPlaceOrder?: () => void;
  isSubmitting?: boolean;
  onGuestInfoUpdate?: (data: UpdateGuestOrderPayload) => void;
  guestFormRef?: React.RefObject<CustomerInformationFormRef | null>;
  /** Driven by admin permission: is_email_required */
  emailRequired?: boolean;
};

function CheckoutSection({
  title,
  action,
  error,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-black">{title}</h2>
        {action}
      </div>
      {error ? <p className="mb-2 text-xs font-medium text-red-600">{error}</p> : null}
      {children}
    </section>
  );
}

const CheckoutLeft: React.FC<Props> = ({
  isAuthenticate,
  selectedAddressId,
  onSelectAddress,

  deliveryChargeId,
  setDeliveryChargeId,

  paymentProvider,
  setPaymentProvider,

  coupon,
  setCoupon,

  errors,
  onPlaceOrder,
  isSubmitting,
  onGuestInfoUpdate,
  guestFormRef,
  emailRequired = false,
}) => {

  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const { addresses, addressesLoading, deleteAddress, setDefaultAddress } = useAddress();
  const { verifyPhone, verifyPhoneOTP } = usePhone();

  const [initialGateLoading, setInitialGateLoading] = React.useState(true);

  React.useEffect(() => {
    const t = window.setTimeout(() => setInitialGateLoading(false), 0);
    return () => window.clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (!addresses.length) return;

    onSelectAddress((prev) => {
      if (prev && addresses.some((a) => String(a.id) === prev)) return prev;

      const def = addresses.find((a) => a.is_default === 1);
      if (def?.id != null) return String(def.id);

      const first = addresses[0];
      return first?.id == null ? "" : String(first.id);
    });
  }, [addresses, addressesLoading, onSelectAddress]);

  const handleDelete = (id: string | number) => {
    const idStr = String(id);

    openConfirmDelete(
      dispatch,
      async () => {
        await deleteAddress(Number(idStr));
        router.refresh();
        onSelectAddress((prev) => (prev === idStr ? "" : prev));
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
    rememberReturnPath(pathname || "/checkout");
    router.push(`/account/address/${id}/edit`);
  };

  const handleMakeDefault = async (id: string | number) => {
    onSelectAddress(String(id));
    try {
      const res = await setDefaultAddress(id);
      return res;
    } catch {
      // handled in mutation
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

  const showTopSectionSkeleton = initialGateLoading;

  const handleOpen = () => {
    dispatch(
      openModal({
        key: "customerAddress"
      }),
    );
  };

  return (
    <div className="space-y-8">
      <div data-checkout-error="addressId">
        <CheckoutSection
          title={isAuthenticate ? t("checkout.deliveryAddress") : t("checkout.customerInfo")}
          error={errors?.addressId}
          action={
            isAuthenticate ? (
              <button
                type="button"
                onClick={handleOpen}
                className="inline-flex shrink-0 items-center gap-1 text-sm text-black/70 underline-offset-2 hover:text-black hover:underline"
              >
                <FiPlus className="h-3.5 w-3.5" />
                {t("checkout.addAddress")}
              </button>
            ) : undefined
          }
        >
          {showTopSectionSkeleton ? (
            <AddressListPanel
              isLoading
              items={[]}
              value={selectedAddressId}
              onChange={onSelectAddress}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMakeDefault={handleMakeDefault}
              skeletonCount={3}
            />
          ) : isAuthenticate ? (
            <AddressListPanel
              isLoading={addressesLoading}
              items={addresses}
              value={selectedAddressId}
              onChange={onSelectAddress}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMakeDefault={handleMakeDefault}
              onVerifyPhone={handleVerifyPhone}
              skeletonCount={3}
            />
          ) : (
            <CustomerInformation onGuestInfoUpdate={onGuestInfoUpdate} formRef={guestFormRef} emailRequired={emailRequired} />
          )}
        </CheckoutSection>
      </div>

      <div className="h-px bg-[#E5E5E5]" />

      <div data-checkout-error="deliveryChargeId">
        <CheckoutSection
          title={t("checkout.deliveryArea")}
          error={errors?.deliveryChargeId}
        >
          <DeliverySelector hideTitle value={deliveryChargeId} onChange={setDeliveryChargeId} />
        </CheckoutSection>
      </div>

      <div className="h-px bg-[#E5E5E5]" />

      <div data-checkout-error="paymentProvider">
        <CheckoutSection
          title={t("checkout.paymentMethod")}
          error={errors?.paymentProvider}
        >
          <PaymentMethod hideTitle value={paymentProvider} onChange={setPaymentProvider} />
        </CheckoutSection>
      </div>

      <div className="hidden sm:block">
        <Button
          type="button"
          onClick={onPlaceOrder}
          className="h-12 w-full rounded-[4px] bg-black text-[15px] font-semibold text-white hover:bg-black/90 focus-visible:ring-2 focus-visible:ring-black/30"
          disabled={Boolean(isSubmitting)}
          isLoading={Boolean(isSubmitting)}
        >
          {t("checkout.placeOrder")}
        </Button>
        <p className="mt-2.5 text-center text-xs text-black/40">
          {t("checkout.agreeTerms")}
        </p>
      </div>
    </div>
  );
};

export default CheckoutLeft;
