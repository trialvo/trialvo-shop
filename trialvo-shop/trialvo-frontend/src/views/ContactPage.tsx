"use client";

import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/layout/Layout";
import {
  ContactForm,
  ContactGuidance,
  ContactHero,
  ContactInfo,
} from "@/components/contact";
import { CONTACT_PAGE_CONTENT } from "@/lib/contactContent";
import { localize } from "@/lib/localize";
import { useCreateContactMessage } from "@/hooks/useContactMessages";
import type { ContactSchemaValues } from "@/lib/validation";

/**
 * Public Contact page (`/contact`).
 * Banner + RHF/zod form + contact channels.
 */
export default function ContactPage() {
  const { language } = useLanguage();
  const content = CONTACT_PAGE_CONTENT;
  const createMessage = useCreateContactMessage();

  const handleSubmit = async (values: ContactSchemaValues) => {
    try {
      await createMessage.mutateAsync(values);
      toast.success(localize(content.form.success, language));
    } catch {
      toast.error(localize(content.form.error, language));
      throw new Error("contact_submit_failed");
    }
  };

  return (
    <Layout>
      <ContactHero content={content.hero} language={language} />

      <section className="bg-muted/20 py-10 md:py-14">
        <div className="container-custom">
          <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
            <div className="lg:col-span-3">
              <ContactForm
                labels={content.form}
                language={language}
                isSubmitting={createMessage.isPending}
                onSubmit={handleSubmit}
              />
            </div>
            <div className="lg:col-span-2">
              <ContactInfo
                info={content.info}
                channels={content.channels}
                language={language}
                className="lg:sticky lg:top-24"
              />
            </div>
          </div>
        </div>
      </section>

      <ContactGuidance language={language} />
    </Layout>
  );
}
