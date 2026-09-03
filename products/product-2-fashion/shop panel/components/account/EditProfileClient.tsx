"use client";

import AccountEditPageHeader from "@/components/account/AccountEditPageHeader";
import EditProfileForm, { EditProfileValues } from "@/form/EditProfileForm";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "next/navigation";
import React from "react";
import Breadcrumbs from "../breadcrumb/Breadcrumbs";
import AccountLayout from "./AccountLayout";
import AccountSidebar from "./AccountSidebar";

const EditProfileClient = () => {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const { t } = useTranslation();

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
    router.push("/account");
  };

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
              backHref="/account"
              backLabel={t("account.backToAccount")}
            />

            <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
              <div className="border-b border-black/6 px-4 py-4 min-[768px]:px-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
                  {t("account.personalProfile.title")}
                </p>
              </div>

              <div className="px-4 py-5 min-[768px]:px-5 min-[768px]:py-6">
                <EditProfileForm
                  onCancel={() => router.push("/account")}
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
