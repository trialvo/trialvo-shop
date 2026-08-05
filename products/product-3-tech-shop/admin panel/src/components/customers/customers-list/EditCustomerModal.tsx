"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Mail, Phone, User2 } from "lucide-react";

import Modal from "@/components/ui/modal/Modal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/utils/toPublicUrl";

import {
  editAdminUser,
  getAdminUser,
  type AdminUserGender,
  type AdminUserStatus,
} from "@/api/admin-users.api";

type Option = { value: string; label: string };

const GENDER_OPTIONS: Option[] = [
  { value: "unspecified", label: "Unspecified" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS: Option[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

function isValidPhone(phone: string): boolean {
  const v = phone.trim();
  return /^(\+8801\d{9}|01\d{9})$/.test(v);
}

function isValidEmail(email: string): boolean {
  const v = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidDob(dob: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dob.trim());
}

function isoToYmd(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type EditForm = {
  user_profile: File | null;
  previewUrl: string | null;

  email: string;
  password: string;

  first_name: string;
  last_name: string;

  gender: AdminUserGender | string;
  phone: string;

  dob: string; // ISO: YYYY-MM-DD (DatePicker value)
  status: AdminUserStatus | string;
};

export default function EditCustomerModal({
  open,
  userId,
  onClose,
  onUpdated,
}: {
  open: boolean;
  userId: number | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const qc = useQueryClient();
  const enabled = open && typeof userId === "number";

  const userQuery = useQuery({
    queryKey: ["adminUser", userId],
    queryFn: () => getAdminUser(userId as number),
    enabled,
    retry: 1,
  });

  const [form, setForm] = useState<EditForm | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<number | null>(null);

  // Keep track of local object URL to revoke and avoid memory leak
  const localPreviewUrlRef = useRef<string | null>(null);

  const revokeLocalPreview = () => {
    if (localPreviewUrlRef.current) {
      URL.revokeObjectURL(localPreviewUrlRef.current);
      localPreviewUrlRef.current = null;
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      revokeLocalPreview();
      setForm(null);
      setLoadedUserId(null);
      return;
    }
  }, [open]);

  // Initialize form only once per userId (avoid wiping edits on refetch)
  useEffect(() => {
    const u = userQuery.data?.user;
    if (!u) return;

    const firstPhone = u.phones?.[0]?.phone_number ?? "";
    const serverPreview = u.img_path ? toPublicUrl(u.img_path) : null;

    // First load (or switching user)
    if (loadedUserId !== u.id || !form) {
      revokeLocalPreview();
      setLoadedUserId(u.id);

      setForm({
        user_profile: null,
        previewUrl: serverPreview,

        email: u.email ?? "",
        password: "",

        first_name: u.first_name ?? "",
        last_name: u.last_name ?? "",

        gender: (u.gender as any) ?? "unspecified",
        phone: firstPhone ?? "",

        dob: isoToYmd(u.dob ?? null),

        status: (u.status as any) ?? "active",
      });
      return;
    }

    // Same user refetched: only refresh preview from server if we are NOT showing a local selected file
    setForm((p) => {
      if (!p) return p;
      if (p.user_profile) return p;
      return { ...p, previewUrl: serverPreview };
    });
  }, [userQuery.data?.user, loadedUserId]); // intentionally not depending on `form` to prevent loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      revokeLocalPreview();
    };
  }, []);

  const errors = useMemo(() => {
    if (!form) {
      return { email: "", first: "", last: "", phone: "", dob: "" };
    }

    const emailErr = !form.email.trim()
      ? "Email is required."
      : !isValidEmail(form.email)
        ? "Invalid email format."
        : "";

    const firstErr = !form.first_name.trim() ? "First name is required." : "";
    const lastErr = !form.last_name.trim() ? "Last name is required." : "";

    const phoneErr = !form.phone.trim()
      ? "Phone is required."
      : !isValidPhone(form.phone)
        ? "Use 01xxxxxxxxx or +8801xxxxxxxxx format."
        : "";

    const dobErr = !form.dob.trim()
      ? "Date of Birth is required."
      : !isValidDob(form.dob)
        ? "Select a valid date."
        : "";

    return { email: emailErr, first: firstErr, last: lastErr, phone: phoneErr, dob: dobErr };
  }, [form]);

  const canSave = useMemo(() => {
    if (!form) return false;
    return !errors.email && !errors.first && !errors.last && !errors.phone && !errors.dob;
  }, [form, errors]);

  const imageUploadMutation = useMutation({
    mutationFn: async () => {
      if (!form || typeof userId !== "number") throw new Error("Missing data");
      if (!form.user_profile) throw new Error("No image selected");

      return editAdminUser(userId, {
        user_profile: form.user_profile,
      });
    },
    onSuccess: async () => {
      toast.success("Profile image updated");

      revokeLocalPreview();
      setForm((p) => (p ? { ...p, user_profile: null } : p));

      await qc.invalidateQueries({ queryKey: ["adminUser", userId] }).catch(() => undefined);
      onUpdated();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        err?.message ??
        "Failed to update profile image";
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!form || typeof userId !== "number") throw new Error("Missing data");

      return editAdminUser(userId, {
        email: form.email.trim(),
        password: form.password.trim() ? form.password : undefined,

        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),

        gender: form.gender,
        phone: form.phone.trim(),
        dob: form.dob.trim(),

        status: form.status,
      });
    },
    onSuccess: () => {
      toast.success("Customer updated");
      onUpdated();
      onClose();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to update customer";
      toast.error(msg);
    },
  });

  const anyPending = updateMutation.isPending || imageUploadMutation.isPending;

  const body = (() => {
    if (!enabled) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">No customer selected.</p>;
    }

    if (userQuery.isLoading || !form) {
      return <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>;
    }

    const fullName = `${form.first_name} ${form.last_name}`.trim();
    const avatarLetter = fullName.slice(0, 1).toUpperCase() || "C";
    const hasNewImageSelected = Boolean(form.user_profile);

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT */}
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Profile</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Profile image upload is separate. Customer fields update uses PUT form-data without image.
              </p>
            </div>

            <div className="space-y-5 p-5">
              {/* image */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Profile Image (user_profile)
                  </p>

                  <div className="mt-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold">
                          {form.user_profile?.name ?? "Keep existing image"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          className={cn(
                            "inline-flex cursor-pointer items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold shadow-theme-xs",
                            anyPending
                              ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-600"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.03]",
                          )}
                        >
                          Choose File
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={anyPending}
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;

                              setForm((p) => {
                                if (!p) return p;

                                revokeLocalPreview();

                                if (!file) {
                                  return { ...p, user_profile: null };
                                }

                                const nextPreview = URL.createObjectURL(file);
                                localPreviewUrlRef.current = nextPreview;

                                return { ...p, user_profile: file, previewUrl: nextPreview };
                              });
                            }}
                          />
                        </label>

                        <Button
                          onClick={() => imageUploadMutation.mutate()}
                          disabled={!hasNewImageSelected || anyPending}
                        >
                          {imageUploadMutation.isPending ? "Uploading..." : "Upload Image"}
                        </Button>

                        {hasNewImageSelected ? (
                          <Button
                            variant="outline"
                            onClick={() => {
                              revokeLocalPreview();
                              setForm((p) => (p ? { ...p, user_profile: null } : p));
                              qc.invalidateQueries({ queryKey: ["adminUser", userId] }).catch(() => undefined);
                            }}
                            disabled={anyPending}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Choose a file, then click <span className="font-semibold">Upload Image</span> to update only{" "}
                      <code className="font-mono">user_profile</code>.
                    </p>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</p>
                  <div className="mt-2 flex h-[120px] items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                    {form.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.previewUrl} alt="preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-xl font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {avatarLetter}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* fields */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email <span className="text-error-500">*</span>
                  </p>
                  <div className="relative">
                    <Input
                      startIcon={<Mail size={16} className="text-gray-400" />}
                      className="pl-9"
                      value={form.email}
                      onChange={(e) => setForm((p) => (p ? { ...p, email: String(e.target.value) } : p))}
                      placeholder="example@gmail.com"
                    />
                  </div>
                  {errors.email ? <p className="text-xs text-error-500">{errors.email}</p> : null}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password (optional)
                  </p>
                  <Input
                    value={form.password}
                    onChange={(e) => setForm((p) => (p ? { ...p, password: String(e.target.value) } : p))}
                    placeholder="Leave empty to keep unchanged"
                    type="password"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    If empty, password will not be sent.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    First Name <span className="text-error-500">*</span>
                  </p>
                  <div className="relative">
                    <Input
                      startIcon={<User2 size={16} className="text-gray-400" />}
                      className="pl-9"
                      value={form.first_name}
                      onChange={(e) => setForm((p) => (p ? { ...p, first_name: String(e.target.value) } : p))}
                      placeholder="First name"
                    />
                  </div>
                  {errors.first ? <p className="text-xs text-error-500">{errors.first}</p> : null}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Last Name <span className="text-error-500">*</span>
                  </p>
                  <Input
                    value={form.last_name}
                    onChange={(e) => setForm((p) => (p ? { ...p, last_name: String(e.target.value) } : p))}
                    placeholder="Last name"
                  />
                  {errors.last ? <p className="text-xs text-error-500">{errors.last}</p> : null}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone <span className="text-error-500">*</span>
                  </p>
                  <div className="relative">
                    <Input
                      startIcon={<Phone size={16} className="text-gray-400" />}
                      className="pl-9"
                      value={form.phone}
                      onChange={(e) => setForm((p) => (p ? { ...p, phone: String(e.target.value) } : p))}
                      placeholder="01xxxxxxxxx / +8801xxxxxxxxx"
                    />
                  </div>
                  {errors.phone ? <p className="text-xs text-error-500">{errors.phone}</p> : null}
                </div>

                {/* ✅ DOB using DatePicker */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date of Birth <span className="text-error-500">*</span>
                  </p>

                  <DatePicker
                    value={form.dob}
                    onChange={(v) => setForm((p) => (p ? { ...p, dob: v } : p))}
                    placeholder="DD/MM/YYYY"
                    disabled={anyPending}
                    error={Boolean(errors.dob)}
                    hint={errors.dob || undefined}
                    showToday={false}
                    showClear
                    yearRange={{
                      from: new Date().getFullYear() - 100,
                      to: new Date().getFullYear(),
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</p>
                  <Select
                    key={`g-${userId}-${form.gender}`}
                    options={GENDER_OPTIONS}
                    placeholder="Select gender"
                    defaultValue={String(form.gender)}
                    onChange={(v) => setForm((p) => (p ? { ...p, gender: v as any } : p))}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
                  <Select
                    key={`s-${userId}-${form.status}`}
                    options={STATUS_OPTIONS}
                    placeholder="Select status"
                    defaultValue={String(form.status)}
                    onChange={(v) => setForm((p) => (p ? { ...p, status: v as any } : p))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Preview</p>

            <div className="mt-4 flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
                {form.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.previewUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {avatarLetter}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {fullName || "—"}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                  {form.email || "—"}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="solid"
                    color={String(form.status).toLowerCase() === "active" ? "success" : "dark"}
                    size="sm"
                  >
                    {form.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "mt-4 rounded-xl border p-4",
                canSave
                  ? "border-success-200 bg-success-50 dark:border-success-900/40 dark:bg-success-500/10"
                  : "border-warning-200 bg-warning-50 dark:border-warning-900/40 dark:bg-warning-500/10",
              )}
            >
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {canSave ? "Ready to update" : "Fix required fields"}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Required: email, first name, last name, phone, dob.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  })();

  return (
    <Modal
      open={open}
      title="Edit Customer"
      description="Update customer data using PUT /admin/editUser/:id (form-data). Profile image has a separate upload button."
      onClose={() => {
        if (anyPending) return;
        onClose();
      }}
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={anyPending}>
            Cancel
          </Button>
          <Button onClick={() => updateMutation.mutate()} disabled={!canSave || anyPending}>
            {updateMutation.isPending ? "Updating..." : "Update Customer"}
          </Button>
        </>
      }
    >
      {body}
    </Modal>
  );
}
