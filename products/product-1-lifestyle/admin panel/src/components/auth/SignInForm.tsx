import { useMemo, useState } from "react";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Checkbox from "../form/input/Checkbox";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";

import { api } from "@/api/client";
import { useAuth } from "../../context/AuthProvider";

type LoginResponse = {
  accessToken: string;
  admin: {
    id: number;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    address?: string | null;
    profile_img_path?: string | null;
    roles: string[];
    permissions: string[];
  };
};

type LoginErrorResponse = {
  flag?: number;
  error?: string;
};

export default function SignInForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0 && !isSubmitting;
  }, [email, password, isSubmitting]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error(t("auth.emailPasswordRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<LoginResponse & LoginErrorResponse>("/admin/login", {
        email: email.trim(),
        password: password,
      });

      if (res.data?.flag && res.data.flag !== 200) {
        toast.error(res.data.error || t("auth.loginFailed"));
        return;
      }

      if (!res.data?.accessToken) {
        toast.error(res.data?.error || t("auth.loginFailed"));
        return;
      }

      setSession(res.data.accessToken, res.data.admin, {
        persist: isChecked,
        notify: true,
      });
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const msg = isAxiosError<LoginErrorResponse>(err)
        ? err.response?.data?.error || t("auth.loginFailed")
        : t("auth.loginFailed");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t("auth.signIn")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("auth.signInSubtitle")}
            </p>
          </div>

          <div>
            <form onSubmit={onSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    {t("auth.email")} <span className="text-error-500">*</span>
                  </Label>

                  <Input
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    type="email"
                    name="email"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <Label>
                    {t("auth.password")} <span className="text-error-500">*</span>
                  </Label>

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      name="password"
                      autoComplete="current-password"
                    />

                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      {t("auth.keepLoggedIn")}
                    </span>
                  </div>

                  <Link
                    to="/forgot-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>

                <div>
                  <Button className="w-full" size="sm" type="submit" disabled={!canSubmit}>
                    {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* optional helper */}
          {/* <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Demo: <span className="font-medium">superadmin@shop.com</span> /{" "}
            <span className="font-medium">12345678</span>
          </p> */}
        </div>
      </div>
    </div>
  );
}
