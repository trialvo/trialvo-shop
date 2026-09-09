"use client";

import { BookOpen, LifeBuoy } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import Layout from "@/components/layout/Layout";
import Breadcrumb from "@/components/navigation/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Eyebrow, IconTile, Section, SectionIntro, Surface } from "@/components/section";
import { useLanguage } from "@/contexts/LanguageContext";
import { INSTALL_GUIDE } from "@/lib/content/installGuide";
import { localize } from "@/lib/localize";

const UI = {
  bn: {
    home: "হোম",
    jump: "বিভাগে যান",
    helpTitle: "আটকে গেছেন?",
    helpBody:
      "গাইড আর ZIP-এর INSTALL.md একই পথ বলে। তবুও না চললে স্ট্যাটাস পেজ বা যোগাযোগ ফর্ম থেকে আমাদের লিখুন — পুরো agent.env পাঠাবেন না, শুধু ইনস্টল আইডি দিলেই হয়।",
    contact: "যোগাযোগ করুন",
    how: "কীভাবে কাজ করে",
  },
  en: {
    home: "Home",
    jump: "Jump to a section",
    helpTitle: "Still stuck?",
    helpBody:
      "This page and INSTALL.md inside the ZIP describe the same path. If it still will not start, write from the status page or the contact form — send the install id only, not the full agent.env file.",
    contact: "Contact us",
    how: "How it works",
  },
} as const;

/** Customer-facing Option-2 install guide (`/docs/install`). */
export default function InstallGuidePage() {
  const { language } = useLanguage();
  const ui = UI[language];
  const content = INSTALL_GUIDE;

  return (
    <Layout>
      <Section tone="muted" pattern="mesh" size="sm" divider="bottom">
        <Breadcrumb
          items={[
            { label: ui.home, href: "/" },
            { label: localize(content.title, language) },
          ]}
        />

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <IconTile icon={BookOpen} size="lg" />
          <div className="min-w-0">
            <Eyebrow className="mb-4">{localize(content.eyebrow, language)}</Eyebrow>
            <h1 className="font-display text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-[2.25rem] md:text-[2.75rem]">
              {localize(content.title, language)}
            </h1>
            <p className="mt-4 max-w-[68ch] text-[15px] leading-7 text-muted-foreground md:text-base md:leading-[1.75]">
              {localize(content.lead, language)}
            </p>
          </div>
        </div>

        <nav aria-label={ui.jump} className="mt-8">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {content.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-flex min-h-[2rem] items-center py-1 text-xs font-medium text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-accent-strong hover:decoration-accent/50"
                >
                  {localize(section.title, language)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      <Section containerClassName="max-w-4xl">
        <div className="space-y-14 md:space-y-20">
          {content.sections.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-28">
              <SectionIntro
                className="mb-6 md:mb-7"
                title={localize(section.title, language)}
                lead={localize(section.lead, language)}
              />
              <ol className="space-y-3">
                {section.steps.map((step, index) => (
                  <li key={`${section.id}-${index}`}>
                    <Surface className="flex gap-4 p-4 md:p-5">
                      <span className="font-display mt-0.5 w-8 shrink-0 text-sm font-bold tabular-nums text-accent">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-[15px] leading-7 text-foreground">
                        {localize(step, language)}
                      </p>
                    </Surface>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="muted" pattern="dots" divider="top">
        <Surface sheen className="p-6 md:p-8">
          <IconTile icon={LifeBuoy} size="lg" className="mb-5" />
          <h2 className="font-display text-xl font-bold tracking-tight">{ui.helpTitle}</h2>
          <p className="mt-2.5 max-w-[68ch] text-[15px] leading-7 text-muted-foreground">
            {ui.helpBody}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              asChild
              size="sm"
              className="h-10 rounded-lg bg-accent px-5 font-semibold text-accent-foreground shadow-accent-glow transition-transform hover:bg-accent/90 hover:-translate-y-0.5"
            >
              <LocalizedLink href="/contact">{ui.contact}</LocalizedLink>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-10 rounded-lg bg-background shadow-card"
            >
              <LocalizedLink href="/how-it-works">{ui.how}</LocalizedLink>
            </Button>
          </div>
        </Surface>
      </Section>
    </Layout>
  );
}
