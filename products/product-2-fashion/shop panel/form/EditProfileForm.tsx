// src/components/profile/EditProfileForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";
import { FiMail, FiPhone, FiUser } from "react-icons/fi";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { cn, toPublicUrl } from "@/lib/utils";

import AvatarUploadField from "@/components/common/form/AvatarUploadField";
import FormDatePicker from "@/components/common/form/FormDatePicker";
import SelectField from "@/components/common/form/SelectField";
import TextInputField from "@/components/common/form/TextInputField";
import { useAuth } from "@/hooks/useAuth";

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
    return <h1>Loading...</h1>;
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
      <h2 className="text-lg font-semibold text-black">Personal Profile</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-4 space-y-4">
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

          <div className="hidden items-center gap-4 pt-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 rounded-none border-[#999999] px-10 text-sm font-medium"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isUpdatingProfile}
              className="h-11 rounded-none bg-black px-10 text-sm font-medium text-white hover:bg-black/90"
            >
              {isUpdatingProfile ? "Updating..." : "Save Changes"}
            </Button>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-50 bg-white sm:hidden">
            <div className="border-t border-black/10">
              <div className="mx-auto flex max-w-280 items-center gap-3 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="h-11 flex-1 rounded-none border-[#999999] text-sm font-medium"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="h-11 flex-1 rounded-none bg-black text-sm font-medium text-white hover:bg-black/90"
                >
                  {isUpdatingProfile ? "Updating..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditProfileForm;
