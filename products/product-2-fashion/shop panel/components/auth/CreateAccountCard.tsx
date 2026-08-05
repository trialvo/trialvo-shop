'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import React, { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <Card className="rounded-none border-0 mt-10 shadow-[0px_0px_20px_rgba(0,0,0,0.05)]">
        <CardContent className="px-4 py-5">
          <h1 className="mt-5 text-center text-2xl font-extrabold text-black">
            {t("auth.createAccountTitle")}
          </h1>

          <div className="mt-7">
            <GoogleAuthButton
              onClick={() => requestCode()}
              disabled={!ready || isRequesting || isSigningUp || isGoogleSigningIn}
              label={isGoogleSigningIn || isRequesting ? t("auth.signingIn") : t("auth.continueWithGoogle")}
            />
          </div>

          <AuthDivider />

          {/* Generic error (only shown when not a 409 already-verified conflict) */}
          {error && !alreadyVerified && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200" onMouseEnter={clearError}>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200" onMouseEnter={clearSuccess}>
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* 409 — email already registered and verified: show a "sign in" CTA */}
          {alreadyVerified && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">
                An account with this email already exists.
              </p>
              <p className="mt-1 text-xs text-blue-700">
                This email is already registered and verified. You can sign in directly.
              </p>
              <Link
                href={signInHref}
                className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Sign in instead →
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-base font-medium text-black">
                  {t("auth.firstName")} <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder={t("auth.firstNamePlaceholder")}
                  className={`h-12 rounded-none text-base ${errors.first_name ? 'border-red-500' : 'border-gray-300'}`}
                  aria-invalid={!!errors.first_name}
                  disabled={isSigningUp}
                  {...register('first_name')}
                />
                {errors.first_name?.message && (
                  <p className="text-sm text-red-600">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-base font-medium text-black">
                  {t("auth.lastName")} <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder={t("auth.lastNamePlaceholder")}
                  className={`h-12 rounded-none text-base ${errors.last_name ? 'border-red-500' : 'border-gray-300'}`}
                  aria-invalid={!!errors.last_name}
                  disabled={isSigningUp}
                  {...register('last_name')}
                />
                {errors.last_name?.message && (
                  <p className="text-sm text-red-600">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium text-black">
                {t("auth.email")} <span className="text-red-600">*</span>
              </Label>
              <Input
                id="email"
                placeholder={t("auth.emailPlaceholder")}
                className={`h-12 rounded-none text-base ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                aria-invalid={!!errors.email}
                disabled={isSigningUp}
                {...register('email', { onChange: () => setAlreadyVerified(false) })}
              />
              {errors.email?.message && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium text-black">
                {t("auth.createPassword")} <span className="text-red-600">*</span>
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

            <Button
              type="submit"
              disabled={isSigningUp}
              className="h-9 w-full rounded-none bg-black text-sm font-medium text-white hover:bg-black/90 disabled:opacity-60"
            >
              {isSigningUp ? t("auth.creating") : t("auth.createAccountTitle")}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-black">
            {t("auth.alreadyHaveAccount")}{' '}
            <Link href={signInHref} className="font-semibold text-[#0088FF] hover:underline">
              {t("common.signIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateAccountCard
