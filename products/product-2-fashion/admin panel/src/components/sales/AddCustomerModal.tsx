import React from "react";
import toast from "react-hot-toast";
import { UserPlus, Upload, Image as ImageIcon, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { cn } from "@/lib/utils";
import Select from "@/components/form/Select";

import { createAdminUser, type AdminUserGender, type CreateAdminUserPayload } from "@/api/admin-users.api";
import DatePicker from "../form/date-picker";
import { toPublicUrl } from "@/utils/toPublicUrl";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (data: { id: number; email: string }) => void;
};

function todayMinusYears(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseYmd(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export default function AddCustomerModal({ open, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("12345678");

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");

  const [gender, setGender] = React.useState<AdminUserGender>("unspecified");
  const [phone, setPhone] = React.useState("");

  // Store as YYYY-MM-DD for API
  const [dob, setDob] = React.useState<string>(() => toYmd(todayMinusYears(20)));

  const [isActive, setIsActive] = React.useState<"active" | "inactive">("active");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!userProfile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(userProfile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [userProfile]);

  React.useEffect(() => {
    if (!open) return;
    // keep fields as-is
  }, [open]);

  const canSave = React.useMemo(() => {
    return Boolean(email.trim() && password.trim() && firstName.trim() && phone.trim());
  }, [email, password, firstName, phone]);

  async function handleCreate() {
    if (!canSave || saving) return;

    setSaving(true);
    try {
      const payload: CreateAdminUserPayload = {
        user_profile: userProfile,
        email: email.trim(),
        password: password.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender,
        phone: phone.trim(),
        dob, // YYYY-MM-DD
        is_active: isActive,
      };

      const res = await createAdminUser(payload);

      const id = Number(res?.data?.id);
      const createdEmail = String(res?.data?.email ?? payload.email);

      if (!Number.isFinite(id)) {
        toast.error(res?.message ?? "User created but missing id");
        return;
      }

      toast.success(res?.message ?? t("sales.orderPlaced"));
      onCreated({ id, email: createdEmail });
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("sales.failedOrder");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const titleId = "add-customer-modal-title";

  return (
    <Modal isOpen={open} onClose={onClose} titleId={titleId} className="w-full max-w-[920px] overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-5 dark:border-gray-800">
        <h3 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white/90">
          {t("sales.addNewCustomer")}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("sales.createCustomerSubtitle")}
        </p>
      </div>

      {/* Body */}
      <div className="max-h-[calc(100dvh-260px)] overflow-y-auto custom-scrollbar px-6 py-6">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-white/5">
          <div className="grid grid-cols-12 gap-4">
            {/* Profile */}
            <div className="col-span-12">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {t("sales.profileImage")}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("sales.uploadSupported")}</p>
                </div>

                {previewUrl ? (
                  <div className="flex items-center gap-2">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={toPublicUrl(previewUrl)} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setUserProfile(null)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/[0.03]"
                    >
                      <X size={16} />
                      {t("sales.remove")}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
                      <ImageIcon size={18} />
                    </div>
                  </div>
                )}
              </div>

              <label
                className={cn(
                  "mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-3",
                  "hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-white/[0.03]"
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                    {userProfile ? userProfile.name : t("sales.uploadCustomerPhoto")}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t("sales.maxSize")}</div>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
                  <Upload size={16} />
                  {t("sales.browse")}
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setUserProfile(f);
                  }}
                />
              </label>
            </div>

            {/* Email */}
            <div className="col-span-12 md:col-span-6">
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">{t("sales.email")}</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. customer@gmail.com"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Password */}
            <div className="col-span-12 md:col-span-6">
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">{t("sales.password")}</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. 12345678"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("sales.requiredForLogin")}</p>
            </div>

            {/* First name */}
            <div className="col-span-12 md:col-span-6">
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">{t("sales.firstName")}</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Arafat"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Last name */}
            <div className="col-span-12 md:col-span-6">
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">{t("sales.lastName")}</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Shanto"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Phone */}
            <div className="col-span-12 md:col-span-6">
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">{t("sales.phone")}</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 01629615314"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              />
            </div>

            {/* Gender */}
            <div className="col-span-12 md:col-span-6">
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">{t("sales.genderLabel")}</label>
              <Select
                options={[
                  { value: "unspecified", label: t("sales.unspecified") },
                  { value: "male", label: t("sales.male") },
                  { value: "female", label: t("sales.female") },
                  { value: "other", label: t("sales.other") },
                ]}
                value={gender}
                onChange={(v) => setGender(v as AdminUserGender)}
                placeholder={t("sales.genderLabel")}
              />
            </div>

            {/* ✅ DOB: DatePicker */}
            <div className="col-span-12 md:col-span-6">
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">{t("sales.dateOfBirth")}</label>

              {/* ADAPTER: store YYYY-MM-DD but DatePicker uses Date */}
              <DatePicker
                valueType="date"
                value={parseYmd(dob) ?? null}
                onChange={(date: Date | null) => {
                  if (!date) {
                    setDob("");
                    return;
                  }
                  setDob(toYmd(date));
                }}
              />

              {/* fallback hidden input (optional) */}
              <input type="hidden" value={dob} readOnly />
            </div>

            {/* Status */}
            <div className="col-span-12 md:col-span-6">
              <label className="mb-1 block text-sm font-semibold text-gray-800 dark:text-gray-200">{t("sales.status")}</label>
              <Select
                options={[
                  { value: "active", label: t("sales.active") },
                  { value: "inactive", label: t("sales.inactive") },
                ]}
                value={isActive}
                onChange={(v) => setIsActive(v as "active" | "inactive")}
                placeholder={t("sales.status")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("sales.requiredFields")}</p>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              {t("sales.cancel")}
            </Button>

            <Button startIcon={<UserPlus size={16} />} disabled={!canSave || saving} onClick={handleCreate}>
              {saving ? t("sales.saving") : t("sales.saveCustomer")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
