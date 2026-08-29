"use client";

import {
  ChevronRight,
  LifeBuoy,
  Mail,
  MessageCircleQuestion,
  Phone,
  ScrollText,
} from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import Layout from "@/components/layout/Layout";
import FaqAccordion from "@/components/faq/FaqAccordion";
import { Button } from "@/components/ui/button";
import { Eyebrow, IconTile, Section, SectionIntro, Surface } from "@/components/section";
import { useLanguage } from "@/contexts/LanguageContext";
import { BRAND } from "@/lib/brand";
import { faqGroups } from "@/lib/content/faq";
import { legalIndex } from "@/lib/legal";

const UI = {
  bn: {
    eyebrow: "সাহায্য কেন্দ্র",
    title: "সাধারণ প্রশ্নোত্তর",
    lead: "রেডিমেড ইকমার্স ওয়েবসাইট কেনা, লাইভ ট্রায়াল নেওয়া, আজীবন লাইসেন্স ও সাপোর্ট নিয়ে যা যা জিজ্ঞাসা আসে — সবকিছুর সরাসরি উত্তর এক জায়গায়। উত্তর না পেলে আমাদের জানান, আমরা যোগ করে দেব।",
    home: "হোম",
    jump: "বিভাগে যান",
    stillTitle: "উত্তর খুঁজে পাচ্ছেন না?",
    stillBody:
      "কেনার আগে যেকোনো প্রশ্ন করতে পারেন — টেকনিক্যাল, লাইসেন্স, প্রাইসিং বা কাস্টম ডেভেলপমেন্ট। আমরা স্পষ্ট উত্তর দেব, কোনো বাধ্যবাধকতা নেই।",
    contact: "যোগাযোগ করুন",
    browse: "প্রোডাক্ট দেখুন",
    policyTitle: "সম্পূর্ণ নীতিমালা",
    policyBody: "শর্তাবলী, লাইসেন্স, রিফান্ড ও সাপোর্ট নীতির বিস্তারিত ডকুমেন্ট।",
  },
  en: {
    eyebrow: "Help centre",
    title: "Frequently asked questions",
    lead: "Direct answers to what buyers actually ask about purchasing a ready-made ecommerce website, running a live trial, and how the lifetime license and support work. If your question is missing, tell us and we will add it.",
    home: "Home",
    jump: "Jump to a section",
    stillTitle: "Cannot find your answer?",
    stillBody:
      "Ask us anything before you buy — technical, licensing, pricing, or custom development. You will get a straight answer, with no obligation.",
    contact: "Contact us",
    browse: "Browse products",
    policyTitle: "Full policies",
    policyBody: "The detailed terms, license, refund, and support documents.",
  },
} as const;

/** Public FAQ page (`/faq`) — grouped answers plus links into the legal suite. */
export default function FaqPage() {
  const { language } = useLanguage();
  const ui = UI[language];
  const groups = faqGroups(language);
  const policies = legalIndex(language).slice(0, 4);

  return (
    <Layout>
      <Section tone="muted" pattern="mesh" size="sm" divider="bottom">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <li>
              <LocalizedLink href="/" className="hover:text-foreground">
                {ui.home}
              </LocalizedLink>
            </li>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <li aria-current="page" className="font-medium text-foreground">
              {ui.title}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <IconTile icon={MessageCircleQuestion} size="lg" />
          <div className="min-w-0">
            <Eyebrow className="mb-4">{ui.eyebrow}</Eyebrow>
            <h1 className="font-display text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-[2.25rem] md:text-[2.75rem]">
              {ui.title}
            </h1>
            <p className="mt-4 max-w-[68ch] text-[15px] leading-7 text-muted-foreground md:text-base md:leading-[1.75]">
              {ui.lead}
            </p>
          </div>
        </div>

        <nav aria-label={ui.jump} className="mt-8">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {groups.map((group) => (
              <li key={group.id}>
                <a
                  href={`#${group.id}`}
                  className="text-xs font-medium text-muted-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors hover:text-accent-strong hover:decoration-accent/50"
                >
                  {group.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      <Section containerClassName="max-w-4xl">
        <div className="space-y-14 md:space-y-20">
          {groups.map((group) => (
            <div key={group.id} id={group.id} className="scroll-mt-28">
              <SectionIntro
                className="mb-6 md:mb-7"
                title={group.title}
                lead={group.description}
              />
              <FaqAccordion entries={group.entries} />
            </div>
          ))}
        </div>
      </Section>

      <Section tone="muted" pattern="dots" divider="top">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <Surface sheen className="p-6 md:p-8">
            <IconTile icon={LifeBuoy} size="lg" className="mb-5" />
            <h2 className="font-display text-xl font-bold tracking-tight">
              {ui.stillTitle}
            </h2>
            <p className="mt-2.5 text-[15px] leading-7 text-muted-foreground">
              {ui.stillBody}
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
                <LocalizedLink href="/products">{ui.browse}</LocalizedLink>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-sm">
              <a
                href={`mailto:${BRAND.contactEmail}`}
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-accent-strong"
              >
                <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
                {BRAND.contactEmail}
              </a>
              <a
                href={BRAND.contactPhoneHref}
                className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-accent-strong"
              >
                <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
                {BRAND.contactPhone}
              </a>
            </div>
          </Surface>

          <Surface sheen className="p-6 md:p-8">
            <IconTile icon={ScrollText} size="lg" tone="neutral" className="mb-5" />
            <h2 className="font-display text-xl font-bold tracking-tight">
              {ui.policyTitle}
            </h2>
            <p className="mt-2.5 text-[15px] leading-7 text-muted-foreground">
              {ui.policyBody}
            </p>
            <ul className="mt-5 space-y-1">
              {policies.map((policy) => (
                <li key={policy.key}>
                  <LocalizedLink
                    href={policy.path}
                    className="group -mx-3 flex items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-border hover:bg-muted/50 hover:text-accent-strong"
                  >
                    {policy.title}
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-accent transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          </Surface>
        </div>
      </Section>
    </Layout>
  );
}
