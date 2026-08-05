"use client";

import {
  useState,
  type ReactElement,
  type SyntheticEvent,
} from "react";
import { toast } from "sonner";
import { AppButton } from "@/components/shared/AppButton";
import { AppInput } from "@/components/shared/AppInput";
import { useAuthContext } from "@/context/AuthContext";
import {
  getPasswordChangeFieldErrors,
  type PasswordChangeFieldErrors,
  type PasswordChangeFormValues,
} from "@/lib/adapters/accountSettings";
import { getUnknownErrorMessage } from "@/lib/api/errors";

const EMPTY_FORM: PasswordChangeFormValues = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

/**
 * Settings → change password form (typed field errors).
 */
export function PasswordChangeCard(): ReactElement {
  const auth = useAuthContext();
  const [form, setForm] = useState<PasswordChangeFormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] =
    useState<PasswordChangeFieldErrors>({});
  const [touched, setTouched] = useState(false);

  const patch = <K extends keyof PasswordChangeFormValues>(
    key: K,
    value: PasswordChangeFormValues[K],
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (touched) setFieldErrors(getPasswordChangeFieldErrors(next));
      return next;
    });
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched(true);

    const errors = getPasswordChangeFieldErrors(form);
    setFieldErrors(errors);
    const firstError = Object.values(errors)[0];
    if (firstError) {
      toast.error(firstError);
      return;
    }

    try {
      await auth.changePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password changed successfully");
      setForm(EMPTY_FORM);
      setFieldErrors({});
      setTouched(false);
    } catch (err) {
      toast.error(
        getUnknownErrorMessage(err, auth.error || "Password change failed"),
      );
    }
  };

  return (
    <section
      className="bg-card rounded-sm border border-border p-5"
      aria-labelledby="settings-password-heading"
    >
      <div className="mb-4">
        <h2
          id="settings-password-heading"
          className="font-heading text-lg font-bold"
        >
          Password
        </h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Use 8–20 characters. Choose something you do not reuse elsewhere.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        className="space-y-3 max-w-md"
      >
        <AppInput
          id="settings-current-password"
          name="oldPassword"
          label="Current password"
          labelClassName="text-xs font-medium mb-1 block"
          type="password"
          value={form.oldPassword}
          onValueChange={(v) => patch("oldPassword", v)}
          placeholder="Current password"
          passwordToggle
          sanitize="password"
          maxLength={20}
          inputSize="sm"
          autoComplete="current-password"
          errorMessage={fieldErrors.oldPassword}
        />
        <AppInput
          id="settings-new-password"
          name="newPassword"
          label="New password"
          labelClassName="text-xs font-medium mb-1 block"
          type="password"
          value={form.newPassword}
          onValueChange={(v) => patch("newPassword", v)}
          placeholder="New password"
          passwordToggle
          sanitize="password"
          maxLength={20}
          inputSize="sm"
          autoComplete="new-password"
          errorMessage={fieldErrors.newPassword}
        />
        <AppInput
          id="settings-confirm-password"
          name="confirmPassword"
          label="Confirm password"
          labelClassName="text-xs font-medium mb-1 block"
          type="password"
          value={form.confirmPassword}
          onValueChange={(v) => patch("confirmPassword", v)}
          placeholder="Confirm password"
          passwordToggle
          sanitize="password"
          maxLength={20}
          inputSize="sm"
          autoComplete="new-password"
          errorMessage={fieldErrors.confirmPassword}
        />
        <AppButton
          type="submit"
          className="text-sm"
          isLoading={auth.isPasswordChanging}
          loadingText="Updating…"
        >
          Update password
        </AppButton>
      </form>
    </section>
  );
}
