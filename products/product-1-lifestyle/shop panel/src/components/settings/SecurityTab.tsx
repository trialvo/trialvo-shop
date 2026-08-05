"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Shield, CheckCircle } from "lucide-react";
import { useState } from "react";
import { FormField } from "@/components/ui/FormField";
import { passwordSchema } from "@/lib/validation/profile";
import type { PasswordFormData } from "@/lib/validation/profile";
import { cn } from "@/lib/utils";

interface SecurityTabProps {
  saving?: boolean;
  onChangePassword: (data: PasswordFormData) => void | Promise<void>;
}

/** Visual password-strength tiers based on content */
function getPasswordStrength(password: string): {
  score: 0 | 1 | 2 | 3;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "" };
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const long = password.length >= 12;
  const score = [hasUpper, hasDigit, hasSpecial, long].filter(Boolean).length as 0 | 1 | 2 | 3;
  const map = {
    0: { label: "Too weak", color: "bg-destructive" },
    1: { label: "Weak", color: "bg-warning" },
    2: { label: "Fair", color: "bg-warning" },
    3: { label: "Strong", color: "bg-success" },
  };
  return { score, ...map[score] };
}

export function SecurityTab({ saving = false, onChangePassword }: SecurityTabProps) {
  const [submitted, setSubmitted] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const newPasswordValue = watch("newPassword") ?? "";
  const strength = getPasswordStrength(newPasswordValue);

  const onSubmit = async (_data: PasswordFormData) => {
    await onChangePassword(_data);
    reset();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-medium tracking-[0.1em] uppercase text-foreground mb-6">
        Security Settings
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          label="Current Password *"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register("currentPassword")}
        />

        <div className="space-y-2">
          <FormField
            label="New Password *"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          {/* Strength bar */}
          {newPasswordValue && (
            <div className="space-y-1">
              <div className="flex gap-1 h-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-1 rounded-full transition-colors duration-300",
                      i < strength.score ? strength.color : "bg-border"
                    )}
                  />
                ))}
              </div>
              <p className={cn(
                "text-[11px] font-medium",
                strength.score <= 1 ? "text-destructive" : strength.score === 2 ? "text-warning" : "text-success"
              )}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        <FormField
          label="Confirm New Password *"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || saving}
            className="bg-primary text-primary-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 disabled:opacity-60 rounded"
          >
            {isSubmitting || saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Shield size={14} />
            )}
            Update Password
          </button>
          {submitted && (
            <span className="flex items-center gap-1.5 text-xs text-success font-medium">
              <CheckCircle size={14} /> Updated!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
