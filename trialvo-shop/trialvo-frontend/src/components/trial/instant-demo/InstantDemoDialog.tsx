"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormTextField } from "@/components/form";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProduct } from "@/hooks/useProducts";
import { useSubmitInstantDemo } from "@/hooks/useTrialRequests";
import { ApiError } from "@/lib/api";
import { trialCopy, trialErrorMessage } from "@/lib/trial/copy";
import { localizeNumber } from "@/lib/trial/months";
import {
  productDisplayName,
  productSupportsDemo,
  type DemoSubmitResponse,
  type TrialProductRef,
} from "@/lib/trial/types";
import { createInstantDemoSchema, type InstantDemoValues } from "@/lib/validation";
import { useTrialLaunch, type TrialLaunchOptions } from "../TrialLaunchProvider";
import { HoneypotField } from "../shared/HoneypotField";
import { ProductChip } from "../shared/ProductChip";
import { ProductPickerStep } from "../shared/ProductPickerStep";
import { TrialModalFacts, TrialModalShell } from "../shared/TrialModalShell";
import { ProvisioningSteps } from "./ProvisioningSteps";
import { InstantDemoSuccess } from "./InstantDemoSuccess";

type Phase = "pick" | "form" | "provisioning" | "done" | "error";

export type InstantDemoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: TrialProductRef | null;
  productSlug: string | null;
  onContinueToDomain: (opts: TrialLaunchOptions) => void;
};

const FIELD = "h-11 rounded-lg border-border bg-card";

/**
 * Instant demo: pick product (if needed) → 3-field form → provisioning
 * animation → credentials. The request provisions synchronously, so in the
 * common case the customer never leaves this dialog before they have a login.
 */
export function InstantDemoDialog({
  open,
  onOpenChange,
  product: productProp,
  productSlug,
  onContinueToDomain,
}: Readonly<InstantDemoDialogProps>) {
  const { language } = useLanguage();
  const copy = trialCopy(language);
  const { config, demoAvailable } = useTrialLaunch();
  const submit = useSubmitInstantDemo();

  const [picked, setPicked] = useState<TrialProductRef | null>(null);
  const [result, setResult] = useState<DemoSubmitResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorToken, setErrorToken] = useState<string | null>(null);

  const { data: fetched, isLoading: fetching } = useProduct(!productProp && productSlug ? productSlug : undefined);
  const product = productProp ?? picked ?? fetched ?? null;

  const phase: Phase = errorMsg
    ? "error"
    : result
      ? "done"
      : submit.isPending
        ? "provisioning"
        : product
          ? "form"
          : "pick";

  const schema = useMemo(() => createInstantDemoSchema(language), [language]);
  const form = useForm<InstantDemoValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", website: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setPicked(null);
      setResult(null);
      setErrorMsg(null);
      setErrorToken(null);
      submit.reset();
      form.reset();
    }, 200);
    return () => clearTimeout(t);
  }, [open]);

  const onSubmit = async (values: InstantDemoValues) => {
    if (!product) return;
    setErrorMsg(null);
    try {
      const res = await submit.mutateAsync({
        productSlug: product.slug,
        trialType: "demo",
        name: values.name,
        email: values.email,
        phone: values.phone,
        website: honeypotValue(values.website, values.email),
      });
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(trialErrorMessage(language, err.code, err.message));
        const tok = err.body?.statusToken;
        if (typeof tok === "string") setErrorToken(tok);
      } else {
        setErrorMsg(trialErrorMessage(language, undefined, err instanceof Error ? err.message : undefined));
      }
    }
  };

  const continueToDomain = () => {
    const v = form.getValues();
    onContinueToDomain({
      product,
      sourceRequestId: result?.requestId ?? null,
      prefill: { name: v.name, email: v.email, phone: v.phone },
    });
  };

  const unsupported = product ? !productSupportsDemo(product) : false;
  const showFormFooter = phase === "form" && demoAvailable && !unsupported;

  return (
    <TrialModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={Zap}
      eyebrow={copy.demo.eyebrow}
      title={phase === "done" && product ? productDisplayName(product, language) : copy.demo.title}
      description={
        phase === "done" ? undefined : (
          <TrialModalFacts
            items={[
              copy.demo.accessDays(localizeNumber(config.demoAccessDays, language)),
              copy.demo.noWait,
              copy.demo.fieldsHint,
            ]}
          />
        )
      }
      footer={
        showFormFooter ? (
          <Button
            type="submit"
            form="instant-demo-form"
            size="lg"
            className="h-12 w-full rounded-lg bg-accent font-semibold text-accent-foreground shadow-accent-glow hover:bg-accent/90"
          >
            <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
            {copy.demo.submit}
          </Button>
        ) : undefined
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {phase === "pick" ? (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {fetching ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <ProductPickerStep path="demo" language={language} onPick={setPicked} />
            )}
          </motion.div>
        ) : null}

        {phase === "form" && product ? (
          <motion.div key="form" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
            <ProductChip
              product={product}
              language={language}
              onChange={!productProp && !productSlug ? () => setPicked(null) : undefined}
              changeLabel={language === "bn" ? "বদলান" : "Change"}
              className="mb-5"
            />

            {!demoAvailable ? (
              <Notice tone="warn">{copy.demo.paused}</Notice>
            ) : unsupported ? (
              <Notice tone="warn">{copy.errors.DEMO_UNSUPPORTED}</Notice>
            ) : (
              <Form {...form}>
                <form id="instant-demo-form" onSubmit={form.handleSubmit(onSubmit)} className="relative space-y-3.5" noValidate>
                  <HoneypotField registration={form.register("website")} label={copy.common.honeypotLabel} />
                  <FormTextField control={form.control} name="name" label={copy.common.name} autoComplete="name" requiredMark inputClassName={FIELD} />
                  <FormTextField control={form.control} name="email" type="email" label={copy.common.email} autoComplete="email" requiredMark inputClassName={FIELD} />
                  <FormTextField control={form.control} name="phone" type="tel" label={copy.common.phone} autoComplete="tel" requiredMark inputClassName={FIELD} />
                </form>
              </Form>
            )}
          </motion.div>
        ) : null}

        {phase === "provisioning" ? (
          <motion.div key="prov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProvisioningSteps title={copy.demo.provisioningTitle} steps={copy.demo.provisioningSteps} done={false} />
          </motion.div>
        ) : null}

        {phase === "done" && result ? (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <InstantDemoSuccess
              result={result}
              language={language}
              maxMonths={config.maxMonths}
              domainAvailable={config.domainTrialEnabled && (product ? product.deployConfig?.supports_option2 !== false : true)}
              onContinueToDomain={continueToDomain}
            />
          </motion.div>
        ) : null}

        {phase === "error" ? (
          <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <Notice tone="error">{errorMsg}</Notice>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="h-11 flex-1 rounded-lg" onClick={() => { setErrorMsg(null); submit.reset(); }}>
                {copy.common.retry}
              </Button>
              {errorToken ? (
                <Button asChild className="h-11 flex-1 rounded-lg">
                  <a href={`/${language}/trial-status/${errorToken}`}>{copy.demo.openAccessPage}</a>
                </Button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </TrialModalShell>
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

function honeypotValue(raw: string | undefined, email: string) {
  const v = (raw || "").trim();
  if (!v) return "";
  if (v.toLowerCase() === email.trim().toLowerCase()) return "";
  if (v.includes("@") && !/^https?:\/\//i.test(v)) return "";
  return v;
}

export default InstantDemoDialog;
