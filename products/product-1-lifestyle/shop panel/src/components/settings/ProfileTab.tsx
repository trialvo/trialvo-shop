"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { PhoneInput } from "@/components/ui/PhoneInput";
import AvatarUpload from "@/components/account/AvatarUpload";
import { profileSchema } from "@/lib/validation/profile";
import type { ProfileFormData } from "@/lib/validation/profile";
import type { User } from "@/types";

interface ProfileTabProps {
  user: User;
  saving: boolean;
  onSave: (data: ProfileFormData) => void | Promise<void>;
}

export function ProfileTab({ user, saving, onSave }: ProfileTabProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      address: user.address ?? "",
    });
  }, [user, reset]);

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-foreground mb-6">
        Personal Information
      </h2>

      <AvatarUpload currentAvatar={user.avatar} userName={user.name} />

      <form onSubmit={handleSubmit(onSave)} className="space-y-5 mt-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            label="Full Name *"
            error={errors.name?.message}
            autoComplete="name"
            {...register("name")}
          />
          <FormField
            label="Email *"
            type="email"
            error={errors.email?.message}
            autoComplete="email"
            {...register("email")}
          />

          {/* Phone — custom tel input with country selector */}
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                label="Phone"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.phone?.message}
                name={field.name}
                id="profile-phone"
                defaultCountryCode="US"
              />
            )}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 disabled:opacity-60 rounded"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
