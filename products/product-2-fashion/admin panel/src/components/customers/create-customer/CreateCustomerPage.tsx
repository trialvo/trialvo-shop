// src/components/customers/create-customer/CreateCustomerPage.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  BadgeCheck,
  Calendar,
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Lightbulb,
  Lock,
  Mail,
  Phone,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  User2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import Input from "@/components/form/input/InputField";
import PasswordInput from "@/components/form/input/PasswordInput";
import Select from "@/components/form/Select";
import DatePicker from "@/components/form/date-picker";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/form/switch/Switch";
import PageHeader from "@/components/ui/layout/PageHeader";
import SectionCard from "@/components/ui/layout/SectionCard";
import FieldGroup from "@/components/ui/layout/FieldGroup";
import CustomerImageCropperModal from "@/components/customers/create-customer/CustomerImageCropperModal";
import { cn } from "@/lib/utils";

import { createAdminUser, type AdminUserGender } from "@/api/admin-users.api";
import type { CreateCustomerForm } from "./types";

/* ─── constants ────────────────────────────────────────────────────────────── */

type Option = { value: string; label: string };

const GENDER_OPTIONS: Option[] = [
  { value: "unspecified", label: "Unspecified" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

/* ─── validators ───────────────────────────────────────────────────────────── */

function isValidPhone(phone: string): boolean {
  return /^(\+8801\d{9}|01\d{9})$/.test(phone.trim());
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* ─── section divider ──────────────────────────────────────────────────────── */

function SectionDivider({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
        {step}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700/60" />
    </div>
  );
}

/* ─── form initial state ───────────────────────────────────────────────────── */

const INITIAL_FORM: CreateCustomerForm = {
  user_profile: null,
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  gender: "unspecified",
  phone: "",
  dob: "",
  is_active: "active",
};

type TouchedFields = Record<string, boolean>;

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function CreateCustomerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateCustomerForm>(INITIAL_FORM);
  const [touched, setTouched] = useState<TouchedFields>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);
  const [cropSourceName, setCropSourceName] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);

  const touch = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const fullName = useMemo(() => {
    return `${form.first_name} ${form.last_name}`.trim();
  }, [form.first_name, form.last_name]);

  const avatarLetter = useMemo(() => {
    const c = fullName.slice(0, 1).toUpperCase();
    return c || "C";
  }, [fullName]);

  // cleanup preview object url
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    };
  }, [cropSourceUrl]);

  // ── Validation ────────────────────────────────────────────────────────────
  const errors = useMemo(() => {
    const emailErr = !form.email.trim()
      ? "Email is required."
      : !isValidEmail(form.email)
        ? "Invalid email format."
        : "";

    const passErr = !form.password.trim()
      ? "Password is required."
      : form.password.length < 8
        ? "Password must be at least 8 characters."
        : "";

    const firstErr = !form.first_name.trim() ? "First name is required." : "";
    const lastErr = !form.last_name.trim() ? "Last name is required." : "";

    const phoneErr = !form.phone.trim()
      ? "Phone is required."
      : !isValidPhone(form.phone)
        ? "Use 01xxxxxxxxx or +8801xxxxxxxxx format."
        : "";

    return {
      email: emailErr,
      pass: passErr,
      first: firstErr,
      last: lastErr,
      phone: phoneErr,
    };
  }, [form]);

  const canSubmit = useMemo(() => {
    return (
      !errors.email &&
      !errors.pass &&
      !errors.first &&
      !errors.last &&
      !errors.phone
    );
  }, [errors]);

  // ── Completion progress ───────────────────────────────────────────────────
  const completionPct = useMemo(() => {
    let filled = 0;
    const total = 5;
    if (form.email.trim() && isValidEmail(form.email)) filled++;
    if (form.password.length >= 8) filled++;
    if (form.first_name.trim()) filled++;
    if (form.last_name.trim()) filled++;
    if (form.phone.trim() && isValidPhone(form.phone)) filled++;
    return Math.round((filled / total) * 100);
  }, [form]);

  // ── Mutation ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async () => {
      return createAdminUser({
        user_profile: form.user_profile ?? null,
        email: form.email.trim(),
        password: form.password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        gender: form.gender as AdminUserGender,
        phone: form.phone.trim(),
        dob: form.dob.trim(),
        is_active: form.is_active,
      });
    },
    onSuccess: (res: any) => {
      if (res?.flag && Number(res.flag) !== 200) {
        const errMsg =
          (typeof res?.error === "string" && res.error.trim()) ||
          (typeof res?.message === "string" && res.message.trim()) ||
          "Failed to create customer";
        toast.error(errMsg);
        return;
      }

      if (res?.success === false) {
        const errMsg =
          (typeof res?.error === "string" && res.error.trim()) ||
          (typeof res?.message === "string" && res.message.trim()) ||
          "Failed to create customer";
        toast.error(errMsg);
        return;
      }

      const msg =
        (typeof res?.message === "string" && res.message.trim()) ||
        (typeof res?.data?.message === "string" && res.data.message.trim()) ||
        "Customer created successfully";
      toast.success(msg);
      setForm(INITIAL_FORM);
      setTouched({});

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      const msg =
        (typeof data?.error === "string" && data.error.trim()) ||
        (typeof data?.message === "string" && data.message.trim()) ||
        (typeof err?.message === "string" && err.message.trim()) ||
        "Failed to create customer";
      toast.error(msg);
    },
  });

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    setForm(INITIAL_FORM);
    setTouched({});
    setIsDragging(false);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── File handling ─────────────────────────────────────────────────────────
  const pickFile = () => fileInputRef.current?.click();

  const removeFile = () => {
    setForm((p) => ({ ...p, user_profile: null }));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] ?? null;

    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);

    if (file) {
      const url = URL.createObjectURL(file);
      setCropSourceUrl(url);
      setCropSourceName(file.name);
      setCropOpen(true);
    } else {
      setCropSourceUrl(null);
      setCropSourceName(undefined);
      setCropOpen(false);
    }
  };

  const handleDrop = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG/PNG/WebP).");
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      toast.error("Image too large. Max 3 MB allowed.");
      return;
    }

    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    const url = URL.createObjectURL(f);
    setCropSourceUrl(url);
    setCropSourceName(f.name);
    setCropOpen(true);
  };

  const closeCropper = () => {
    if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
    setCropSourceUrl(null);
    setCropSourceName(undefined);
    setCropOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /** Show error only when field is touched */
  const fieldError = (key: string, err: string) =>
    touched[key] ? err : "";

  const isActive = form.is_active === "active";
  const statusColor = isActive ? "success" : "dark";

  /* ═══════════════════════════════════════════════════════════════════════════ */

  return (
    <div className="space-y-5">
      <PageHeader
        title="Create Customer"
        subtitle="Register a new customer with profile and credentials."
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/customers-list")}
            startIcon={<Users size={15} />}
          >
            Back to Customers
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ─── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-8">

          {/* ── Section: Profile & Image ─────────────────────────────────── */}
          <SectionCard
            title="Profile"
            description="Photo, identity & contact information."
            icon={<User2 className="h-5 w-5" />}
          >
            {/* ── Avatar Upload Zone ──────────────────────────────────────── */}
            <div className="mb-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Profile Photo
                </p>
                {previewUrl ? (
                  <button
                    type="button"
                    onClick={removeFile}
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
                  if (f) handleDrop(f);
                }}
              >
                {/* Drag overlay shimmer */}
                {isDragging && (
                  <div className="pointer-events-none absolute inset-0 animate-pulse bg-brand-500/5" />
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    {/* Avatar preview */}
                    <div className="relative">
                      <div className={cn(
                        "h-16 w-16 overflow-hidden rounded-2xl border-2 transition-colors duration-200",
                        previewUrl
                          ? "border-brand-200 dark:border-brand-700"
                          : "border-gray-200 dark:border-gray-700",
                      )}>
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Profile preview"
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
                        {previewUrl ? "Image selected" : "Upload a photo"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Drag & drop or click to choose. Max 3 MB.
                      </p>
                      {form.user_profile && (
                        <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                          <CheckCircle2 size={11} />
                          {form.user_profile.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                    <Button
                      variant="outline"
                      onClick={pickFile}
                      className="gap-2"
                      disabled={createMutation.isPending}
                    >
                      <UploadCloud size={15} />
                      {previewUrl ? "Replace" : "Upload"}
                    </Button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-gray-400 dark:text-gray-500">
                  Recommended: 1:1 square image (PNG / JPG / WebP). Image will be cropped after selection.
                </p>
              </div>
            </div>

            {/* ── Status Toggle ───────────────────────────────────────────── */}
            <div className="mb-5 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 dark:border-gray-700/60 dark:bg-gray-800/40">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
                )}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Account Status
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {isActive ? "Customer can log in and place orders" : "Customer account is suspended"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  isActive
                    ? "bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
                )}>
                  {isActive ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={isActive}
                  onChange={(on) =>
                    setForm((p) => ({
                      ...p,
                      is_active: on ? "active" : "inactive",
                    }))
                  }
                  size="lg"
                  color="brand"
                />
              </div>
            </div>

            {/* ── Section 1: Credentials ──────────────────────────────────── */}
            <SectionDivider step={1} label="Account Credentials" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldGroup label="Email" required>
                <Input
                  startIcon={<Mail size={16} />}
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: String(e.target.value) }))
                  }
                  onBlur={() => touch("email")}
                  placeholder="example@gmail.com"
                  error={Boolean(fieldError("email", errors.email))}
                  hint={fieldError("email", errors.email)}
                  success={touched.email && !errors.email}
                />
              </FieldGroup>

              <FieldGroup label="Password" required>
                <PasswordInput
                  value={form.password}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, password: String(e.target.value) }))
                  }
                  onBlur={() => touch("pass")}
                  placeholder="Minimum 8 characters"
                  error={Boolean(fieldError("pass", errors.pass))}
                  hint={fieldError("pass", errors.pass)}
                  showStrengthMeter
                  showRequirements
                  minLength={8}
                />
              </FieldGroup>
            </div>

            {/* ── Section 2: Personal Information ─────────────────────────── */}
            <div className="mt-6" />
            <SectionDivider step={2} label="Personal Information" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldGroup label="First Name" required>
                <Input
                  startIcon={<User2 size={16} />}
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, first_name: String(e.target.value) }))
                  }
                  onBlur={() => touch("first")}
                  placeholder="e.g. John"
                  error={Boolean(fieldError("first", errors.first))}
                  hint={fieldError("first", errors.first)}
                  success={touched.first && !errors.first}
                />
              </FieldGroup>

              <FieldGroup label="Last Name" required>
                <Input
                  startIcon={<User2 size={16} />}
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, last_name: String(e.target.value) }))
                  }
                  onBlur={() => touch("last")}
                  placeholder="e.g. Doe"
                  error={Boolean(fieldError("last", errors.last))}
                  hint={fieldError("last", errors.last)}
                  success={touched.last && !errors.last}
                />
              </FieldGroup>
            </div>

            {/* ── Section 3: Contact & Details ────────────────────────────── */}
            <div className="mt-6" />
            <SectionDivider step={3} label="Contact & Details" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FieldGroup label="Phone" required>
                <Input
                  startIcon={<Phone size={16} />}
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: String(e.target.value) }))
                  }
                  onBlur={() => touch("phone")}
                  placeholder="01xxxxxxxxx / +8801xxxxxxxxx"
                  error={Boolean(fieldError("phone", errors.phone))}
                  hint={fieldError("phone", errors.phone)}
                  success={touched.phone && !errors.phone}
                />
              </FieldGroup>

              <FieldGroup label="Gender">
                <Select
                  key={`gender-${form.gender}`}
                  options={GENDER_OPTIONS}
                  placeholder="Select gender"
                  defaultValue={form.gender}
                  onChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      gender: v as CreateCustomerForm["gender"],
                    }))
                  }
                />
              </FieldGroup>

              <FieldGroup label="Date of Birth" hint="Optional — format: YYYY-MM-DD">
                <DatePicker
                  value={form.dob}
                  onChange={(v) =>
                    setForm((p) => ({ ...p, dob: String(v ?? "") }))
                  }
                  placeholder="Select date"
                  showClear={true}
                  showToday={true}
                  yearRange={{
                    from: new Date().getFullYear() - 80,
                    to: new Date().getFullYear(),
                  }}
                />
              </FieldGroup>
            </div>
          </SectionCard>

          {/* ── Action Bar ──────────────────────────────────────────────── */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              All fields marked with <span className="text-error-500">*</span> are required.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={reset}
                disabled={createMutation.isPending}
                startIcon={<RotateCcw size={14} />}
              >
                Reset
              </Button>

              <Button
                onClick={() => createMutation.mutate()}
                disabled={!canSubmit || createMutation.isPending}
                startIcon={!createMutation.isPending ? <UserPlus size={15} /> : undefined}
              >
                {createMutation.isPending ? "Creating..." : "Create Customer"}
              </Button>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-4">

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
            description="How this customer will appear."
            icon={<Sparkles className="h-4 w-4" />}
          >
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-brand-50/60 via-white to-gray-50 dark:border-gray-800 dark:from-brand-500/5 dark:via-gray-900 dark:to-gray-800/30">
              <div className="px-4 py-4">
                <div className="flex items-start gap-3.5">
                  {/* Avatar */}
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 border-white shadow-sm dark:border-gray-800">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200 text-sm font-bold text-brand-700 dark:from-brand-500/30 dark:to-brand-500/20 dark:text-brand-200">
                        {avatarLetter}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold text-gray-900 dark:text-white">
                      {fullName || "Customer Name"}
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
                      {form.dob && (
                        <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Calendar size={12} className="shrink-0" />
                          <span className="truncate">{form.dob}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="solid" color={statusColor} size="sm">
                    {form.is_active}
                  </Badge>
                  <Badge variant="solid" color="info" size="sm">
                    {form.gender}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Readiness indicator */}
            <div
              className={cn(
                "mt-3 overflow-hidden rounded-xl border p-3.5 transition-colors",
                canSubmit
                  ? "border-success-200 bg-success-50/60 dark:border-success-900/40 dark:bg-success-500/10"
                  : "border-warning-200 bg-warning-50/60 dark:border-warning-900/40 dark:bg-warning-500/10",
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  canSubmit
                    ? "bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400"
                    : "bg-warning-100 text-warning-600 dark:bg-warning-500/20 dark:text-warning-400",
                )}>
                  {canSubmit ? <BadgeCheck size={16} /> : <ShieldAlert size={16} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {canSubmit ? "Ready to create" : "Fix required fields"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                    Required: email, password, first name, last name, phone.
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── Tips ──────────────────────────────────────────────────────── */}
          <SectionCard
            title="Tips & Best Practices"
            icon={<Lightbulb className="h-4 w-4" />}
          >
            <div className="space-y-3">
              {[
                {
                  icon: <Phone size={14} className="text-brand-500" />,
                  title: "BD phone format",
                  desc: "Supports 01xxxxxxxxx or +8801xxxxxxxxx format only.",
                },
                {
                  icon: <Lock size={14} className="text-warning-500" />,
                  title: "Strong password",
                  desc: "Include uppercase, lowercase, numbers, and special characters.",
                },
                {
                  icon: <ImageIcon size={14} className="text-success-500" />,
                  title: "Square profile photo",
                  desc: "Upload a 1:1 square image for the best display quality.",
                },
                {
                  icon: <Calendar size={14} className="text-blue-500" />,
                  title: "Date of birth",
                  desc: "DOB is optional — you can skip it and add later.",
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

      <CustomerImageCropperModal
        open={cropOpen}
        imageUrl={cropSourceUrl ?? ""}
        fileName={cropSourceName}
        aspect={1}
        onClose={closeCropper}
        onApply={({ file, previewUrl: croppedUrl }) => {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setForm((p) => ({ ...p, user_profile: file }));
          setPreviewUrl(croppedUrl);
          closeCropper();
        }}
      />
    </div>
  );
}
