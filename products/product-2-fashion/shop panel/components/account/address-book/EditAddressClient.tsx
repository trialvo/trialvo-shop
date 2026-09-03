"use client";

import AccountEditPageHeader from "@/components/account/AccountEditPageHeader";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import CustomerInformationForm, {
  type CustomerInformationValues,
} from "@/form/CustomerInformationForm";
import { useAddress } from "@/hooks/useAddress";
import type { UpdateAddressPayload } from "@/lib/api/address/service";
import { useParams, useRouter } from "next/navigation";
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

function EditAddressSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-40 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-8 w-56 rounded" />
        <Skeleton className="h-4 w-full max-w-md rounded" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-black/8 bg-white p-5">
        <Skeleton className="h-5 w-36 rounded" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

const EditAddressClient: React.FC = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id);
  const safeId = Number.isFinite(id) ? id : 0;
  const { t } = useTranslation();

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
      if (res && !res.error) {
        router.push("/account/address");
      }
      return res;
    } catch {
      // handled in mutation
    }
  };

  return (
    <section className="container mx-auto px-3 pb-28 pt-2 min-[640px]:pb-14 min-[768px]:px-0 min-[768px]:pt-0">
      <Breadcrumbs
        items={[
          { label: t("breadcrumb.home"), href: "/" },
          { label: t("account.account"), href: "/account" },
          { label: t("account.editAddress.address"), href: "/account/address" },
          { label: t("account.editAddress.edit") },
        ]}
      />

      <div className="mt-2 min-[768px]:mb-14">
        <AccountLayout sidebar={<AccountSidebar activeKey="address-book" />}>
          {isLoading ? (
            <EditAddressSkeleton />
          ) : (
            <div className="space-y-6">
              <AccountEditPageHeader
                eyebrow={t("account.addressBook.title")}
                title={t("account.editAddress.editAddress")}
                description={t("account.editAddress.description")}
                backHref="/account/address"
                backLabel={t("account.backToAddressBook")}
              />

              <div className="rounded-2xl border border-black/8 bg-white">
                <div className="border-b border-black/6 px-4 py-4 min-[768px]:px-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
                    {t("account.editAddress.deliveryAddress")}
                  </p>
                </div>

                <div className="px-4 py-5 min-[768px]:px-5 min-[768px]:py-6">
                  <CustomerInformationForm
                    defaultValues={defaultValues}
                    onSubmit={handleSubmit}
                    isLoading={isUpdating}
                    deferSubmit
                    cancelAsBack
                  />
                </div>
              </div>
            </div>
          )}
        </AccountLayout>
      </div>
    </section>
  );
};

export default EditAddressClient;
