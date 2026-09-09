"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, ArrowRight, Globe, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProduct } from "@/hooks/useProducts";
import { useStartEmailVerification, useSubmitDomainTrial } from "@/hooks/useTrialRequests";
import { ApiError } from "@/lib/api";
import { trialCopy, trialErrorMessage } from "@/lib/trial/copy";
import { monthsRangeLabel } from "@/lib/trial/months";
import {
  productDisplayName,
  productSupportsDomainTrial,
  type DomainSubmitResponse,
  type TrialProductRef,
} from "@/lib/trial/types";
import {
  createDomainTrialSchema,
  DOMAIN_TRIAL_STEP_FIELDS,
  type DomainTrialValues,
} from "@/lib/validation";
import { useTrialLaunch, type DomainPrefill } from "../TrialLaunchProvider";
import { EmailVerifyStep } from "../shared/EmailVerifyStep";
import { HoneypotField } from "../shared/HoneypotField";
import { ProductChip } from "../shared/ProductChip";
import { ProductPickerStep } from "../shared/ProductPickerStep";
import { StepIndicator } from "../shared/StepIndicator";
import { TrialModalFacts, TrialModalShell } from "../shared/TrialModalShell";
import { useDomainTrialWizard } from "./useDomainTrialWizard";
import { HostingStep } from "./steps/HostingStep";
import { DurationStep } from "./steps/DurationStep";
import { ContactStep } from "./steps/ContactStep";
import { SubmittedScreen } from "./steps/SubmittedScreen";

export type DomainTrialWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: TrialProductRef | null;
  productSlug: string | null;
  sourceRequestId: string | null;
  prefill: DomainPrefill | null;
};

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 16 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -16 }),
};

/**
 * Own-domain trial request. Hosting gate first so we never collect details
 * from someone with no server to run the installer on. Email OTP sits
 * between contact and submit.
 */
export function DomainTrialWizard({
  open,
  onOpenChange,
  product: productProp,
  productSlug,
  sourceRequestId,
  prefill,
}: Readonly<DomainTrialWizardProps>) {
  const { language } = useLanguage();
  const copy = trialCopy(language);
  const { config, domainAvailable } = useTrialLaunch();
  const submit = useSubmitDomainTrial();
  const startVerify = useStartEmailVerification();

  const [picked, setPicked] = useState<TrialProductRef | null>(null);
  const [result, setResult] = useState<DomainSubmitResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendAfterSeconds, setResendAfterSeconds] = useState(60);

  const { data: fetched, isLoading: fetching } = useProduct(!productProp && productSlug ? productSlug : undefined);
  const product = productProp ?? picked ?? fetched ?? null;

  const wizard = useDomainTrialWizard(Boolean(product));

  const presets = config.domainMonths.length ? config.domainMonths : [1];
  const schema = useMemo(
    () => createDomainTrialSchema(language, { allowedMonths: presets }),
    [language, presets],
  );

  const form = useForm<DomainTrialValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hostKind: undefined,
      hasHosting: false,
      months: config.defaultMonths,
      domain: "",
      name: prefill?.name ?? "",
      email: prefill?.email ?? "",
      phone: prefill?.phone ?? "",
      company: prefill?.company ?? "",
      notes: "",
      website: "",
      code: "",
    },
    mode: "onTouched",
  });

  useEffect(() => {
    if (!open || !prefill) return;
    if (prefill.name) form.setValue("name", prefill.name);
    if (prefill.email) form.setValue("email", prefill.email);
    if (prefill.phone) form.setValue("phone", prefill.phone);
    if (prefill.company) form.setValue("company", prefill.company);
  }, [open, prefill, form]);

  const { step: wizardStep, go: wizardGo } = wizard;
  useEffect(() => {
    if (open && product && wizardStep === "pick") wizardGo("hosting");
  }, [open, product, wizardStep, wizardGo]);

  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setPicked(null);
      setResult(null);
      setErrorMsg(null);
      setResendAfterSeconds(60);
      submit.reset();
      startVerify.reset();
      form.reset();
      wizard.reset(Boolean(productProp));
    }, 200);
    return () => clearTimeout(t);
  }, [open]);

  const pending = submit.isPending || startVerify.isPending;

  const goNext = async () => {
    const fields = DOMAIN_TRIAL_STEP_FIELDS[wizard.step as keyof typeof DOMAIN_TRIAL_STEP_FIELDS];
    const ok = fields ? await form.trigger(fields) : true;
    if (!ok) return;
    if (wizard.step === "contact") {
      await startVerificationThenAdvance();
      return;
    }
    wizard.next();
  };

  const startVerificationThenAdvance = async () => {
    const values = form.getValues();
    setErrorMsg(null);
    try {
      const started = await startVerify.mutateAsync({
        email: values.email,
        name: values.name,
        website: honeypotValue(values.website, values.email),
      });
      if (started.skipped) {
        await onSubmit(values);
        return;
      }
      setResendAfterSeconds(started.resendAfterSeconds ?? 60);
      wizard.next();
    } catch (err) {
      if (err instanceof ApiError) {
        if (["EMAIL_DISPOSABLE", "EMAIL_INVALID"].includes(err.code || "")) {
          form.setError("email", { message: trialErrorMessage(language, err.code, err.message) });
          return;
        }
        setErrorMsg(trialErrorMessage(language, err.code, err.message));
      } else {
        setErrorMsg(trialErrorMessage(language, undefined, err instanceof Error ? err.message : undefined));
      }
    }
  };

  const onSubmit = async (values: DomainTrialValues, verificationToken?: string) => {
    if (!product) return;
    setErrorMsg(null);
    try {
      const res = await submit.mutateAsync({
        productSlug: product.slug,
        trialType: "domain",
        name: values.name,
        email: values.email,
        phone: values.phone,
        company: values.company || undefined,
        useCase: values.notes || undefined,
        desiredDomain: values.domain || undefined,
        requestedMonths: values.months,
        hostKind: values.hostKind,
        hasHosting: values.hasHosting === true,
        sourceRequestId: sourceRequestId || undefined,
        verificationToken,
        // Autofill often writes the email into the hidden honeypot — send
        // empty so a real human is never rejected as a bot.
        website: honeypotValue(values.website, values.email),
      });
      setResult(res);
      wizard.go("submitted");
    } catch (err) {
      if (err instanceof ApiError) {
        if (["HOSTING_CONFIRMATION_REQUIRED", "HOST_KIND_REQUIRED"].includes(err.code || "")) {
          wizard.go("hosting");
        } else if (["DOMAIN_REQUIRED", "DOMAIN_INVALID"].includes(err.code || "")) {
          wizard.go("duration");
          form.setError("domain", { message: trialErrorMessage(language, err.code, err.message) });
          return;
        } else if (err.code === "MONTHS_INVALID") {
          wizard.go("duration");
          form.setError("months", { message: trialErrorMessage(language, err.code, err.message) });
          return;
        } else if (["EMAIL_DISPOSABLE", "EMAIL_INVALID", "EMAIL_NOT_VERIFIED"].includes(err.code || "")) {
          wizard.go("contact");
          form.setError("email", { message: trialErrorMessage(language, err.code, err.message) });
          return;
        }
        setErrorMsg(trialErrorMessage(language, err.code, err.message));
      } else {
        setErrorMsg(trialErrorMessage(language, undefined, err instanceof Error ? err.message : undefined));
      }
    }
  };

  const unsupported = product ? !productSupportsDomainTrial(product) : false;
  const showSteps = Boolean(product && wizard.step !== "pick" && wizard.step !== "submitted" && domainAvailable && !unsupported);
  const step2Label = presets.length === 1 ? copy.domain.domainLabel : copy.domain.stepDuration;
  const stepLabels = [copy.domain.stepHosting, step2Label, copy.domain.stepContact, copy.domain.stepVerify];
  const onVerify = wizard.step === "verify";

  return (
    <TrialModalShell
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      icon={Globe}
      eyebrow={copy.domain.eyebrow}
      badge={copy.domain.freeFor(monthsRangeLabel(presets, language))}
      title={product && wizard.step === "submitted" ? productDisplayName(product, language) : copy.domain.title}
      description={wizard.step === "submitted" ? undefined : <TrialModalFacts items={[...copy.domain.bullets]} />}
      headerExtra={showSteps ? <StepIndicator steps={stepLabels} current={wizard.index} className="mt-4" /> : null}
      footer={
        showSteps ? (
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={wizard.back}
              disabled={wizard.isFirst || pending}
              className="h-11 rounded-lg px-3"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              {copy.domain.back}
            </Button>
            {onVerify ? null : (
              <Button
                type="submit"
                form="domain-trial-form"
                disabled={pending}
                className="h-11 min-w-[9rem] rounded-lg bg-accent font-semibold text-accent-foreground shadow-accent-glow hover:bg-accent/90"
              >
                {pending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{copy.domain.submitting}</>
                ) : (
                  <>{copy.domain.next}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></>
                )}
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      {product && wizard.step !== "pick" ? (
        <ProductChip
          product={product}
          language={language}
          onChange={!productProp && !productSlug && wizard.step !== "submitted" ? () => { setPicked(null); wizard.go("pick"); } : undefined}
          changeLabel={language === "bn" ? "বদলান" : "Change"}
          className="mb-4"
        />
      ) : null}

      {!domainAvailable ? (
        <Notice>{copy.domain.paused}</Notice>
      ) : unsupported ? (
        <Notice>{copy.errors.DOMAIN_TRIAL_UNSUPPORTED}</Notice>
      ) : (
        <Form {...form}>
          <form
            id="domain-trial-form"
            onSubmit={(e) => { e.preventDefault(); void goNext(); }}
            className="relative"
            noValidate
          >
            <HoneypotField registration={form.register("website")} label={copy.common.honeypotLabel} />

            <AnimatePresence mode="wait" custom={wizard.direction} initial={false}>
              <motion.div
                key={wizard.step}
                custom={wizard.direction}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {wizard.step === "pick" ? (
                  fetching ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                  ) : (
                    <ProductPickerStep path="domain" language={language} onPick={(p) => { setPicked(p); wizard.go("hosting"); }} />
                  )
                ) : null}
                {wizard.step === "hosting" ? (
                  <HostingStep form={form} language={language} />
                ) : null}
                {wizard.step === "duration" ? (
                  <DurationStep form={form} language={language} presets={presets} />
                ) : null}
                {wizard.step === "contact" ? (
                  <ContactStep form={form} language={language} prefilled={Boolean(prefill?.email)} />
                ) : null}
                {wizard.step === "verify" ? (
                  <div className="space-y-4">
                    <EmailVerifyStep
                      email={form.getValues("email")}
                      language={language}
                      resendAfterSeconds={resendAfterSeconds}
                      onVerified={(token) => void onSubmit(form.getValues(), token)}
                    />
                    <button
                      type="button"
                      onClick={wizard.back}
                      className="w-full text-center text-sm font-medium text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
                    >
                      {copy.verify.wrongEmail}
                    </button>
                  </div>
                ) : null}
                {wizard.step === "submitted" && result ? (
                  <SubmittedScreen result={result} language={language} email={form.getValues("email")} />
                ) : null}
              </motion.div>
            </AnimatePresence>

            {errorMsg ? <div className="mt-4"><Notice tone="error">{errorMsg}</Notice></div> : null}
          </form>
        </Form>
      )}
    </TrialModalShell>
  );
}

function Notice({ tone = "warn", children }: Readonly<{ tone?: "warn" | "error"; children: React.ReactNode }>) {
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

/** Empty unless it looks like a bot URL, not an autofilled email. */
function honeypotValue(raw: string | undefined, email: string) {
  const v = (raw || "").trim();
  if (!v) return "";
  if (v.toLowerCase() === email.trim().toLowerCase()) return "";
  if (v.includes("@") && !/^https?:\/\//i.test(v)) return "";
  return v;
}

export default DomainTrialWizard;
