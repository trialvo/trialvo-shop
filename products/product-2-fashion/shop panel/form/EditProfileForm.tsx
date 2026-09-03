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

const EditProfileForm: React.FC<Props> = ({ onSubmit, onCancel, className }) => {
  const { user, isLoading, isUpdatingProfile } = useAuth();
  const { t } = useTranslation();

  const defaultPhoneId =
    typeof user?.default_phone === "number" ? user.default_phone : undefined;

  const defaultPhone = user?.phones?.find(p => p?.id === defaultPhoneId);

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

  React.useEffect(() => {
    if (!user) return;

    form.reset({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      phone: defaultPhone?.phone_number ?? "",
      email: user.email ?? "",
      dob: user.dob ? new Date(user.dob) : null,
      gender: user?.gender ?? "",
      profile: null,
    });
  }, [user, form]);

  if (isLoading || !user) {
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
    await onSubmit?.(values);
  };

  return (
    <div
      className={cn(
        "w-full",
        "sm:pb-0",
        className,
      )}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className={cn("space-y-4 pb-[calc(env(safe-area-inset-bottom)+72px)] sm:pb-0", className)}
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

            <FormDatePicker control={form.control} name="dob" label="Date of Birth" placeholder="Enter Birthday" />

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
