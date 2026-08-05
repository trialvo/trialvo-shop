"use client"

import EditProfileForm, { EditProfileValues } from "@/form/EditProfileForm";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "next/navigation";
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
        router?.back();
    };

    return (
        <section className="container mx-auto pt-11 px-1.5 pb-6 sm:pt-0 sm:px-0">
            <Breadcrumbs items={[
                { label: t("breadcrumb.home"), href: "/" },
                { label: t("account.account"), href: "/account" },
                { label: t("account.profileEdit") }
            ]} />
            <div className="sm:mb-17.5">
                <AccountLayout sidebar={<AccountSidebar activeKey="account-details" />}>
                    <div className="space-y-3">
                        <div className="border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] bg-white py-2.5 px-4">
                            <h1 className="text-2xl font-bold">{t("account.editProfile")}</h1>
                        </div>
                        <div className="border-0 shadow-[0px_0px_10px_rgba(0,0,0,0.12)] bg-white p-4">
                            <EditProfileForm
                                onCancel={() => {
                                    router?.back();
                                }}
                                onSubmit={handleSubmit}
                            />
                        </div>
                    </div>
                </AccountLayout>
            </div>
        </section>
    );
}

export default EditProfileClient;
