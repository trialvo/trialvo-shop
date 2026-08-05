"use client";

import Link from "next/link";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SignInValues } from "@/lib/validation/auth";
import { signInSchema } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";
import { AuthInput } from "./AuthInput";
import { AuthSubmitButton } from "./AuthSubmitButton";

interface LoginFormProps {
  onSubmit: SubmitHandler<SignInValues>;
  isSubmitting?: boolean;
  onFieldChange?: () => void;
}

export function LoginForm({
  onSubmit,
  isSubmitting = false,
  onFieldChange,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <AuthInput
        {...register("email", { onChange: onFieldChange })}
        icon={<Mail size={16} />}
        type="text"
        placeholder="Email or Mobile Number"
        autoComplete="username"
        disabled={isSubmitting}
        error={errors.email?.message}
      />

      <AuthInput
        {...register("password", { onChange: onFieldChange })}
        icon={<Lock size={16} />}
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        autoComplete="current-password"
        disabled={isSubmitting}
        error={errors.password?.message}
        rightAddon={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword((value) => !value)}
            className={cn(
              "h-auto w-auto bg-transparent p-0 text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground",
              "focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60",
            )}
            disabled={isSubmitting}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
        }
      />

      <div className="text-right">
        <Link
          href="/auth/forgot-password"
          className="text-xs tracking-wide text-accent transition-colors hover:text-accent/80"
        >
          Forgot Password?
        </Link>
      </div>

      <AuthSubmitButton
        isLoading={isSubmitting}
        label="Sign In"
        trailingIcon={<ArrowRight size={14} />}
      />
    </form>
  );
}
