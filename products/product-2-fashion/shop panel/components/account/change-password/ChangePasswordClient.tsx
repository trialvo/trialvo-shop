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
        <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
            <Breadcrumbs
                items={[
                    { label: t("breadcrumb.home"), href: "/" },
                    { label: t("account.account"), href: "/account" },
                    { label: t("account.changePassword.title") }
                ]}
            />

            <div className="sm:mb-11.5">
                <AccountLayout sidebar={<AccountSidebar activeKey="change-password" />}>
                    <div className="space-y-3">
                        <div className="flex items-center flex-col sm:flex-row justify-between border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] bg-white p-4">
                            <h1 className="text-2xl font-bold text-black">
                                {hasPassword ? t("account.changePassword.title") : t("account.changePassword.setPassword")}
                            </h1>

                            <p className="text-sm text-black">
                                {t("account.changePassword.for")} <span className="font-bold">{user?.email ?? "No Email Found!"}</span>
                            </p>
                        </div>

                        <div className="border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] bg-white p-4">
                            <ChangePasswordForm hasPassword={hasPassword} />
                        </div>
                    </div>
                </AccountLayout>
            </div>
        </section>
    );
};

export default ChangePasswordClient;
