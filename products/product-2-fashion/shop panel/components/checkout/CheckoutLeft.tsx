"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import React from "react";

import DeliverySelector from "@/components/delivery/DeliverySelector";
import PaymentMethod from "@/components/payment/PaymentMethod";

import { useAddress } from "@/hooks/useAddress";
import { usePhone } from "@/hooks/usePhone";
import { UpdateGuestOrderPayload } from "@/lib/api/guest-order/service";
import { CustomerInformationFormRef } from "@/form/CustomerInformationForm";
import { openConfirmDelete } from "@/lib/modal/confirm-delete";
import { openVerifyIdentity } from "@/lib/modal/verify-identity";
import { useAppDispatch } from "@/redux/hooks";
import { openModal } from "@/redux/slices/modalManagerSlice";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "next/navigation";
import { PiShoppingCartLight } from "react-icons/pi";
import AddressListPanel from "../account/address-book/AddressListPanel";
import AddressHeader from "../address-selector/AddressHeader";
import CustomerInformation from "./CustomerInformation";

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
    <Card className="rounded-none border-none! shadow-[0px_0px_10px_rgba(0,0,0,0.10)] bg-white px-2 sm:px-6 sm:py-4.25 gap-2 sm:gap-6">
      <div className="flex items-center gap-2">
        <PiShoppingCartLight className="h-6 w-6" />
        <h1 className="text-[22px] font-semibold">{t("checkout.title")}</h1>
      </div>

      <div className="space-y-4">
        <div className="space-y-2" data-checkout-error="addressId">
          {isAuthenticate && (
            <AddressHeader
              onAddNew={handleOpen}
            />
          )}

          {errors?.addressId ? (
            <p className="text-xs font-medium text-red-600">{errors.addressId}</p>
          ) : null}

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

        </div>

        <div className="space-y-1" data-checkout-error="deliveryChargeId">
          {errors?.deliveryChargeId ? (
            <p className="text-xs font-medium text-red-600">{errors.deliveryChargeId}</p>
          ) : null}

          <DeliverySelector value={deliveryChargeId} onChange={setDeliveryChargeId} />
        </div>

        <div className="space-y-1" data-checkout-error="paymentProvider">
          {errors?.paymentProvider ? (
            <p className="text-xs font-medium text-red-600">{errors.paymentProvider}</p>
          ) : null}

          <PaymentMethod value={paymentProvider} onChange={setPaymentProvider} />
        </div>

        <div className="pt-2 sm:sticky sm:z-10 sm:-bottom-5">
          <Button
            type="button"
            onClick={onPlaceOrder}
            className="hidden sm:block h-12 w-full rounded-none bg-black text-white hover:bg-black/90"
            disabled={Boolean(isSubmitting)}
            isLoading={Boolean(isSubmitting)}
          >
            {t("checkout.placeOrder")}
          </Button>

          <p className="sm:mt-2 text-center text-xs text-muted-foreground">
            {t("checkout.agreeTerms")}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default CheckoutLeft;
