"use client";

import React from "react";

import CustomerInformationForm, {
  type CustomerInformationValues,
} from "@/form/CustomerInformationForm";
import { useAddress } from "@/hooks/useAddress";
import { useTranslation } from "@/hooks/useTranslation";
import type { CreateAddressPayload } from "@/lib/api/address/service";

type Props = {
  onOpenChange?: (open?: boolean) => void;
};

const AddNewDeliveryAddressForm: React.FC<Props> = ({ onOpenChange }) => {
  const { createAddress, isCreating } = useAddress();
  const { t } = useTranslation();

  const handleSubmit = async (values: CustomerInformationValues) => {
    try {
      const payload: CreateAddressPayload = {
        name: values.fullName.trim(),
        phone: (values.mobile ?? "").trim() || undefined,
        type: values.addressType,
        full_address: values.deliveryAddress.trim(),
        city: values.city?.trim() || undefined,
        location_mapping_id: values.location_mapping_id ?? null,
      };

      const res = await createAddress(payload);
      if (res && onOpenChange) {
        onOpenChange(false);
      }

      return res;
    } catch {
      // Error handled in mutation
    }
  };

  return (
    <section className="space-y-4">
      <div className="border-b border-[#F0F0F0] pb-3">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-black/40">
          {t("account.addressBook.addNewSectionLabel")}
        </p>
        <h3 className="mt-1 text-[15px] font-semibold text-[#191919]">
          {t("account.addressBook.addNewDeliveryAddress")}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-black/50">
          {t("account.addressBook.addNewDesc")}
        </p>
      </div>

      <CustomerInformationForm
        onSubmit={handleSubmit}
        isLoading={isCreating}
        deferSubmit
        clearOnCancel
      />
    </section>
  );
};

export default AddNewDeliveryAddressForm;
