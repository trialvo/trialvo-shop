"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import CustomerInformationForm, {
  type CustomerInformationValues,
} from "@/form/CustomerInformationForm";
import { useAddress } from "@/hooks/useAddress";
import { usePhone } from "@/hooks/usePhone";
import type { UpdateAddressPayload } from "@/lib/api/address/service";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import AccountLayout from "../AccountLayout";
import AccountSidebar from "../AccountSidebar";

function normalizeAddressType(v: unknown): "home" | "office" | "na" | undefined {
  const s = String(v ?? "").trim().toLowerCase();

  if (s === "home") return "home";
  if (s === "office") return "office";

  if (s === "n/a" || s === "na") return "na";

  return undefined;
}

function cleanText(v: unknown): string | undefined {
  const s = String(v ?? "").trim();
  return s.length ? s : undefined;
}

const EditAddressClient: React.FC = () => {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const safeId = Number.isFinite(id) ? id : 0;
  const { t } = useTranslation();

  const { phones } = usePhone();
  const { useAddressById, updateAddress, isUpdating } = useAddress();

  const { data: singleAddress, isLoading } = useAddressById(safeId);

  const defaultValues: Partial<CustomerInformationValues> = React.useMemo(() => {
    const addr = singleAddress?.address;

    return {
      addressType: normalizeAddressType(addr?.type) ?? "home",
      fullName: cleanText(addr?.name) ?? "",
      mobile: cleanText(addr?.phone?.number) ?? "",
      city: cleanText(addr?.city) ?? "",
      area_name: cleanText(addr?.area_name ?? "") ?? "",
      location_mapping_id: addr?.location_mapping_id ?? undefined,
      deliveryAddress: cleanText(addr?.full_address) ?? "",
    };
  }, [singleAddress]);

  const handleSubmit = async (values: CustomerInformationValues) => {
    try {
      const payload: UpdateAddressPayload = {
        name: values.fullName.trim(),
        phone: values.mobile?.trim() || undefined,
        type: values.addressType,
        full_address: values.deliveryAddress.trim(),
        city: values.city?.trim() || undefined,
        location_mapping_id: values.location_mapping_id ?? null,
      };

      const res = await updateAddress(safeId, payload);
      return res;
    } catch {
      // handled in mutation
    }
  };

  return (
    <section className="container mx-auto px-1.5 pb-6 pt-11 sm:px-0 sm:pt-0">
      <Breadcrumbs
        items={[
          { label: t("breadcrumb.home"), href: "/" },
          { label: t("account.account"), href: "/account" },
          { label: t("account.editAddress.address"), href: "/account/address" },
          { label: t("account.editAddress.edit") },
        ]}
      />

      <AccountLayout sidebar={<AccountSidebar activeKey="address-book" />}>
        <div className="space-y-4">
          <div className="border-0 bg-white px-4 py-2.5 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]">
            <h1 className="text-2xl font-semibold">{t("account.editAddress.editAddress")}</h1>
          </div>

          <div className={cn("border-0 bg-white px-4 py-2.5 shadow-[0px_0px_10px_rgba(0,0,0,0.12)]")}>
            <h2 className="text-lg font-semibold">{t("account.editAddress.deliveryAddress")}</h2>

            <div className="mt-4">
              <CustomerInformationForm
                defaultValues={defaultValues}
                onSubmit={handleSubmit}
                isLoading={isLoading || isUpdating}
              />
            </div>
          </div>
        </div>
      </AccountLayout>
    </section>
  );
};

export default EditAddressClient;
