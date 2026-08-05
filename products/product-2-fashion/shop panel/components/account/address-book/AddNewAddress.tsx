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
    <section className="space-y-4 pt-2">
      <h3 className="text-base font-semibold">{t("account.addressBook.addNewDeliveryAddress")}</h3>
      <CustomerInformationForm onSubmit={handleSubmit} isLoading={isCreating} />
    </section>
  );
};

export default AddNewDeliveryAddressForm;
