// src/components/profile/EditProfileForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { FiMail, FiPhone, FiUser } from "react-icons/fi";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { cn, toPublicUrl } from "@/lib/utils";

import AvatarUploadField from "@/components/common/form/AvatarUploadField";
import FormDatePicker from "@/components/common/form/FormDatePicker";
import SelectField from "@/components/common/form/SelectField";
import TextInputField from "@/components/common/form/TextInputField";
import AccountFormActions from "@/components/account/AccountFormActions";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";

const schema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().optional().or(z.literal("")),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^01\d{9}$/.test(v), {
      message: "Enter a valid BD mobile number",
    }),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  dob: z.date().nullable().optional(),
  gender: z.enum(["male", "female", "unspecified", "other"]).optional().or(z.literal("")),
  profile: z.union([z.instanceof(File), z.null()]).optional(),
});

export type EditProfileValues = z.infer<typeof schema>;

type Props = {
  onSubmit?: (values: EditProfileValues) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
};

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Unspecified", value: "unspecified" },
];

function sameDay(a?: Date | null, b?: Date | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildDefaults(user: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  dob?: string | null;
  gender?: string | null;
}, phone: string): EditProfileValues {
  return {
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    phone,
    email: user.email ?? "",
    dob: user.dob ? new Date(user.dob) : null,
    gender: (user.gender as EditProfileValues["gender"]) ?? "",
    profile: null,
  };
}

/** True when form values match the last hydrated defaults (ignore File identity noise). */
function hasProfileChanges(
  values: EditProfileValues,
  defaults: EditProfileValues,
): boolean {
  if (values.profile instanceof File) return true;
  if (values.first_name.trim() !== defaults.first_name.trim()) return true;
  if ((values.last_name || "").trim() !== (defaults.last_name || "").trim())
    return true;
  if ((values.phone || "").trim() !== (defaults.phone || "").trim()) return true;
  if (values.email.trim() !== defaults.email.trim()) return true;
  if ((values.gender || "") !== (defaults.gender || "")) return true;
  if (!sameDay(values.dob ?? null, defaults.dob ?? null)) return true;
  return false;
}

const EditProfileForm: React.FC<Props> = ({ onSubmit, onCancel, className }) => {
  const { user, isUpdatingProfile } = useAuth();
  const { t } = useTranslation();

  const defaultPhoneId =
    typeof user?.default_phone === "number" ? user.default_phone : undefined;

  const defaultPhone = user?.phones?.find((p) => p?.id === defaultPhoneId);
  const phoneNumber = defaultPhone?.phone_number ?? "";

  const defaultsRef = React.useRef<EditProfileValues | null>(null);
  const hydratedUserIdRef = React.useRef<number | string | null>(null);

  const form = useForm<EditProfileValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      dob: null,
      gender: "",
      profile: null,
    },
  });

  // Subscribe so isDirty updates the submit button state
  const { isDirty } = form.formState;

  React.useEffect(() => {
    if (!user) return;

    // Hydrate once per user — optimistic cache updates must not wipe in-progress edits
    if (hydratedUserIdRef.current === user.id && defaultsRef.current) return;

    const next = buildDefaults(user, phoneNumber);
    defaultsRef.current = next;
    hydratedUserIdRef.current = user.id;
    form.reset(next);
  }, [user, phoneNumber, form]);

  if (!user) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl bg-[#F3F1ED]" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-[#F3F1ED]" />
          ))}
        </div>
      </div>
    );
  }

  const avatarUrl = toPublicUrl(user.img_path ?? null);
  const fallbackText = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();

  const handleSubmit = async (values: EditProfileValues) => {
    const defaults = defaultsRef.current;
    const changed = defaults
      ? hasProfileChanges(values, defaults)
      : isDirty;

    // No edits → leave without hitting the API
    if (!changed) {
      onCancel?.();
      return;
    }

    await onSubmit?.(values);
  };

  return (
    <div className={cn("w-full", "sm:pb-0", className)}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={cn(
            "space-y-4 pb-[calc(env(safe-area-inset-bottom)+72px)] sm:pb-0",
            className,
          )}
        >
          <AvatarUploadField
            control={form.control}
            name="profile"
            label="Profile Photo"
            initialImageUrl={avatarUrl}
            maxSizeMb={2}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            fallbackText={fallbackText || "User"}
          />

          <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2">
            <TextInputField
              control={form.control}
              name="first_name"
              label="First Name"
              required
              placeholder="Enter your first name"
              leftIcon={<FiUser className="h-4 w-4" />}
            />

            <TextInputField
              control={form.control}
              name="last_name"
              label="Last Name"
              placeholder="Enter your last name"
              leftIcon={<FiUser className="h-4 w-4" />}
            />

            <TextInputField
              control={form.control}
              name="phone"
              label="Mobile Number"
              required
              placeholder="01XXXXXXXXX"
              leftIcon={<FiPhone className="h-4 w-4" />}
            />

            <TextInputField
              control={form.control}
              name="email"
              label="Email"
              required
              placeholder="Enter Email"
              type="email"
              leftIcon={<FiMail className="h-4 w-4" />}
            />

            <FormDatePicker
              control={form.control}
              name="dob"
              label="Date of Birth"
              placeholder="Enter Birthday"
            />

            <SelectField
              control={form.control}
              name="gender"
              label="Gender"
              placeholder="Select Gender"
              options={genderOptions}
            />
          </div>

          <AccountFormActions
            onCancel={() => onCancel?.()}
            isLoading={isUpdatingProfile}
            submitLabel={t("customerInfo.saveChanges")}
            loadingLabel={t("customerInfo.submitting")}
            cancelLabel={t("back")}
            cancelAsBack
          />
        </form>
      </Form>
    </div>
  );
};

export default EditProfileForm;
