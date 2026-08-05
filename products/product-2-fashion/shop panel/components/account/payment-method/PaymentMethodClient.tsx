"use client";

import PaymentMethodsTable from "@/components/account/payment-method/PaymentMethodsTable";
import { MOCK_PAYMENT_METHODS } from "@/components/account/payment-method/mock";
import type { PaymentMethodItem } from "@/components/account/payment-method/types";
import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { useAppDispatch } from "@/redux/hooks";
import { openModal } from "@/redux/slices/modalManagerSlice";
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import AccountLayout from "../AccountLayout";
import AccountSidebar from "../AccountSidebar";

const PaymentMethodClient: React.FC = () => {
    const [items, setItems] = React.useState<PaymentMethodItem[]>(MOCK_PAYMENT_METHODS);
    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    const handleDelete = (id: string) => {
        // later: call API then update list
        // setItems((prev) => prev.filter((x) => x.id !== id));
        dispatch(openModal({
            key: "confirmDelete",
            payload: { id },
        }))
    };

    return (
        <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
            <Breadcrumbs
                items={[
                    { label: t("breadcrumb.home"), href: "/" },
                    { label: t("account.account"), href: "/account" },
                    { label: "Payment Method" }
                ]}
            />

            <div className="sm:mb-11.5">
                <AccountLayout
                    sidebar={<AccountSidebar activeKey="payment-method" />}
                >
                    <div className="space-y-3">
                        <div className="border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] bg-white p-4">
                            <h1 className="text-2xl font-bold">My Payment Options</h1>
                        </div>

                        <div className="border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] bg-white p-4">
                            <PaymentMethodsTable items={items} onDelete={handleDelete} />
                        </div>
                    </div>
                </AccountLayout>
            </div>
        </section>
    );
};

export default PaymentMethodClient;
