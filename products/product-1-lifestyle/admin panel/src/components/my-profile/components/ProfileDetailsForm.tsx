import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import type { ProfileUser } from "../types";

type Props = {
  user: ProfileUser;
  saving?: boolean;
  onSave: (payload: { first_name?: string; last_name?: string; phone?: string; address?: string }) => void;
  onOpenChangePassword: () => void;
};

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
};

function asState(user: ProfileUser): FormState {
  return {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    address: user.address || "",
  };
}

export default function ProfileDetailsForm({
  user,
  saving,
  onSave,
  onOpenChangePassword,
}: Props) {
  const { t } = useTranslation();
  const [state, setState] = useState<FormState>(() => asState(user));

  useEffect(() => {
    setState(asState(user));
  }, [user.id, user.firstName, user.lastName, user.phone, user.address]);

  const dirty = useMemo(() => {
    const base = asState(user);
    return (
      base.firstName !== state.firstName ||
      base.lastName !== state.lastName ||
      base.phone !== state.phone ||
      base.address !== state.address
    );
  }, [state, user]);

  const onReset = () => setState(asState(user));

  const onSubmit = () => {
    if (!dirty) return;

    const payload: { first_name?: string; last_name?: string; phone?: string; address?: string } = {};

    if (state.firstName !== (user.firstName || "")) payload.first_name = state.firstName.trim();
    if (state.lastName !== (user.lastName || "")) payload.last_name = state.lastName.trim();
    if (state.phone !== (user.phone || "")) payload.phone = state.phone.trim();
    if (state.address !== (user.address || "")) payload.address = state.address.trim();

    if (!Object.keys(payload).length) {
      toast(t("myProfile.details.noChangesToast"));
      return;
    }

    onSave(payload);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("myProfile.details.title")}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("myProfile.details.subtitle")}
          </p>
        </div>

        <button
          type="button"
          className="text-sm font-semibold text-brand-500 hover:text-brand-600"
          onClick={onOpenChangePassword}
        >
          {t("myProfile.details.resetPassword")}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("myProfile.details.firstNameLabel")}
          </p>
          <Input
            value={state.firstName}
            onChange={(e) => setState((p) => ({ ...p, firstName: e.target.value }))}
            placeholder={t("myProfile.details.firstNamePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("myProfile.details.lastNameLabel")}
          </p>
          <Input
            value={state.lastName}
            onChange={(e) => setState((p) => ({ ...p, lastName: e.target.value }))}
            placeholder={t("myProfile.details.lastNamePlaceholder")}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("myProfile.details.emailLabel")}
          </p>
          <Input value={user.email} disabled />
        </div>

        <div className="space-y-2 md:col-span-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("myProfile.details.phoneLabel")}
          </p>
          <Input
            value={state.phone}
            onChange={(e) => setState((p) => ({ ...p, phone: e.target.value }))}
            placeholder={t("myProfile.details.phonePlaceholder")}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("myProfile.details.addressLabel")}
          </p>
          <Input
            value={state.address}
            onChange={(e) => setState((p) => ({ ...p, address: e.target.value }))}
            placeholder={t("myProfile.details.addressPlaceholder")}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onReset} disabled={!dirty || Boolean(saving)}>
          {t("myProfile.details.resetButton")}
        </Button>
        <Button onClick={onSubmit} disabled={!dirty || Boolean(saving)}>
          {saving
            ? t("myProfile.details.updatingButton")
            : t("myProfile.details.updateButton")}
        </Button>
      </div>
    </div>
  );
}
