import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormTextField, FormTextareaField } from "@/components/form";
import { localize } from "@/lib/localize";
import {
  createContactSchema,
  type ContactSchemaValues,
} from "@/lib/validation";
import type { ContactFormLabels } from "@/types/contact";
import type { MarketplaceLanguage } from "@/types/marketplace";

export type ContactFormProps = {
  labels: ContactFormLabels;
  language: MarketplaceLanguage;
  isSubmitting: boolean;
  onSubmit: (values: ContactSchemaValues) => Promise<void>;
};

/** Contact form — react-hook-form + zod, reusable FormTextField inputs */
export function ContactForm({
  labels,
  language,
  isSubmitting,
  onSubmit,
}: Readonly<ContactFormProps>) {
  const schema = useMemo(() => createContactSchema(language), [language]);

  const form = useForm<ContactSchemaValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
    mode: "onBlur",
  });

  const handleValidSubmit = async (values: ContactSchemaValues) => {
    try {
      await onSubmit(values);
      form.reset();
    } catch {
      // Parent handles toast; keep field values for retry
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-6 border-b border-border pb-5">
        <h2 className="font-display text-xl font-bold tracking-tight">
          {localize(labels.title, language)}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {localize(labels.supporting, language)}
        </p>
      </div>

      <Form {...form} key={language}>
        <form
          onSubmit={form.handleSubmit(handleValidSubmit)}
          className="space-y-5"
          noValidate
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormTextField
              control={form.control}
              name="name"
              label={localize(labels.name, language)}
              placeholder={
                language === "bn" ? "আপনার পূর্ণ নাম" : "Your full name"
              }
              autoComplete="name"
              requiredMark
            />
            <FormTextField
              control={form.control}
              name="email"
              type="email"
              label={localize(labels.email, language)}
              placeholder="you@example.com"
              autoComplete="email"
              requiredMark
            />
          </div>

          <FormTextField
            control={form.control}
            name="subject"
            label={localize(labels.subject, language)}
            placeholder={
              language === "bn"
                ? "যেমন: প্রোডাক্ট সাপোর্ট"
                : "e.g. Product support"
            }
            requiredMark
          />

          <FormTextareaField
            control={form.control}
            name="message"
            label={localize(labels.message, language)}
            placeholder={
              language === "bn"
                ? "আপনার প্রশ্ন বা বিস্তারিত লিখুন…"
                : "Tell us how we can help…"
            }
            rows={6}
            requiredMark
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {language === "bn"
                ? "সাধারণত ২৪ ঘণ্টার মধ্যে উত্তর দিই।"
                : "We usually reply within 24 hours."}
            </p>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 rounded-lg bg-accent px-6 font-semibold text-accent-foreground hover:bg-accent/90 sm:min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  {localize(labels.submitting, language)}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                  {localize(labels.submit, language)}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default ContactForm;
