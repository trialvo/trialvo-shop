import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { FormTextField, FormTextareaField } from "@/components/form";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubmitTrialRequest } from "@/hooks/useTrialRequests";
import { usePublicTrialConfig } from "@/hooks/useTrialSettings";
import {
  createTrialRequestSchema,
  type TrialRequestSchemaValues,
} from "@/lib/validation";
import { useState } from "react";

export type RequestTrialModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productSlug: string;
  productName: string;
  /** From product.deployConfig — missing flags default to true */
  supportsOption1?: boolean;
  supportsOption2?: boolean;
};

/**
 * Trial request modal — react-hook-form + zod with shared FormTextField.
 */
export function RequestTrialModal({
  open,
  onOpenChange,
  productSlug,
  productName,
  supportsOption1 = true,
  supportsOption2 = true,
}: Readonly<RequestTrialModalProps>) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const submit = useSubmitTrialRequest();
  const { data: trialSettings } = usePublicTrialConfig();

  const defaultType: "hosted" | "self_hosted" =
    supportsOption1 ? "hosted" : supportsOption2 ? "self_hosted" : "hosted";
  const [trialType, setTrialType] = useState<"hosted" | "self_hosted">(defaultType);

  // Keep selection valid if product options change
  useEffect(() => {
    if (trialType === "hosted" && !supportsOption1 && supportsOption2) {
      setTrialType("self_hosted");
    } else if (trialType === "self_hosted" && !supportsOption2 && supportsOption1) {
      setTrialType("hosted");
    }
  }, [supportsOption1, supportsOption2, trialType]);

  const t = (bn: string, en: string) => (language === "bn" ? bn : en);

  const schema = useMemo(
    () => createTrialRequestSchema(language, trialType),
    [language, trialType],
  );

  const form = useForm<TrialRequestSchemaValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      domain: "",
      useCase: "",
    },
    mode: "onBlur",
  });

  // Re-validate domain rules when switching trial type
  useEffect(() => {
    void form.trigger("domain");
  }, [trialType, form]);

  const onSubmit = async (values: TrialRequestSchemaValues) => {
    try {
      const res = await submit.mutateAsync({
        productSlug,
        trialType,
        name: values.name,
        email: values.email,
        phone: values.phone,
        company: values.company || undefined,
        desiredDomain:
          trialType === "self_hosted" ? values.domain || undefined : undefined,
        useCase: values.useCase || undefined,
      });

      if (res.existing) {
        toast({
          title: t("আগের ট্রায়াল পাওয়া গেছে", "Existing trial found"),
          description: t(
            "ইমেইলে পাঠানো status লিংক চেক করুন।",
            "Check the status link we sent to your email.",
          ),
        });
      } else {
        toast({
          title: t("অনুরোধ পাঠানো হয়েছে!", "Request submitted!"),
          description: t(
            "অনুমোদন হলে ইমেইলে লিংক পাবেন।",
            "If approved, you will receive a link by email.",
          ),
        });
      }

      form.reset();
      onOpenChange(false);
      const q = new URLSearchParams();
      if (values.email) q.set("email", values.email.trim());
      if (res.existing) q.set("existing", "1");
      window.location.href = `/trial-request-submitted?${q.toString()}`;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("সমস্যা হয়েছে", "Something went wrong");
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("ট্রায়াল অনুরোধ", "Request Trial")} — {productName}
          </DialogTitle>
        </DialogHeader>

        <Form {...form} key={`${trialType}-${language}`}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-2 space-y-4"
            noValidate
          >
            <div className="grid grid-cols-2 gap-2">
              {supportsOption1 ? (
                <Button
                  type="button"
                  variant={trialType === "hosted" ? "default" : "outline"}
                  onClick={() => setTrialType("hosted")}
                  className="h-auto flex-col py-2 text-xs"
                >
                  <span>Option 1</span>
                  <span className="text-[10px] opacity-80">
                    {t("Trialvo হোস্টেড", "Trialvo Hosted")}
                  </span>
                </Button>
              ) : null}
              {supportsOption2 ? (
                <Button
                  type="button"
                  variant={trialType === "self_hosted" ? "default" : "outline"}
                  onClick={() => setTrialType("self_hosted")}
                  className={`h-auto flex-col py-2 text-xs ${supportsOption1 ? "" : "col-span-2"}`}
                >
                  <span>Option 2</span>
                  <span className="text-[10px] opacity-80">
                    {t("আমার ডোমেইন", "My Domain")}
                  </span>
                </Button>
              ) : null}
            </div>

            {!supportsOption1 && supportsOption2 ? (
              <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {t(
                  "এই পণ্যে এখন শুধু Option 2 (নিজের ডোমেইনে) ট্রায়াল উপলব্ধ।",
                  "Only Option 2 (self-hosted) trial is available for this product right now.",
                )}
              </p>
            ) : null}

            {trialSettings ? (
              <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {t("ট্রায়াল মেয়াদ", "Trial period")}:{" "}
                <strong>
                  {trialType === "hosted"
                    ? trialSettings.hostedDays
                    : trialSettings.selfHostedDays}{" "}
                  {t("দিন", "days")}
                </strong>
                <> · {t("অনুমোদন হলে ইমেইলে লিংক পাবেন", "email link when approved")}</>
              </p>
            ) : null}

            <FormTextField
              control={form.control}
              name="name"
              label={t("নাম", "Name")}
              autoComplete="name"
              requiredMark
            />
            <FormTextField
              control={form.control}
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              requiredMark
            />
            <FormTextField
              control={form.control}
              name="phone"
              type="tel"
              label={t("ফোন", "Phone")}
              autoComplete="tel"
              requiredMark
            />
            <FormTextField
              control={form.control}
              name="company"
              label={t("কোম্পানি (ঐচ্ছিক)", "Company (optional)")}
              autoComplete="organization"
            />
            {trialType === "self_hosted" ? (
              <FormTextField
                control={form.control}
                name="domain"
                label={t("ডোমেইন", "Domain")}
                placeholder="myshop.com"
                requiredMark
              />
            ) : null}
            <FormTextareaField
              control={form.control}
              name="useCase"
              label={t("ব্যবহারের উদ্দেশ্য", "Use case")}
              rows={2}
              textareaClassName="min-h-[72px]"
            />

            <Button type="submit" className="w-full" disabled={submit.isPending}>
              {submit.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("অনুরোধ পাঠান", "Submit Request")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default RequestTrialModal;
