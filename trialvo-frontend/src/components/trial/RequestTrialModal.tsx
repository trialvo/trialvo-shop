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
};

/**
 * Trial request modal — react-hook-form + zod with shared FormTextField.
 */
export function RequestTrialModal({
  open,
  onOpenChange,
  productSlug,
  productName,
}: Readonly<RequestTrialModalProps>) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const submit = useSubmitTrialRequest();
  const { data: trialSettings } = usePublicTrialConfig();
  const [trialType, setTrialType] = useState<"hosted" | "self_hosted">("hosted");

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
            "এই ইমেইলে ইতিমধ্যে একটি ট্রায়াল আছে। Status পেজে নিয়ে যাওয়া হচ্ছে।",
            "You already have a trial for this email. Opening your status page.",
          ),
        });
      } else {
        toast({
          title: t(
            res.autoApproved ? "ট্রায়াল প্রস্তুত!" : "অনুরোধ পাঠানো হয়েছে!",
            res.autoApproved ? "Trial is ready!" : "Request submitted!",
          ),
          description: t(
            res.autoApproved
              ? "লগইন তথ্য status পেজে দেখুন। ইমেইলও পাঠানো হয়েছে।"
              : "ইমেইলে আপডেট পাবেন। Status পেজ খোলা হয়েছে।",
            res.autoApproved
              ? "Login details are on your status page. We emailed you too."
              : "Check email for updates. Status page opened.",
          ),
        });
      }

      form.reset();
      onOpenChange(false);
      if (res.statusUrl) window.location.href = res.statusUrl;
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
              <Button
                type="button"
                variant={trialType === "self_hosted" ? "default" : "outline"}
                onClick={() => setTrialType("self_hosted")}
                className="h-auto flex-col py-2 text-xs"
              >
                <span>Option 2</span>
                <span className="text-[10px] opacity-80">
                  {t("আমার ডোমেইন", "My Domain")}
                </span>
              </Button>
            </div>

            {trialSettings ? (
              <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {t("ট্রায়াল মেয়াদ", "Trial period")}:{" "}
                <strong>
                  {trialType === "hosted"
                    ? trialSettings.hostedDays
                    : trialSettings.selfHostedDays}{" "}
                  {t("দিন", "days")}
                </strong>
                {trialType === "hosted" && trialSettings.autoApproveHosted ? (
                  <> · {t("তাৎক্ষণিক অনুমোদন", "instant approval")}</>
                ) : null}
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
