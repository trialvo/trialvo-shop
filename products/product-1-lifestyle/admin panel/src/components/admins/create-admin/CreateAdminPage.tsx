import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Calendar,
  CheckCircle2,
  Info,
  KeyRound,
  Lightbulb,
  Lock,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  User2,
  UserPlus,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import Input from "@/components/form/input/InputField";
import Select, { type Option } from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import ActiveInactiveSwitch from "@/components/ui/toggles/ActiveInactiveSwitch";
import PageHeader from "@/components/ui/layout/PageHeader";
import SectionCard from "@/components/ui/layout/SectionCard";
import FieldGroup from "@/components/ui/layout/FieldGroup";
import PasswordInput from "@/components/form/input/PasswordInput";
import { cn } from "@/lib/utils";

import { AdminRole, CreateAdminForm } from "../types";
import { api } from "@/api/client";
import { type CreateAdminResponse } from "@/api/admin.api";
import { useAdminRoles } from "@/hooks/useAdminRoles";
import DatePicker from "@/components/form/date-picker";

/* ─── helpers ──────────────────────────────────────────────────────────────── */

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

/* ─── password strength ────────────────────────────────────────────────────── */

type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string; color: string; bgColor: string };

function getPasswordStrength(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: "", color: "", bgColor: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;

  const levels: PasswordStrength[] = [
    { score: 0, label: "", color: "", bgColor: "" },
    { score: 1, label: "Weak", color: "text-error-500", bgColor: "bg-error-500" },
    { score: 2, label: "Fair", color: "text-warning-500", bgColor: "bg-warning-500" },
    { score: 3, label: "Good", color: "text-blue-500", bgColor: "bg-blue-500" },
    { score: 4, label: "Strong", color: "text-success-500", bgColor: "bg-success-500" },
  ];
  return levels[Math.min(score, 4)] as PasswordStrength;
}

/* ─── section step number ──────────────────────────────────────────────────── */

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
      {n}
    </span>
  );
}

function SectionDivider({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-2">
      <StepNumber n={step} />
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
    </div>
  );
}

/* ─── form initial state ───────────────────────────────────────────────────── */

const INITIAL_FORM: CreateAdminForm = {
  name: "",
  email: "",
  role: "Admin",
  joinDate: "",
  phone: "",
  address: "",
  status: "ACTIVE",
  note: "",
  password: "",
  confirmPassword: "",
  avatarFile: null,
  avatarPreviewUrl: "",
};

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function CreateAdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateAdminForm>(INITIAL_FORM);
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "success" | "error">("idle");

  const rolesQuery = useAdminRoles();
  const roles = rolesQuery.data ?? [];

  const roleOptions: Option[] = useMemo(() => {
    return roles
      .filter((r) => normalizeRoleLabel(r.name) !== "Super Admin")
      .map((r) => {
        const label = normalizeRoleLabel(r.name);
        return { value: label, label };
      });
  }, [roles]);

  useEffect(() => {
    if (!roles.length) return;

    const hasAdmin = roles.some((r) => normalizeRoleLabel(r.name) === "Admin");
    if (hasAdmin) {
      setForm((prev) => (prev.role ? prev : { ...prev, role: "Admin" }));
      return;
    }

    const first = normalizeRoleLabel(roles[0].name);
    setForm((prev) => (prev.role ? prev : { ...prev, role: first }));
  }, [roles]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (form.avatarPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(form.avatarPreviewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const errors = useMemo(() => {
    const nameErr = !form.name.trim() ? "Name is required." : "";
    const emailErr = !form.email.trim()
      ? "Email is required."
      : !isValidEmail(form.email)
        ? "Invalid email address."
        : "";
    const phoneErr = !form.phone.trim()
      ? "Phone is required."
      : !isValidBDPhone(form.phone)
        ? "Use 01xxxxxxxxx or +8801xxxxxxxxx format."
        : "";
    const passErr = form.password.length < 6 ? "Password must be at least 6 characters." : "";
    const confirmErr = form.password !== form.confirmPassword ? "Passwords do not match." : "";
    const roleErr = !form.role ? "Role is required." : "";

    return { nameErr, emailErr, phoneErr, passErr, confirmErr, roleErr };
  }, [form]);

  const canSubmit = useMemo(() => {
    return (
      !errors.nameErr &&
      !errors.emailErr &&
      !errors.phoneErr &&
      !errors.passErr &&
      !errors.confirmErr &&
      !errors.roleErr
    );
  }, [errors]);

  // ── Completion progress ───────────────────────────────────────────────────
  const completionPct = useMemo(() => {
    let filled = 0;
    const total = 6;
    if (form.name.trim()) filled++;
    if (form.email.trim() && isValidEmail(form.email)) filled++;
    if (form.phone.trim() && isValidBDPhone(form.phone)) filled++;
    if (form.role) filled++;
    if (form.password.length >= 6) filled++;
    if (form.confirmPassword && form.password === form.confirmPassword) filled++;
    return Math.round((filled / total) * 100);
  }, [form]);

  const avatarLetter = useMemo(() => initials(form.name || "Admin"), [form.name]);
  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const reset = () => {
    if (form.avatarPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(form.avatarPreviewUrl);
    }
    setForm(INITIAL_FORM);
    setSubmitState("idle");
    setIsDragging(false);
  };

  // ── Avatar ────────────────────────────────────────────────────────────────
  const setAvatarFile = (f: File | null) => {
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG/PNG/WebP).");
      return;
    }
    const maxMb = 3;
    if (f.size > maxMb * 1024 * 1024) {
      toast.error(`Image too large. Max ${maxMb}MB allowed.`);
      return;
    }

    if (form.avatarPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(form.avatarPreviewUrl);
    }
    const url = URL.createObjectURL(f);
    setForm({ ...form, avatarFile: f, avatarPreviewUrl: url });
  };

  const removeAvatar = () => {
    if (form.avatarPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(form.avatarPreviewUrl);
    }
    setForm({ ...form, avatarFile: null, avatarPreviewUrl: "" });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const submit = async () => {
    if (!canSubmit) return;
    setSubmitState("saving");

    try {
      const selectedRole = roles.find((r) => normalizeRoleLabel(r.name) === form.role);

      if (!selectedRole) {
        toast.error("Selected role not found. Please refresh roles.");
        setSubmitState("error");
        return;
      }

      const nameParts = form.name.trim().split(/\s+/).filter(Boolean);
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ") || null;

      const is_active = form.status === "ACTIVE";
      const fd = new FormData();
      fd.append("email", form.email.trim());
      fd.append("password", form.password);
      fd.append("role_id", String(selectedRole.id));
      if (firstName) fd.append("first_name", firstName);
      if (lastName) fd.append("last_name", lastName);
      if (form.phone.trim()) fd.append("phone", form.phone.trim());
      if (form.address.trim()) fd.append("address", form.address.trim());
      fd.append("is_active", is_active ? "true" : "false");
      if (form.avatarFile) {
        fd.append("profile", form.avatarFile, form.avatarFile.name);
      }

      await api.post<CreateAdminResponse>("/admin/createAdmin", fd, {
        transformRequest: (data, headers) => {
          if (headers) {
            delete headers["Content-Type"];
            delete headers["content-type"];
          }
          return data;
        },
      });
      toast.success("Admin created successfully");
      await queryClient.invalidateQueries({ queryKey: ["admins", "list"], exact: false });
      navigate("/admins-list");
      setSubmitState("success");
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to create admin";
      toast.error(msg);
      setSubmitState("error");
    }
  };

  const isActive = form.status === "ACTIVE";
  const statusColor = isActive ? "success" : "error";

  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-5">
      <PageHeader
        title="Create Admin"
        subtitle="Create new admin account by role with secure password."
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/admins-list")}
            startIcon={<User2 size={15} />}
          >
            Back to Admins
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ─── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-5">

          {/* ── Section 1 · Profile ──────────────────────────────────────── */}
          <SectionCard
            title="Profile"
            description="Admin image & basic contact info."
            icon={<User2 className="h-5 w-5" />}
          >
            {/* Avatar Upload Zone */}
            <div className="mb-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Admin Image
                </p>
                {form.avatarPreviewUrl ? (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-error-50 hover:text-error-600 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400"
                  >
                    <X size={13} />
                    Remove
                  </button>
                ) : null}
              </div>

              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 border-dashed p-5 transition-all duration-200",
                  isDragging
                    ? "border-brand-400 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/5"
                    : "border-gray-200 bg-gray-50/60 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/30 dark:hover:border-gray-600",
                )}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault(); e.stopPropagation(); setIsDragging(false);
                  const f = e.dataTransfer.files?.[0] ?? null;
                  if (f) setAvatarFile(f);
                }}
              >
                {/* Drag overlay shimmer */}
                {isDragging && (
                  <div className="pointer-events-none absolute inset-0 animate-pulse bg-brand-500/5" />
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    {/* Avatar preview circle */}
                    <div className="relative">
                      <div className={cn(
                        "h-16 w-16 overflow-hidden rounded-2xl border-2 transition-colors duration-200",
                        form.avatarPreviewUrl
                          ? "border-brand-200 dark:border-brand-700"
                          : "border-gray-200 dark:border-gray-700",
                      )}>
                        {form.avatarPreviewUrl ? (
                          <img
                            src={form.avatarPreviewUrl}
                            alt="Admin avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-base font-bold text-brand-600 dark:from-brand-500/20 dark:to-brand-500/10 dark:text-brand-300">
                            {avatarLetter}
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg border-2 border-white bg-brand-500 text-white shadow-sm dark:border-gray-900">
                        <Camera size={12} />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {form.avatarPreviewUrl ? "Image selected" : "Upload an avatar"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Drag & drop or click to choose. Max 3 MB.
                      </p>
                      {form.avatarFile && (
                        <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                          <CheckCircle2 size={11} />
                          {form.avatarFile.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                      disabled={submitState === "saving"}
                    >
                      <UploadCloud size={15} />
                      {form.avatarPreviewUrl ? "Replace" : "Upload"}
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        if (f) setAvatarFile(f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
                  Recommended: 1:1 square image (PNG / JPG / WebP).
                </p>
              </div>
            </div>

            {/* Form fields */}
            <SectionDivider step={1} label="Contact Information" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* name */}
              <FieldGroup label="Full Name" required>
                <Input
                  startIcon={<User2 size={16} />}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: String(e.target.value) })}
                  placeholder="e.g. John Doe"
                  error={Boolean(errors.nameErr)}
                  hint={errors.nameErr || "First and last name separated by a space."}
                />
              </FieldGroup>

              {/* email */}
              <FieldGroup label="Email" required>
                <Input
                  startIcon={<Mail size={16} />}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: String(e.target.value) })}
                  placeholder="admin@email.com"
                  error={Boolean(errors.emailErr)}
                  hint={errors.emailErr || ""}
                />
              </FieldGroup>

              {/* phone */}
              <FieldGroup label="Phone" required>
                <Input
                  startIcon={<Phone size={16} />}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: String(e.target.value) })}
                  placeholder="01xxxxxxxxx / +8801xxxxxxxxx"
                  error={Boolean(errors.phoneErr)}
                  hint={errors.phoneErr || ""}
                />
              </FieldGroup>

              {/* address */}
              <FieldGroup label="Address">
                <Input
                  startIcon={<MapPin size={16} />}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: String(e.target.value) })}
                  placeholder="Dhaka, Bangladesh"
                />
              </FieldGroup>

              {/* join date */}
              <FieldGroup label="Joining Date">
                <DatePicker
                  value={form.joinDate}
                  onChange={(v) => setForm({ ...form, joinDate: v })}
                  placeholder="Select joining date"
                  className="rounded-xl"
                  disabled={submitState === "saving"}
                  showToday
                  showClear
                />
              </FieldGroup>

              {/* note — full width */}
              <div className="md:col-span-2">
                <FieldGroup label="Note">
                  <Input
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: String(e.target.value) })}
                    placeholder="Write note (optional)"
                    startIcon={<Info size={16} />}
                  />
                </FieldGroup>
              </div>
            </div>
          </SectionCard>

          {/* ── Section 2 · Access ───────────────────────────────────────── */}
          <SectionCard
            title="Access & Security"
            description="Role, status, and login credentials."
            icon={<ShieldCheck className="h-5 w-5" />}
          >
            <SectionDivider step={2} label="Role & Status" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
              <FieldGroup label="Role" required>
                <Select
                  options={roleOptions}
                  placeholder="Select role"
                  value={form.role}
                  onChange={(v) => setForm({ ...form, role: v as AdminRole })}
                  isLoading={rolesQuery.isLoading}
                  disabled={rolesQuery.isLoading || rolesQuery.isError || submitState === "saving"}
                  className="rounded-xl"
                />
                {errors.roleErr ? <p className="text-xs text-error-500">{errors.roleErr}</p> : null}
                {rolesQuery.isError ? <p className="text-xs text-error-500">Failed to load roles.</p> : null}
              </FieldGroup>

              <FieldGroup label="Status">
                <ActiveInactiveSwitch
                  className="max-w-full"
                  value={isActive}
                  onChange={(next) => setForm({ ...form, status: next ? "ACTIVE" : "INACTIVE" })}
                  disabled={submitState === "saving"}
                />
              </FieldGroup>
            </div>

            <div className="my-5 h-px w-full bg-gray-100 dark:bg-gray-800" />

            <SectionDivider step={3} label="Login Credentials" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldGroup label="Password" required>
                <PasswordInput
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: String(e.target.value) })}
                  placeholder="Minimum 6 characters"
                  error={Boolean(errors.passErr)}
                  hint={errors.passErr || ""}
                  minLength={6}
                  startIcon={<Lock size={16} />}
                  showRequirements={false}
                />
              </FieldGroup>

              <FieldGroup label="Confirm Password" required>
                <PasswordInput
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: String(e.target.value) })}
                  placeholder="Re-enter password"
                  error={Boolean(errors.confirmErr)}
                  hint={errors.confirmErr || ""}
                  minLength={6}
                  startIcon={<KeyRound size={16} />}
                  showStrengthMeter={false}
                  showRequirements={false}
                />
                {/* password match indicator */}
                {form.confirmPassword.length > 0 && form.password === form.confirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-success-500">
                    <CheckCircle2 size={12} />
                    Passwords match
                  </p>
                )}
              </FieldGroup>
            </div>

            {/* Status + Role preview */}
            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:border-gray-800 dark:from-gray-800/40 dark:via-gray-900 dark:to-gray-800/40">
              <div className="flex items-start gap-3 px-5 py-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Shield size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Access Preview
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    ACTIVE admins can log in and perform actions. INACTIVE admins are suspended.
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="solid" color={statusColor} size="sm">
                      {isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                    <Badge variant="solid" color="primary" size="sm">
                      {form.role || "-"}
                    </Badge>
                    {passwordStrength.score >= 3 && (
                      <Badge variant="light" color="success" size="sm" startIcon={<CheckCircle2 size={11} />}>
                        Strong Password
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── Action Bar ────────────────────────────────────────────────── */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              All fields marked with <span className="text-error-500">*</span> are required.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={reset}
                disabled={submitState === "saving"}
                startIcon={<RotateCcw size={14} />}
              >
                Reset
              </Button>
              <Button
                onClick={submit}
                disabled={!canSubmit || submitState === "saving"}
                startIcon={submitState === "saving" ? undefined : <UserPlus size={15} />}
              >
                {submitState === "saving" ? "Creating..." : "Create Admin"}
              </Button>
            </div>
          </div>

          {submitState === "success" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-success-200 bg-success-50 px-5 py-4 text-sm text-success-700 dark:border-success-900/40 dark:bg-success-500/10 dark:text-success-300">
              <CheckCircle2 size={18} />
              <div>
                <p className="font-semibold">Admin created successfully.</p>
                <p className="text-xs opacity-70">Redirecting to admin list…</p>
              </div>
            </div>
          ) : null}

          {submitState === "error" ? (
            <div className="flex items-center gap-3 rounded-2xl border border-error-200 bg-error-50 px-5 py-4 text-sm text-error-700 dark:border-error-900/40 dark:bg-error-500/10 dark:text-error-300">
              <X size={18} />
              <div>
                <p className="font-semibold">Failed to create admin.</p>
                <p className="text-xs opacity-70">Check the form and try again.</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* ─── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">

          {/* ── Completion Progress ──────────────────────────────────────── */}
          <SectionCard>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white transition-colors duration-300",
                completionPct === 100 ? "bg-success-500" : "bg-brand-500",
              )}>
                {completionPct === 100 ? <CheckCircle2 size={18} /> : `${completionPct}%`}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {completionPct === 100 ? "Ready to submit!" : "Form Completion"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {completionPct === 100
                    ? "All required fields are filled."
                    : "Fill in required fields to submit."}
                </p>
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  completionPct === 100 ? "bg-success-500" : "bg-brand-500",
                )}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </SectionCard>

          {/* ── Live Preview Card ────────────────────────────────────────── */}
          <SectionCard
            title="Live Preview"
            description="How this admin will appear."
            icon={<Sparkles className="h-4 w-4" />}
          >
            {/* Preview header */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-brand-50/60 via-white to-gray-50 dark:border-gray-800 dark:from-brand-500/5 dark:via-gray-900 dark:to-gray-800/30">
              <div className="px-4 py-4">
                <div className="flex items-start gap-3.5">
                  {/* Avatar */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-sm dark:border-gray-800">
                    {form.avatarPreviewUrl ? (
                      <img src={form.avatarPreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 text-sm font-bold text-brand-700 dark:from-brand-500/30 dark:to-brand-500/20 dark:text-brand-200">
                        {avatarLetter}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-gray-900 dark:text-white">
                      {form.name || "Admin Name"}
                    </p>
                    <div className="mt-1.5 space-y-1">
                      <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Mail size={12} className="shrink-0" />
                        <span className="truncate">{form.email || "email@example.com"}</span>
                      </p>
                      <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Phone size={12} className="shrink-0" />
                        <span className="truncate">{form.phone || "01XXXXXXXXX"}</span>
                      </p>
                      {form.address && (
                        <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <MapPin size={12} className="shrink-0" />
                          <span className="truncate">{form.address}</span>
                        </p>
                      )}
                      {form.joinDate && (
                        <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar size={12} className="shrink-0" />
                          <span className="truncate">{form.joinDate}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="solid" color={statusColor} size="sm">
                    {isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                  <Badge variant="solid" color="primary" size="sm">
                    {form.role || "-"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Note preview */}
            {(form.note) && (
              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-800/30">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <Info size={10} />
                  Note
                </p>
                <p className="line-clamp-3 text-xs text-gray-600 dark:text-gray-300">
                  {form.note || "-"}
                </p>
              </div>
            )}
          </SectionCard>

          {/* ── Tips ──────────────────────────────────────────────────────── */}
          <SectionCard
            title="Tips & Best Practices"
            icon={<Lightbulb className="h-4 w-4" />}
          >
            <div className="space-y-3">
              {[
                {
                  icon: <Shield size={14} className="text-brand-500" />,
                  title: "Assign roles carefully",
                  desc: "Each role defines a specific set of permissions. Verify before assigning.",
                },
                {
                  icon: <Lock size={14} className="text-warning-500" />,
                  title: "Use strong passwords",
                  desc: "Combine uppercase, lowercase, numbers, and symbols for best security.",
                },
                {
                  icon: <UserPlus size={14} className="text-success-500" />,
                  title: "Set status wisely",
                  desc: "Keep INACTIVE for accounts that should not log in yet.",
                },
              ].map((tip) => (
                <div
                  key={tip.title}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 px-3.5 py-3 transition-colors hover:bg-gray-100/60 dark:border-gray-800 dark:bg-gray-800/30 dark:hover:bg-gray-800/50"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm dark:bg-gray-900">
                    {tip.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{tip.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                      {tip.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
