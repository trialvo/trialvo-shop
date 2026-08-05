import React, { useEffect, useMemo, useState } from "react";
import { Camera, KeyRound, Mail, Phone, User2, MapPin } from "lucide-react";

import Input from "@/components/form/input/InputField";
import Select, { type Option } from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/form/switch/Switch";
import { AdminRole, AdminListRow } from "../types";
import Modal from "@/components/ui/modal/Modal";
import Badge from "@/components/ui/badge/Badge";
import ActiveInactiveSwitch from "@/components/ui/toggles/ActiveInactiveSwitch";
import { useAdminRoles } from "@/hooks/useAdminRoles";

const ROLE_LABELS: Record<string, AdminRole> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  ORDER_MANAGER: "Order Manager",
  CATALOG_MANAGER: "Catalog Manager",
  READ_ONLY_ADMIN: "Read Only Admin",
};

function normalizeRoleLabel(name?: string | null): AdminRole {
  if (!name) return "Admin";
  if (ROLE_LABELS[name]) return ROLE_LABELS[name];
  const label = name
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
  return (label as AdminRole) ?? "Admin";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "A";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidBDPhone(v: string): boolean {
  const p = v.trim();
  return /^(\+8801\d{9}|01\d{9})$/.test(p);
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** ISO -> DD/MM/YYYY */
function isoToDDMMYYYY(iso?: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** DD/MM/YYYY -> ISO (YYYY-MM-DD) */
function ddmmyyyyToISO(v?: string): string {
  if (!v) return "";
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v.trim());
  if (!m) return "";
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yy = Number(m[3]);
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return "";
  // basic validity check using Date
  const dt = new Date(yy, mm - 1, dd);
  if (dt.getFullYear() !== yy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd) return "";
  return `${yy}-${pad2(mm)}-${pad2(dd)}`;
}

type Draft = AdminListRow & {
  joinDateISO: string;

  changePassword: boolean;
  newPassword: string;
  confirmNewPassword: string;

  avatarFile: File | null;
  avatarPreviewUrl: string;
  roleId: number | null;
};

export default function EditAdminModal({
  open,
  admin,
  loading = false,
  onClose,
  onUpdateDetails,
  onUpdateStatus,
  onUpdatePassword,
  onUpdateAvatar,
}: {
  open: boolean;
  admin: AdminListRow | null;
  loading?: boolean;
  onClose: () => void;
  onUpdateDetails: (next: AdminListRow) => Promise<void>;
  onUpdateStatus: (
    id: number,
    isActive: boolean,
    roleId?: number,
    roleLabel?: AdminRole
  ) => Promise<void>;
  onUpdatePassword: (id: number, password: string) => Promise<void>;
  onUpdateAvatar: (id: number, file: File) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState({
    details: false,
    status: false,
    password: false,
    avatar: false,
  });

  const rolesQuery = useAdminRoles();
  const roles = rolesQuery.data ?? [];

  const roleOptions: Option[] = useMemo(() => {
    return roles.map((r) => ({
      value: String(r.id),
      label: normalizeRoleLabel(r.name),
    }));
  }, [roles]);

  useEffect(() => {
    if (!admin) {
      setDraft(null);
      return;
    }

    const joinISO = ddmmyyyyToISO(admin.joinDate);

    setDraft({
      ...admin,
      joinDateISO: joinISO,

      changePassword: false,
      newPassword: "",
      confirmNewPassword: "",

      avatarFile: null,
      avatarPreviewUrl: admin.avatarUrl ?? "",
      roleId: null,
    });
  }, [admin]);

  useEffect(() => {
    if (!draft || draft.roleId || roles.length === 0) return;
    const match = roles.find((r) => normalizeRoleLabel(r.name) === draft.role);
    if (!match) return;
    setDraft((prev) => (prev ? { ...prev, roleId: match.id } : prev));
  }, [draft, roles]);

  useEffect(() => {
    return () => {
      if (draft?.avatarPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(draft.avatarPreviewUrl);
      }
    };
  }, [draft?.avatarPreviewUrl]);

  const errors = useMemo(() => {
    if (!draft) return { name: "", email: "", phone: "", pass: "" };

    const nameErr = !draft.name.trim() ? "Name is required." : "";
    const emailErr = !draft.email.trim()
      ? "Email is required."
      : !isValidEmail(draft.email)
      ? "Invalid email address."
      : "";

    const phoneErr = !draft.phone.trim()
      ? "Phone is required."
      : !isValidBDPhone(draft.phone)
      ? "Use 01xxxxxxxxx or +8801xxxxxxxxx format."
      : "";

    let passErr = "";
    if (draft.changePassword) {
      if (draft.newPassword.length < 6) passErr = "Password must be at least 6 characters.";
      if (!passErr && draft.newPassword !== draft.confirmNewPassword) {
        passErr = "Passwords do not match.";
      }
    }

    return { name: nameErr, email: emailErr, phone: phoneErr, pass: passErr };
  }, [draft]);

  const canUpdateDetails = useMemo(() => {
    if (!draft) return false;
    return !errors.name && !errors.email && !errors.phone;
  }, [draft, errors]);

  if (!draft) {
    return (
      <Modal open={open} title="Edit Admin" onClose={onClose} size="lg">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? "Loading admin..." : "No admin selected."}
        </p>
      </Modal>
    );
  }

  const active = draft.status === "ACTIVE";
  const canUpdatePassword = draft.changePassword && !errors.pass && draft.newPassword;

  const handleUpdateDetails = async () => {
    if (!draft || !canUpdateDetails) return;
    setSaving((prev) => ({ ...prev, details: true }));
    try {
      await onUpdateDetails({
        ...draft,
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        avatarUrl: draft.avatarPreviewUrl || undefined,
      });
    } catch {
      // errors are surfaced via parent toast handlers
    } finally {
      setSaving((prev) => ({ ...prev, details: false }));
    }
  };

  const handleUpdateStatus = async () => {
    if (!draft) return;
    setSaving((prev) => ({ ...prev, status: true }));
    try {
      await onUpdateStatus(draft.id, draft.status === "ACTIVE", draft.roleId ?? undefined, draft.role);
    } catch {
      // errors are surfaced via parent toast handlers
    } finally {
      setSaving((prev) => ({ ...prev, status: false }));
    }
  };

  const handleUpdatePassword = async () => {
    if (!draft || !canUpdatePassword) return;
    setSaving((prev) => ({ ...prev, password: true }));
    try {
      await onUpdatePassword(draft.id, draft.newPassword);
      setDraft((prev) =>
        prev
          ? {
              ...prev,
              changePassword: false,
              newPassword: "",
              confirmNewPassword: "",
            }
          : prev
      );
    } catch {
      // errors are surfaced via parent toast handlers
    } finally {
      setSaving((prev) => ({ ...prev, password: false }));
    }
  };

  const handleUpdateAvatar = async () => {
    if (!draft?.avatarFile) return;
    setSaving((prev) => ({ ...prev, avatar: true }));
    try {
      await onUpdateAvatar(draft.id, draft.avatarFile);
      setDraft((prev) => (prev ? { ...prev, avatarFile: null } : prev));
    } catch {
      // errors are surfaced via parent toast handlers
    } finally {
      setSaving((prev) => ({ ...prev, avatar: false }));
    }
  };

  return (
    <Modal
      open={open}
      title="Edit Admin"
      description="Update admin profile, role, status and password."
      onClose={onClose}
      size="xl"
      contentClassName="rounded-[6px]"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left */}
        <div className="lg:col-span-8 space-y-6">
          {/* Profile */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Profile</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Basic details & contact information.
              </p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Image */}
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Admin Image
                  </p>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative h-16 w-16 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40">
                      {draft.avatarPreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={draft.avatarPreviewUrl}
                          alt="Admin avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {initials(draft.name || "Admin")}
                        </div>
                      )}

                      <div className="absolute bottom-1 right-1 rounded-lg border border-gray-200 bg-white p-1 text-gray-700 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                        <Camera size={14} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.03]">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            if (!f) return;

                            setDraft((prev) => {
                              if (!prev) return prev;
                              if (prev.avatarPreviewUrl.startsWith("blob:")) {
                                URL.revokeObjectURL(prev.avatarPreviewUrl);
                              }
                              const url = URL.createObjectURL(f);
                              return { ...prev, avatarFile: f, avatarPreviewUrl: url };
                            });
                          }}
                        />
                      </label>

                      <Button
                        variant="outline"
                        onClick={() =>
                          setDraft((prev) => {
                            if (!prev) return prev;
                            if (prev.avatarPreviewUrl.startsWith("blob:")) {
                              URL.revokeObjectURL(prev.avatarPreviewUrl);
                            }
                            return { ...prev, avatarFile: null, avatarPreviewUrl: "" };
                          })
                        }
                      >
                        Remove
                      </Button>

                      <Button
                        onClick={handleUpdateAvatar}
                        disabled={!draft.avatarFile || saving.avatar}
                      >
                        {saving.avatar ? "Updating..." : "Update Image"}
                      </Button>

                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        JPG/PNG recommended. Square image looks best.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name <span className="text-error-500">*</span>
                  </p>
                  <Input
                    startIcon={<User2 size={16} />}
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: String(e.target.value) })}
                    placeholder="Admin name"
                  />
                  {errors.name ? <p className="text-xs text-error-500">{errors.name}</p> : null}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email <span className="text-error-500">*</span>
                  </p>
                  <Input
                    startIcon={<Mail size={16} />}
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: String(e.target.value) })}
                    placeholder="admin@email.com"
                  />
                  {errors.email ? (
                    <p className="text-xs text-error-500">{errors.email}</p>
                  ) : null}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone <span className="text-error-500">*</span>
                  </p>
                  <Input
                    startIcon={<Phone size={16} />}
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: String(e.target.value) })}
                    placeholder="01xxxxxxxxx / +8801xxxxxxxxx"
                  />
                  {errors.phone ? (
                    <p className="text-xs text-error-500">{errors.phone}</p>
                  ) : null}
                </div>

                {/* ✅ Join Date (Reusable DatePicker) */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Joining Date
                  </p>

                  <DatePicker
                    value={draft.joinDateISO}
                    placeholder="Select a date"
                    onChange={(value) => {
                      setDraft((prev) => {
                        if (!prev) return prev;
                        const nextIso = String(value || "");
                        return {
                          ...prev,
                          joinDateISO: nextIso,
                          joinDate: nextIso ? isoToDDMMYYYY(nextIso) : "",
                        };
                      });
                    }}
                  />
                </div>

                {/* Address */}
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</p>
                  <Input
                    startIcon={<MapPin size={16} />}
                    value={draft.address}
                    onChange={(e) => setDraft({ ...draft, address: String(e.target.value) })}
                    placeholder="House/road details, city, etc."
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button onClick={handleUpdateDetails} disabled={!canUpdateDetails || saving.details}>
                  {saving.details ? "Updating..." : "Update Details"}
                </Button>
              </div>
            </div>
          </div>

          {/* Role & Status */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Access & Status</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Define role permissions and account status.
              </p>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</p>
                  <Select
                    options={roleOptions}
                    placeholder="Select role"
                    value={draft.roleId ? String(draft.roleId) : ""}
                    onChange={(v) => {
                      const nextId = Number(v);
                      const match = roles.find((r) => r.id === nextId);
                      setDraft({
                        ...draft,
                        roleId: Number.isNaN(nextId) ? null : nextId,
                        role: normalizeRoleLabel(match?.name),
                      });
                    }}
                    isLoading={rolesQuery.isLoading}
                    disabled={rolesQuery.isLoading || rolesQuery.isError}
                  />
                  {rolesQuery.isError ? (
                    <p className="text-xs text-error-500">Failed to load roles.</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
                  <ActiveInactiveSwitch
                    className="max-w-full"
                    value={active}
                    onChange={(next) =>
                      setDraft({ ...draft, status: next ? "ACTIVE" : "INACTIVE" })
                    }
                    disabled={saving.status}
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  onClick={handleUpdateStatus}
                  disabled={saving.status || rolesQuery.isLoading || !draft.roleId}
                >
                  {saving.status ? "Updating..." : "Update Status"}
                </Button>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Password</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Change password only when needed.
                  </p>
                </div>

                <Switch
                  label=""
                  defaultChecked={draft.changePassword}
                  onChange={(checked) => setDraft({ ...draft, changePassword: checked })}
                />
              </div>
            </div>

            <div className="p-5">
              {!draft.changePassword ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enable toggle to change password.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      New Password <span className="text-error-500">*</span>
                    </p>
                    <Input
                      type="password"
                      value={draft.newPassword}
                      onChange={(e) => setDraft({ ...draft, newPassword: String(e.target.value) })}
                      placeholder="Minimum 6 characters"
                      startIcon={<KeyRound size={16} />}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm Password <span className="text-error-500">*</span>
                    </p>
                    <Input
                      type="password"
                      value={draft.confirmNewPassword}
                      onChange={(e) =>
                        setDraft({ ...draft, confirmNewPassword: String(e.target.value) })
                      }
                      placeholder="Re-enter password"
                    />
                  </div>

                  {errors.pass ? (
                    <div className="md:col-span-2 rounded-xl border border-error-200 bg-error-50 p-3 text-xs font-semibold text-error-700 dark:border-error-900/40 dark:bg-error-500/10 dark:text-error-300">
                      {errors.pass}
                    </div>
                  ) : null}
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <Button onClick={handleUpdatePassword} disabled={!canUpdatePassword || saving.password}>
                  {saving.password ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Live Preview</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">How it will appear in the list.</p>
            </div>

            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="relative h-14 w-14 rounded-xl bg-gray-100 dark:bg-gray-800">
                  {draft.avatarPreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.avatarPreviewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-200">
                      {initials(draft.name || "Admin")}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                    {draft.name || "-"}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    {draft.email || "-"}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    {draft.phone || "-"}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="solid"
                      color={draft.status === "ACTIVE" ? "success" : "error"}
                      size="sm"
                    >
                      {draft.status}
                    </Badge>
                    <Badge variant="solid" color="primary" size="sm">
                      {draft.role}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">Address</p>
                <p className="line-clamp-3">{draft.address || "-"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Tips</p>
            <ul className="mt-2 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li>Use Super Admin role carefully.</li>
              <li>Disable status to restrict access instantly.</li>
              <li>Change password only when required.</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}
