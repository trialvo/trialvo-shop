"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppButton } from "@/components/shared/AppButton";
import { FormAppInput } from "@/components/shared/FormAppInput";
import { useAuthContext } from "@/context/AuthContext";
import { signInSchema, type SignInValues } from "@/lib/auth-schemas";
import { toast } from "sonner";
import type { AuthMode } from "@/components/auth/types";

type AuthSignInFormProps = {
  onModeChange: (mode: AuthMode, email?: string) => void;
  initialEmail?: string;
};

export function AuthSignInForm({
  onModeChange,
  initialEmail = "",
}: AuthSignInFormProps) {
  const auth = useAuthContext();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: initialEmail,
      password: "",
    },
    mode: "onBlur",
  });

  const emailValue = watch("email");

  const onSubmit = async (values: SignInValues) => {
    auth.clearError();

    try {
      const res = await auth.signIn(values);
      if (res?.flag === 403) {
        toast.message("Verify your email to continue");
        onModeChange("verify", values.email);
        return;
      }
      if (res?.success) {
        toast.success("Signed in successfully!");
        return;
      }
      toast.error(auth.error || res?.error || "Sign in failed");
    } catch {
      toast.error(auth.error || "Sign in failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormAppInput
        control={control}
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="email@example.com"
        sanitize="email"
      />

      <FormAppInput
        control={control}
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        passwordToggle
        sanitize="password"
        maxLength={20}
      />

      <div className="flex justify-end -mt-2">
        <button
          type="button"
          className="text-xs font-medium text-primary hover:underline"
          onClick={() => onModeChange("forgot-request", emailValue?.trim())}
        >
          Forgot password?
        </button>
      </div>

      <AppButton
        type="submit"
        fullWidth
        isLoading={auth.isSigningIn || isSubmitting}
      >
        Sign In
      </AppButton>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={() => onModeChange("signup")}
          className="text-primary font-medium"
        >
          Register
        </button>
      </p>
    </form>
  );
}
