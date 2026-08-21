'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authErrorBannerClass, authInputClass, authLabelClass, authLinkClass, authPrimaryBtnClass, authSuccessBannerClass } from './auth-ui'

import AuthDivider from './AuthDivider'
import GoogleAuthButton from './GoogleAuthButton'
import PasswordInput from './PasswordInput'

import { useAuth } from '@/hooks/useAuth'
import { useClientIp } from '@/hooks/useClientIp'
import { useGoogleCodeClient } from '@/hooks/useGoogleCodeClient'
import { useTranslation } from '@/hooks/useTranslation'
import { signUpSchema, type SignUpValues } from '@/lib/auth-schemas'
import { getWindowOrigin } from '@/lib/config/googleAuth'
import { GOOGLE_CLIENT_ID } from "@/config/env";
import { useRouter } from 'next/navigation'

interface CreateAccountCardProps {
  signInHref?: string
}

const CreateAccountCard: React.FC<CreateAccountCardProps> = ({
  signInHref = '/sign-in',
}) => {
  const { signUp, isSigningUp, error, clearError, success, clearSuccess, gauthLogin, isGoogleSigningIn } = useAuth()
  const router = useRouter();
  const { ip } = useClientIp();
  const { t } = useTranslation();

  // Tracks whether the email is already registered AND verified (409 conflict)
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { first_name: '', last_name: '', email: '', password: '' },
    mode: 'onSubmit'
  })

  const onSubmit = async (data: SignUpValues) => {
    setAlreadyVerified(false);
    const signUpData = {
      first_name: data?.first_name,
      last_name: data?.last_name,
      email: data?.email,
      password: data?.password,
      ip: ip ?? ""
    }
    try {
      const res = await signUp(signUpData);

      // 409 — email already exists with a verified account
      if (res?.flag === 409) {
        setAlreadyVerified(true);
        return;
      }

      localStorage.setItem("registrationEmail", data?.email);
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("submit_type")
      if (res?.success) {
        router.push('/verify-identify')
      }
    } catch {
      // Error handled in mutation
    }
  }

  const { ready, requestCode, isRequesting } = useGoogleCodeClient({
    clientId: GOOGLE_CLIENT_ID ?? "",
    onAuth: async (payload) => {
      const res = await gauthLogin({
        code: payload.code,
        idToken: payload.idToken,
        redirectUri: getWindowOrigin(),
      });

      if (res?.success) {
        setTimeout(() => {
          router.push("/account");
        }, 100);
      }
    },
    onError: (msg) => {
      void msg;
    },
  });

  return (
    <div className="w-full">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-foreground min-[576px]:text-[32px]">
            {t("auth.createAccountTitle")}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 min-[576px]:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className={authLabelClass}>
                  {t("auth.firstName")}
                </Label>
                <Input
                  id="firstName"
                  placeholder={t("auth.firstNamePlaceholder")}
                  className={authInputClass(!!errors.first_name)}
                  aria-invalid={!!errors.first_name}
                  disabled={isSigningUp}
                  {...register('first_name')}
                />
                {errors.first_name?.message && (
                  <p className="text-[12px] text-destructive">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className={authLabelClass}>
                  {t("auth.lastName")}
                </Label>
                <Input
                  id="lastName"
                  placeholder={t("auth.lastNamePlaceholder")}
                  className={authInputClass(!!errors.last_name)}
                  aria-invalid={!!errors.last_name}
                  disabled={isSigningUp}
                  {...register('last_name')}
                />
                {errors.last_name?.message && (
                  <p className="text-[12px] text-destructive">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className={authLabelClass}>
                {t("auth.email")}
              </Label>
              <Input
                id="email"
                placeholder={t("auth.emailPlaceholder")}
                className={authInputClass(!!errors.email)}
                aria-invalid={!!errors.email}
                disabled={isSigningUp}
                {...register('email', { onChange: () => setAlreadyVerified(false) })}
              />
              {errors.email?.message && (
                <p className="text-[12px] text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className={authLabelClass}>
                {t("auth.createPassword")}
              </Label>

              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.password?.message}
                    disabled={isSigningUp}
                  />
                )}
              />
            </div>

            {error && !alreadyVerified && (
              <div className={authErrorBannerClass} onMouseEnter={clearError}>
                <p className="text-[13px] text-destructive">{error}</p>
              </div>
            )}

            {success && (
              <div className={authSuccessBannerClass} onMouseEnter={clearSuccess}>
                <p className="text-[13px] text-foreground">{success}</p>
              </div>
            )}

            {alreadyVerified && (
              <div className="rounded-[4px] border border-border bg-muted p-3.5">
                <p className="text-[13px] font-medium text-foreground">
                  An account with this email already exists.
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  This email is already registered and verified. You can sign in directly.
                </p>
                <Link
                  href={signInHref}
                  className={`mt-2 inline-flex text-[12px] ${authLinkClass}`}
                >
                  Sign in instead →
                </Link>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSigningUp}
              className={authPrimaryBtnClass}
            >
              {isSigningUp ? t("auth.creating") : t("auth.createAccountTitle")}
            </Button>
          </form>

          <AuthDivider />

          <GoogleAuthButton
            onClick={() => requestCode()}
            disabled={!ready || isRequesting || isSigningUp || isGoogleSigningIn}
            label={isGoogleSigningIn || isRequesting ? t("auth.signingIn") : t("auth.continueWithGoogle")}
          />

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            {t("auth.alreadyHaveAccount")}{' '}
            <Link href={signInHref} className={authLinkClass}>
              {t("common.signIn")}
            </Link>
          </p>
    </div>
  )
}

export default CreateAccountCard
