"use client";

import { useEffect, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormPhoneInput } from "@/components/phone/FormPhoneInput";
import { ProfilePhotoField } from "@/components/account/profile/ProfilePhotoField";
import { AppButton } from "@/components/shared/AppButton";
import { FormAppInput } from "@/components/shared/FormAppInput";
import { useAuthContext } from "@/context/AuthContext";
import type { User } from "@/lib/api/auth/service";
import { toDashboardProfileForm } from "@/lib/adapters/accountDashboard";
import {
  profileSettingsSchema,
  type ProfileSettingsFormValues,
} from "@/lib/adapters/accountSettings";
import { getUnknownErrorMessage } from "@/lib/api/errors";
import { toApiPhoneNumber } from "@/lib/phone/parse";
import { sanitizeAuthText, sanitizeEmail } from "@/lib/security/auth";

type ProfileFormCardProps = Readonly<{
  user: User | null | undefined;
}>;

/**
 * Settings → profile photo + details (RHF + zod + FormPhoneInput).
 */
export function ProfileFormCard({ user }: ProfileFormCardProps): ReactElement {
  const auth = useAuthContext();
  const defaults = toDashboardProfileForm(user);

  const form = useForm<ProfileSettingsFormValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      firstName: defaults.firstName,
      lastName: defaults.lastName,
      email: defaults.email,
      phone: defaults.phone,
    },
    mode: "onTouched",
  });

  const { control, handleSubmit, reset, formState } = form;
  const dirty = formState.isDirty;

  useEffect(() => {
    const next = toDashboardProfileForm(user);
    reset({
      firstName: next.firstName,
      lastName: next.lastName,
      email: next.email,
      phone: next.phone,
    });
  }, [user, reset]);

  const onSubmit = async (values: ProfileSettingsFormValues) => {
    try {
      const phone = values.phone.trim();
      await auth.updateProfile({
        first_name: sanitizeAuthText(values.firstName, 80),
        last_name: sanitizeAuthText(values.lastName ?? "", 80) || undefined,
        email: sanitizeEmail(values.email),
        phone: phone ? toApiPhoneNumber(phone) : undefined,
      });
      reset(values);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(
        getUnknownErrorMessage(err, auth.error || "Failed to update profile"),
      );
    }
  };

  return (
    <section
      className="bg-card rounded-sm border border-border p-5"
      aria-labelledby="settings-profile-heading"
    >
      <div className="mb-4">
        <h2
          id="settings-profile-heading"
          className="font-heading text-lg font-bold"
        >
          Profile details
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Photo, name, phone, and email used for orders and account messages.
        </p>
      </div>

      <div className="mb-5 pb-5 border-b border-border">
        <ProfilePhotoField user={user} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormAppInput
            control={control}
            name="firstName"
            id="settings-first-name"
            label="First name"
            labelClassName="text-xs font-medium mb-1 block"
            sanitize="text"
            maxLength={80}
            inputSize="sm"
            autoComplete="given-name"
            required
          />
          <FormAppInput
            control={control}
            name="lastName"
            id="settings-last-name"
            label="Last name"
            labelClassName="text-xs font-medium mb-1 block"
            sanitize="text"
            maxLength={80}
            inputSize="sm"
            autoComplete="family-name"
            hint="Optional"
          />
          <FormPhoneInput
            control={control}
            name="phone"
            id="settings-phone"
            label="Phone"
            labelClassName="text-xs font-medium mb-1 block"
            detectCountry
            hint="Leave blank to keep only the country code, or enter your mobile number."
            inputClassName="h-9 text-sm rounded-r-sm"
            triggerClassName="h-9 rounded-l-sm"
          />
          <FormAppInput
            control={control}
            name="email"
            id="settings-email"
            label="Email"
            labelClassName="text-xs font-medium mb-1 block"
            type="email"
            sanitize="email"
            inputSize="sm"
            autoComplete="email"
            required
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <AppButton
            type="submit"
            className="text-sm"
            disabled={!dirty || auth.isUpdatingProfile}
            isLoading={auth.isUpdatingProfile}
            loadingText="Saving…"
          >
            Save changes
          </AppButton>
          <AppButton
            type="button"
            variant="outline"
            className="text-sm"
            disabled={!dirty || auth.isUpdatingProfile}
            onClick={() => reset()}
          >
            Cancel
          </AppButton>
          {dirty ? (
            <span className="text-[11px] text-muted-foreground">
              Unsaved changes
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}
