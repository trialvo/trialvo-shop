"use client";

import CustomerInformationForm, { type CustomerInformationValues, type CustomerInformationFormRef } from "@/form/CustomerInformationForm";
import { useTranslation } from "@/hooks/useTranslation";
import type { UpdateGuestOrderPayload } from "@/lib/api/guest-order/service";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectGuestId } from "@/redux/selectors/cartSelectors";
import { openModal } from "@/redux/slices/modalManagerSlice";
import Link from "next/link";
import React from "react";
import { FiLogIn } from "react-icons/fi";

type Props = {
  onGuestInfoUpdate?: (data: UpdateGuestOrderPayload) => void;
  formRef?: React.Ref<CustomerInformationFormRef>;
  /** Driven by admin permission: is_email_required */
  emailRequired?: boolean;
};


const CustomerInformation: React.FC<Props> = ({ onGuestInfoUpdate, formRef, emailRequired = false }) => {

  const dispatch = useAppDispatch();
  const { t } = useTranslation();
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
      <div className="mb-5 flex items-center justify-between gap-3 border border-[#E5E5E5] px-4 py-3">
        <p className="text-sm text-black/55">{t("checkout.alreadyHaveAccount")}</p>
        <button
          type="button"
          onClick={() => {
            dispatch(openModal({ key: "signIn", payload: { forgotHref: "/forgot-password", createHref: "/sign-up" } }));
          }}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-black underline-offset-2 hover:underline"
        >
          <FiLogIn className="h-4 w-4" />
          {t("common.signIn")}
        </button>
      </div>

      <CustomerInformationForm
        ref={formRef}
        onSubmit={handleAutoUpdate}
        emailRequired={emailRequired}
      />

      <p className="mt-3 text-xs leading-relaxed text-black/45">
        <Link href="/sign-in" className="font-medium text-black hover:underline">
          {t("common.signIn")}
        </Link>
        {" or "}
        <Link href="/sign-up" className="font-medium text-black hover:underline">
          {t("auth.createAccountTitle")}
        </Link>
        {" to save addresses for next time."}
      </p>
    </section>
  );
};

export default CustomerInformation;
