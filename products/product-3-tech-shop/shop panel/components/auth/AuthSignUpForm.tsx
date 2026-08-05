"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppButton } from "@/components/shared/AppButton";
import { FormAppInput } from "@/components/shared/FormAppInput";
import { useAuthContext } from "@/context/AuthContext";
import { signUpSchema, type SignUpValues } from "@/lib/auth-schemas";
import { toast } from "sonner";
import type { AuthMode } from "@/components/auth/types";

type AuthSignUpFormProps = {
  onModeChange: (mode: AuthMode, email?: string) => void;
};

export function AuthSignUpForm({ onModeChange }: AuthSignUpFormProps) {
  const auth = useAuthContext();

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (values: SignUpValues) => {
    auth.clearError();

    try {
      const res = await auth.signUp(values);
      if (res?.flag === 409) {
        toast.message("Account already exists — sign in instead");
        onModeChange("signin", values.email);
        return;
      }
      if (res?.success) {
        toast.success(
          res.message || "Account created! Check your email for the OTP.",
        );
        onModeChange("verify", values.email);
        return;
      }
      toast.error(auth.error || res?.error || "Registration failed");
    } catch {
      toast.error(auth.error || "Registration failed");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormAppInput
          control={control}
          name="first_name"
          label="First Name"
          autoComplete="given-name"
          placeholder="First name"
          sanitize="text"
          maxLength={50}
        />
        <FormAppInput
          control={control}
          name="last_name"
          label="Last Name"
          autoComplete="family-name"
          placeholder="Last name"
          sanitize="text"
          maxLength={50}
        />
      </div>

      <FormAppInput
        control={control}
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="email@example.com"
        sanitize="email"
      />

      <FormAppInput
        control={control}
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="8–20 characters"
        hint="Use 8–20 characters"
        passwordToggle
        sanitize="password"
        maxLength={20}
      />

      <AppButton
        type="submit"
        fullWidth
        isLoading={auth.isSigningUp || isSubmitting}
      >
        Register
      </AppButton>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => onModeChange("signin")}
          className="text-primary font-medium"
        >
          Sign In
        </button>
      </p>
    </form>
  );
}
