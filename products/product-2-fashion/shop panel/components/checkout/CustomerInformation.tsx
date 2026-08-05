"use client";

import CustomerInformationForm, { type CustomerInformationValues, type CustomerInformationFormRef } from "@/form/CustomerInformationForm";
import Link from "next/link";
import React from "react";
import { FiInfo, FiLogIn } from "react-icons/fi";

import type { UpdateGuestOrderPayload } from "@/lib/api/guest-order/service";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectGuestId } from "@/redux/selectors/cartSelectors";
import { openModal } from "@/redux/slices/modalManagerSlice";

type Props = {
  onGuestInfoUpdate?: (data: UpdateGuestOrderPayload) => void;
  formRef?: React.Ref<CustomerInformationFormRef>;
  /** Driven by admin permission: is_email_required */
  emailRequired?: boolean;
};


const CustomerInformation: React.FC<Props> = ({ onGuestInfoUpdate, formRef, emailRequired = false }) => {

  const dispatch = useAppDispatch();
  const guestOrderId = useAppSelector(selectGuestId)?.id;

  const lastPayloadRef = React.useRef<string>("");

  const toPayload = (values: CustomerInformationValues): UpdateGuestOrderPayload => ({
    name: values.fullName.trim() || undefined,
    email: values?.email?.trim() || undefined,
    phone: (values.mobile ?? "").trim() || undefined,
    full_address: values.deliveryAddress.trim() || undefined,
    city: values.city?.trim() || undefined,
    location_mapping_id: values.location_mapping_id ?? null,
  });

  const handleAutoUpdate = React.useCallback(
    (values: CustomerInformationValues) => {
      if (!guestOrderId) return;

      const payload = toPayload(values);
      if (payload?.phone) {
        localStorage.setItem("phone_number", payload?.phone);
      }
      const sig = JSON.stringify({ id: guestOrderId, payload });

      if (sig === lastPayloadRef.current) return;
      lastPayloadRef.current = sig;

      if (onGuestInfoUpdate) {
        onGuestInfoUpdate(payload);
      }
    },
    [guestOrderId, onGuestInfoUpdate],
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Customer Information</h2>

        <button
          onClick={() => {
            dispatch(openModal({ key: "signIn", payload: { forgotHref: "/forgot-password", createHref: "/sign-up" } }));
          }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0088FF] hover:underline cursor-pointer"
        >
          <FiLogIn className="h-4 w-4" />
          Sign In
        </button>
      </div>

      <CustomerInformationForm
        ref={formRef}
        onSubmit={handleAutoUpdate}
        emailRequired={emailRequired}
      />


      <div className="flex items-center gap-2 text-[10px] mt-2 text-[#343434]">
        <FiInfo className="h-4 w-4 text-black/60" />
        <span>
          <Link href="/sign-in" className="text-[#0088FF] hover:underline">
            Login
          </Link>{" "}
          or{" "}
          <Link href="/sign-up" className="text-[#0088FF] hover:underline">
            register
          </Link>{" "}
          to save addresses for faster checkout next time
        </span>
      </div>
    </section>
  );
};

export default CustomerInformation;
