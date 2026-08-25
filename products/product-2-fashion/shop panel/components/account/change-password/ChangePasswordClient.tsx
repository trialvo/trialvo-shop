"use client";

import ChangePasswordForm from "@/components/account/change-password/ChangePasswordForm";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import AccountLayout from "../AccountLayout";
import AccountSidebar from "../AccountSidebar";

const ChangePasswordClient: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const hasPassword = user?.has_password ?? false;

  return (
    <section className="container mx-auto px-3 pb-10 pt-11 min-[768px]:px-0 min-[768px]:pb-14 min-[768px]:pt-0">
      <Breadcrumbs
        items={[
          { label: t("breadcrumb.home"), href: "/" },
          { label: t("account.account"), href: "/account" },
          { label: t("account.changePassword.title") },
        ]}
      />

      <div className="mt-2 min-[768px]:mb-14">
        <AccountLayout sidebar={<AccountSidebar activeKey="change-password" />}>
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[#E5E5E5] pb-3">
              <h1 className="text-xl font-semibold tracking-tight text-black min-[768px]:text-[22px]">
                {hasPassword
                  ? t("account.changePassword.title")
                  : t("account.changePassword.setPassword")}
              </h1>
              <p className="mb-0.5 text-xs text-black/55">
                {t("account.changePassword.for")}{" "}
                <span className="font-medium text-black">
                  {user?.email ?? "No Email Found!"}
                </span>
              </p>
            </div>

            <div className="overflow-hidden rounded-md border border-[#E5E5E5] bg-white p-4 transition-shadow duration-200 ease-out hover:shadow-[0_1px_3px_rgba(0,0,0,0.04)] min-[768px]:p-5">
              <ChangePasswordForm hasPassword={hasPassword} />
            </div>
          </div>
        </AccountLayout>
      </div>
    </section>
  );
};

export default ChangePasswordClient;
