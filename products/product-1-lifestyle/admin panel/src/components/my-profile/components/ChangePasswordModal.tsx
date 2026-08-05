import { useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Modal from "@/components/ui/modal/Modal";
import {
  useAdminForgotPassword,
  useAdminResetPassword,
} from "@/hooks/profile/useProfile";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onChanged: () => void;
};

type Step = "otp" | "reset";

export default function ChangePasswordModal({
  isOpen,
  onClose,
  email,
  onChanged,
}: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("otp");

  const [localEmail, setLocalEmail] = useState(email || "");
  const [otp, setOtp] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ next: false, confirm: false });

  const forgot = useAdminForgotPassword();
  const reset = useAdminResetPassword();

  const saving = forgot.isPending || reset.isPending;

  const error = useMemo(() => {
    if (step === "otp") {
      if (!localEmail.trim()) return t("myProfile.password.errors.emailRequired");
      return "";
    }

    if (!otp.trim()) return t("myProfile.password.errors.otpRequired");

    if (!next.trim()) return t("myProfile.password.errors.newPasswordRequired");
    if (next.trim().length < 8) return t("myProfile.password.errors.passwordTooShort");
    if (confirm.trim() !== next.trim()) return t("myProfile.password.errors.confirmMismatch");

    return "";
  }, [confirm, localEmail, next, otp, step, t]);

  const resetAll = () => {
    setStep("otp");
    setLocalEmail(email || "");
    setOtp("");
    setNext("");
    setConfirm("");
    setShow({ next: false, confirm: false });
  };

  const sendOtp = async () => {
    if (!localEmail.trim()) return;
    await forgot.mutateAsync({ email: localEmail.trim() });
    setStep("reset");
  };

  const submitReset = async () => {
    if (error) return;

    const otpNum = Number(otp);
    const res = await reset.mutateAsync({
      email: localEmail.trim(),
      otp: otpNum,
      new_password: next.trim(),
    });

    if (res?.success === true) {
      onChanged();
      resetAll();
      onClose();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => {
        resetAll();
        onClose();
      }}
      size="sm"
      title={t("myProfile.password.title")}
      description={t("myProfile.password.description")}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("myProfile.password.emailLabel")} <span className="text-error-500">*</span>
          </p>

          <div className="relative">
            <Input
              startIcon={<Mail size={16} />}
              className="pl-9"
              value={localEmail}
              onChange={(e) => setLocalEmail(e.target.value)}
              placeholder={t("myProfile.password.emailPlaceholder")}
              disabled={saving}
            />
          </div>
        </div>

        {step === "otp" ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
            {t("myProfile.password.otpHint")}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("myProfile.password.otpLabel")}{" "}
                <span className="text-error-500">*</span>
              </p>
              <div className="relative">
                <Input
                  startIcon={<KeyRound size={16} />}
                  className="pl-9"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder={t("myProfile.password.otpPlaceholder")}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("myProfile.password.newPasswordLabel")}{" "}
                <span className="text-error-500">*</span>
              </p>
              <div className="relative">
                <Input
                  startIcon={<Lock size={16} />}
                  className="pl-9 pr-12"
                  type={show.next ? "text" : "password"}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder={t("myProfile.password.newPasswordPlaceholder")}
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() => setShow((p) => ({ ...p, next: !p.next }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={
                    show.next
                      ? t("myProfile.password.hidePassword")
                      : t("myProfile.password.showPassword")
                  }
                >
                  {show.next ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("myProfile.password.confirmPasswordLabel")}{" "}
                <span className="text-error-500">*</span>
              </p>
              <div className="relative">
                <Input
                  startIcon={<Lock size={16} />}
                  className="pl-9 pr-12"
                  type={show.confirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t("myProfile.password.confirmPasswordPlaceholder")}
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShow((p) => ({ ...p, confirm: !p.confirm }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={
                    show.confirm
                      ? t("myProfile.password.hidePassword")
                      : t("myProfile.password.showPassword")
                  }
                >
                  {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {error ? (
          <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-900/40 dark:bg-error-500/10 dark:text-error-300">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              resetAll();
              onClose();
            }}
            disabled={saving}
          >
            {t("myProfile.password.cancel")}
          </Button>

          {step === "otp" ? (
            <Button onClick={sendOtp} disabled={saving || !localEmail.trim()}>
              {saving ? t("myProfile.password.sending") : t("myProfile.password.sendOtp")}
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                onClick={sendOtp}
                disabled={saving || !localEmail.trim()}
              >
                {t("myProfile.password.resendOtp")}
              </Button>
              <Button onClick={submitReset} disabled={saving || Boolean(error)}>
                {saving ? t("myProfile.password.saving") : t("myProfile.password.updatePassword")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
