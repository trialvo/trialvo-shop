import { useState, useEffect } from "react";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, Mail, Smartphone, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { adminGetForgotPassMethods, adminForgotPassword, adminResetPassword } from "@/api/auth.api";

// ── Types ────────────────────────────────────────────────────────────────────
type Step    = "email" | "otp" | "done";
type Channel = "email" | "sms";
type Methods = { email: boolean; sms: boolean };

function getApiError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    return (
      (err.response?.data as { error?: string; message?: string })?.error ||
      (err.response?.data as { error?: string; message?: string })?.message ||
      fallback
    );
  }
  return fallback;
}

// ── Shared page wrapper — matches SignInForm layout ──────────────────────────
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col flex-1 px-4 py-8 sm:px-6 sm:py-12">
    <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
      {children}
    </div>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
export default function ForgotPasswordForm() {

  // Step & channel state
  const [step,    setStep]    = useState<Step>("email");
  const [channel, setChannel] = useState<Channel>("email");

  // Methods fetched from server
  const [methods,      setMethods]      = useState<Methods>({ email: true, sms: false });
  const [methodsReady, setMethodsReady] = useState(false);

  // Step-1: identifier
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  // Step-2: OTP + new password
  const [otp,             setOtp]             = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [resending,       setResending]       = useState(false);
  const [saving,          setSaving]          = useState(false);

  // Track the identifier used (for step-2 description)
  const [sentEmail, setSentEmail] = useState("");

  // ── Fetch available methods on mount ───────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    adminGetForgotPassMethods()
      .then((res) => {
        if (!mounted) return;
        setMethods({ email: res.email, sms: res.sms });
        // Default to email if available, else sms
        setChannel(res.email ? "email" : "sms");
      })
      .catch(() => {
        // Silently fall back to email-only
      })
      .finally(() => {
        if (mounted) setMethodsReady(true);
      });
    return () => { mounted = false; };
  }, []);

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  const handleSendOtp = async (isResend = false) => {
    const setter = isResend ? setResending : setSendingOtp;
    setter(true);

    try {
      let payload: { email?: string; phone?: string };
      if (channel === "sms") {
        const trimmedPhone = phone.trim();
        if (!trimmedPhone) { toast.error("Please enter your phone number."); return; }
        payload = { phone: trimmedPhone };
        setSentEmail(trimmedPhone);
      } else {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) { toast.error("Please enter your email address."); return; }
        payload = { email: trimmedEmail };
        setSentEmail(trimmedEmail);
      }

      const res = await adminForgotPassword(payload);
      toast.success(res.message || "OTP sent!");
      if (!isResend) setStep("otp");
    } catch (err) {
      toast.error(getApiError(err, "Failed to send OTP. Please try again."));
    } finally {
      setter(false);
    }
  };

  // ── Step 2: Reset password ─────────────────────────────────────────────────
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim())            { toast.error("OTP is required.");                       return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match.");         return; }

    setSaving(true);
    try {
      const resetPayload =
        channel === "sms"
          ? { phone: phone.trim(), otp: otp.trim(), new_password: newPassword }
          : { email: email.trim(), otp: otp.trim(), new_password: newPassword };

      await adminResetPassword(resetPayload);
      toast.success("Password reset successful! You can now sign in.");
      setStep("done");
    } catch (err) {
      toast.error(getApiError(err, "Invalid or expired OTP. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  // ── Done screen ────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <Wrapper>
        <div className="flex flex-col items-center gap-6 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/10">
            <CheckCircle2 size={32} className="text-success-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              Password Reset Successful
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
          >
            <ArrowLeft size={16} />
            Back to Sign In
          </Link>
        </div>
      </Wrapper>
    );
  }

  // ── Step 2: OTP + new password ─────────────────────────────────────────────
  if (step === "otp") {
    const isSms = channel === "sms";
    return (
      <Wrapper>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="mb-2 sm:mb-5">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
              {isSms ? (
                <Smartphone size={22} className="text-brand-600 dark:text-brand-400" />
              ) : (
                <Mail size={22} className="text-brand-600 dark:text-brand-400" />
              )}
            </div>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {isSms ? "Check Your Phone" : "Check Your Email"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              We sent a 6-digit OTP to{" "}
              <span className="font-medium text-gray-800 dark:text-gray-200">{sentEmail}</span>.
              Enter it below along with your new password.
            </p>
            {/* Channel badge */}
            <div className="mt-2">
              {isSms ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
                  📱 SMS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                  📧 Email
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleReset} className="space-y-5">
            {/* OTP */}
            <div>
              <Label>OTP Code <span className="text-error-500">*</span></Label>
              <input
                id="forgot-otp"
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                value={otp}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                autoComplete="one-time-code"
                className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus-visible:outline-none focus-visible:border-brand-500 transition-colors duration-150 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 dark:focus-visible:border-brand-500 dark:placeholder:text-white/30"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">OTP expires in 10 minutes.</p>
            </div>

            {/* New password */}
            <div>
              <Label>New Password <span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input
                  id="forgot-new-password"
                  type={showNew ? "text" : "password"}
                  placeholder="8–12 characters"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showNew ? "Hide" : "Show"}
                >
                  {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <Label>Confirm Password <span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input
                  id="forgot-confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showConfirm ? "Hide" : "Show"}
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-error-500">Passwords do not match.</p>
              )}
            </div>

            <Button
              className="w-full"
              size="md"
              type="submit"
              isLoading={saving}
              loadingText="Resetting..."
              disabled={!otp.trim() || newPassword.length < 8 || newPassword !== confirmPassword || saving}
            >
              Reset Password
            </Button>
          </form>

          {/* Resend + back */}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => handleSendOtp(true)}
              disabled={resending}
              className="text-brand-500 transition-colors hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend OTP"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); }}
              className="inline-flex items-center gap-1 text-gray-500 transition-colors hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
            >
              <ArrowLeft size={13} />
              {channel === "sms" ? "Change phone" : "Change email"}
            </button>
          </div>
        </div>
      </Wrapper>
    );
  }

  // ── Step 1: Identifier form ────────────────────────────────────────────────
  const showBothTabs = methods.email && methods.sms;

  return (
    <Wrapper>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="mb-2 sm:mb-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
            <Lock size={22} className="text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Forgot Password?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {showBothTabs
              ? "Choose how you'd like to receive your one-time reset code."
              : channel === "sms"
                ? "Enter your registered phone number. We'll send you a one-time reset code via SMS."
                : "Enter your admin email address. We'll send you a one-time reset code."}
          </p>
        </div>

        {/* Channel tabs — only shown when both are enabled */}
        {methodsReady && showBothTabs && (
          <div className="flex rounded-xl border border-gray-200 p-1 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={() => setChannel("email")}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                channel === "email"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              ].join(" ")}
            >
              <Mail size={15} />
              Email
            </button>
            <button
              type="button"
              onClick={() => setChannel("sms")}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                channel === "sms"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              ].join(" ")}
            >
              <Smartphone size={15} />
              SMS / Phone
            </button>
          </div>
        )}

        {/* Skeleton while fetching methods */}
        {!methodsReady && (
          <div className="h-11 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        )}

        {/* Both channels disabled — show notice instead of form */}
        {methodsReady && !methods.email && !methods.sms && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-6 text-center dark:border-gray-700 dark:bg-gray-800/50">
            <p className="text-3xl">🔒</p>
            <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
              Password reset is temporarily unavailable
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Self-service password reset has been disabled by your administrator.
              Please contact support for assistance.
            </p>
          </div>
        )}

        {/* Input form — only when at least one channel is enabled */}
        {methodsReady && (methods.email || methods.sms) && (
          <div className="space-y-5">
            {channel === "email" ? (
              <div>
                <Label>Email <span className="text-error-500">*</span></Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  autoComplete="email"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleSendOtp(false);
                  }}
                />
              </div>
            ) : (
              <div>
                <Label>Phone Number <span className="text-error-500">*</span></Label>
                <Input
                  id="forgot-phone"
                  type="tel"
                  placeholder="+8801XXXXXXXXX"
                  value={phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                  autoComplete="tel"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleSendOtp(false);
                  }}
                />
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Use the phone number registered with your admin account.
                </p>
              </div>
            )}

            <Button
              className="w-full"
              size="md"
              onClick={() => handleSendOtp(false)}
              isLoading={sendingOtp}
              loadingText="Sending..."
              disabled={
                sendingOtp ||
                (channel === "email" ? !email.trim() : !phone.trim())
              }
            >
              {channel === "sms" ? "Send OTP via SMS" : "Send OTP"}
            </Button>
          </div>
        )}

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>
      </div>
    </Wrapper>
  );
}
