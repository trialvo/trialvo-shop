"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirmEmailVerification, useStartEmailVerification } from "@/hooks/useTrialRequests";
import { ApiError } from "@/lib/api";
import { trialCopy, trialErrorMessage } from "@/lib/trial/copy";
import { localizeNumber } from "@/lib/trial/months";
import { createVerifyCodeSchema } from "@/lib/validation";
import type { MarketplaceLanguage } from "@/types/marketplace";

/**
 * Shared 6-digit email OTP step. The parent owns "wrong email / go back";
 * this component only confirms the code and can resend it.
 */
export function EmailVerifyStep({
  email,
  language,
  onVerified,
  resendAfterSeconds = 60,
}: Readonly<{
  email: string;
  language: MarketplaceLanguage;
  onVerified: (verificationToken: string) => void;
  resendAfterSeconds?: number;
}>) {
  const copy = trialCopy(language);
  const confirm = useConfirmEmailVerification();
  const start = useStartEmailVerification();
  const schema = createVerifyCodeSchema(language);

  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(resendAfterSeconds);
  const submittedRef = useRef<string | null>(null);

  useEffect(() => {
    setCooldown(resendAfterSeconds);
  }, [resendAfterSeconds]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const submitCode = async (value: string) => {
    const parsed = schema.safeParse({ code: value });
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? copy.common.errorGeneric);
      return;
    }
    if (submittedRef.current === value || confirm.isPending) return;
    submittedRef.current = value;
    setErrorMsg(null);
    try {
      const res = await confirm.mutateAsync({ email, code: value });
      onVerified(res.verificationToken);
    } catch (err) {
      submittedRef.current = null;
      if (err instanceof ApiError) {
        const left = err.body?.attemptsLeft;
        const base = trialErrorMessage(language, err.code, err.message);
        setErrorMsg(
          err.code === "VERIFY_CODE_INVALID" && typeof left === "number"
            ? `${base} ${copy.verify.attemptsLeft(localizeNumber(left, language))}`
            : base,
        );
        if (err.code === "VERIFY_CODE_INVALID") setCode("");
      } else {
        setErrorMsg(trialErrorMessage(language, undefined, err instanceof Error ? err.message : undefined));
      }
    }
  };

  useEffect(() => {
    if (code.length === 6) void submitCode(code);
  }, [code]);

  const resend = async () => {
    if (cooldown > 0 || start.isPending) return;
    setErrorMsg(null);
    try {
      const res = await start.mutateAsync({ email });
      if (!res.skipped) {
        setCooldown(res.resendAfterSeconds ?? 60);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(trialErrorMessage(language, err.code, err.message));
      } else {
        setErrorMsg(trialErrorMessage(language, undefined, err instanceof Error ? err.message : undefined));
      }
    }
  };

  const pending = confirm.isPending;
  const ready = code.length === 6;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">{copy.verify.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.verify.lead(email)}</p>
      </div>

      {errorMsg ? <Notice tone="error">{errorMsg}</Notice> : null}

      <div className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="trial-verify-code">{copy.verify.codeLabel}</Label>
          <Input
            id="trial-verify-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => {
              submittedRef.current = null;
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submitCode(code);
              }
            }}
            disabled={pending}
            aria-invalid={Boolean(errorMsg)}
            className="h-14 rounded-lg border-border bg-card text-center font-mono text-2xl tracking-[0.4em]"
          />
        </div>

        <Button
          type="button"
          disabled={!ready || pending}
          onClick={() => void submitCode(code)}
          className="h-11 w-full rounded-lg bg-accent font-semibold text-accent-foreground shadow-accent-glow hover:bg-accent/90"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {copy.verify.submitting}
            </>
          ) : (
            copy.verify.submit
          )}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => void resend()}
        disabled={cooldown > 0 || start.isPending}
        className="w-full text-center text-sm font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground disabled:no-underline disabled:opacity-60"
      >
        {start.isPending
          ? copy.verify.submitting
          : cooldown > 0
            ? copy.verify.resendIn(localizeNumber(cooldown, language))
            : copy.verify.resend}
      </button>
    </div>
  );
}

function Notice({ tone, children }: Readonly<{ tone: "warn" | "error"; children: React.ReactNode }>) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/[0.06] px-3 py-2.5 text-sm text-destructive"
          : "flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200"
      }
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export default EmailVerifyStep;
