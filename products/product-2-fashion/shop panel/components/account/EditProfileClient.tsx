"use client";

import AccountEditPageHeader from "@/components/account/AccountEditPageHeader";
import EditProfileForm, { EditProfileValues } from "@/form/EditProfileForm";
import { useAuth } from "@/hooks/useAuth";
import { useReturnTo } from "@/hooks/useReturnTo";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import Breadcrumbs from "../breadcrumb/Breadcrumbs";
import AccountLayout from "./AccountLayout";
import AccountSidebar from "./AccountSidebar";

const EditProfileClient = () => {
  const { updateProfile } = useAuth();
  const { t } = useTranslation();
  const { returnTo, navigateBack } = useReturnTo("/account");

  const handleSubmit = async (values: EditProfileValues) => {
    await updateProfile({
      first_name: values.first_name,
      last_name: values.last_name || "",
      email: values.email,
      gender: values.gender || "",
      dob: values.dob ?? null,
      phone: values.phone || "",
      profile: values.profile ?? null,
    });
    navigateBack();
  };

  const backLabel =
    returnTo.startsWith("/account/address")
      ? t("account.backToAddressBook")
      : returnTo.startsWith("/checkout")
        ? t("back")
        : t("account.backToAccount");

  return (
    <section className="container mx-auto px-3 pb-28 pt-2 min-[640px]:pb-14 min-[768px]:px-0 min-[768px]:pt-0">
      <Breadcrumbs
        items={[
          { label: t("breadcrumb.home"), href: "/" },
          { label: t("account.account"), href: "/account" },
          { label: t("account.profileEdit") },
        ]}
      />

      <div className="mt-2 min-[768px]:mb-14">
        <AccountLayout sidebar={<AccountSidebar activeKey="account-details" />}>
          <div className="space-y-6">
            <AccountEditPageHeader
              eyebrow={t("account.myAccount")}
              title={t("account.editProfile")}
              description={t("account.profileEditDescription")}
              onBack={navigateBack}
              backLabel={backLabel}
            />

            <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
              <div className="border-b border-black/6 px-4 py-4 min-[768px]:px-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
                  {t("account.personalProfile.title")}
                </p>
              </div>

              <div className="px-4 py-5 min-[768px]:px-5 min-[768px]:py-6">
                <EditProfileForm
                  onCancel={navigateBack}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          </div>
        </AccountLayout>
      </div>
    </section>
  );
};

export default EditProfileClient;
