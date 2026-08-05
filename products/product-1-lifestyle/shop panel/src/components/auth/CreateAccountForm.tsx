"use client";

import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SignUpValues } from "@/lib/validation/auth";
import { signUpSchema } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";
import { AuthInput } from "./AuthInput";
import { AuthSubmitButton } from "./AuthSubmitButton";

interface CreateAccountFormProps {
  onSubmit: SubmitHandler<SignUpValues>;
  isSubmitting?: boolean;
  onFieldChange?: () => void;
}

export function CreateAccountForm({
  onSubmit,
  isSubmitting = false,
  onFieldChange,
}: CreateAccountFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { first_name: "", last_name: "", email: "", password: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-2 gap-3">
        <AuthInput
          {...register("first_name", { onChange: onFieldChange })}
          icon={<User size={16} />}
          type="text"
          placeholder="First Name"
          autoComplete="given-name"
          disabled={isSubmitting}
          error={errors.first_name?.message}
        />

        <AuthInput
          {...register("last_name", { onChange: onFieldChange })}
          icon={<User size={16} />}
          type="text"
          placeholder="Last Name"
          autoComplete="family-name"
          disabled={isSubmitting}
          error={errors.last_name?.message}
        />
      </div>

      <AuthInput
        {...register("email", { onChange: onFieldChange })}
        icon={<Mail size={16} />}
        type="email"
        placeholder="Email Address"
        autoComplete="email"
        disabled={isSubmitting}
        error={errors.email?.message}
      />

      <AuthInput
        {...register("password", { onChange: onFieldChange })}
        icon={<Lock size={16} />}
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        autoComplete="new-password"
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

      <AuthSubmitButton
        isLoading={isSubmitting}
        label="Create Account"
        trailingIcon={<ArrowRight size={14} />}
      />
    </form>
  );
}
