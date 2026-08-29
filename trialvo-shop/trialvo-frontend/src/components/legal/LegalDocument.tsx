import {
  AlertCircle,
  CalendarClock,
  Check,
  ChevronRight,
  Mail,
  MessageCircleQuestion,
  Phone,
  ScrollText,
} from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
import { Eyebrow, IconTile, Section, SectionIntro, Surface } from "@/components/section";
import { BRAND } from "@/lib/brand";
import type { Locale } from "@/lib/i18n";
import { legalIndex, type LegalDoc, type LegalDocKey } from "@/lib/legal";

const UI = {
  bn: {
    eyebrow: "লিগ্যাল ডকুমেন্ট",
    contents: "এই পেজে যা আছে",
    home: "হোম",
    legal: "লিগ্যাল",
    otherDocs: "অন্যান্য নীতি ও শর্ত",
    otherDocsHint:
      "একটি নীতি অন্যটির সাথে সম্পর্কিত। কেনার আগে সংশ্লিষ্ট ডকুমেন্টগুলোও দেখে নিন।",
    questionTitle: "কোনো অংশ পরিষ্কার নয়?",
    questionBody:
      "যেকোনো শর্ত নিয়ে প্রশ্ন থাকলে কেনার আগেই আমাদের জিজ্ঞাসা করুন। আমরা লিখিতভাবে স্পষ্ট করে দেব।",
    contactCta: "যোগাযোগ করুন",
    backToTop: "উপরে ফিরুন",
  },
  en: {
    eyebrow: "Legal document",
    contents: "On this page",
    home: "Home",
    legal: "Legal",
    otherDocs: "Other policies and terms",
    otherDocsHint:
      "These documents work together. Before buying, it is worth reading the related ones too.",
    questionTitle: "Something not clear?",
    questionBody:
      "If any term raises a question, ask us before you buy. We are happy to clarify it in writing.",
    contactCta: "Contact us",
    backToTop: "Back to top",
  },
} as const;

/** Comfortable reading measure for continuous legal prose. */
const MEASURE = "max-w-[70ch]";

function Blocks({ doc, index }: Readonly<{ doc: LegalDoc; index: number }>) {
  const section = doc.sections[index];
  return (
    <>
      {section.blocks.map((block, blockIndex) => {
        const key = `${section.id}-${blockIndex}`;

        if (block.type === "p") {
          return (
            <p
              key={key}
              className={`mt-4 ${MEASURE} text-[15px] leading-[1.75] text-muted-foreground`}
            >
              {block.text}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={key} className={`mt-5 ${MEASURE} space-y-3`}>
              {block.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-[15px] leading-7 text-muted-foreground"
                >
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/[0.12] text-accent ring-1 ring-inset ring-accent/20">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <Surface
            key={key}
            tone="accent"
            sheen
            className={`mt-5 ${MEASURE} flex gap-3.5 p-4 md:p-5`}
          >
            <IconTile icon={AlertCircle} size="sm" />
            <p className="text-[14px] leading-6 text-foreground/80">{block.text}</p>
          </Surface>
        );
      })}
    </>
  );
}

/**
 * Shared renderer for every legal/policy page.
 * Server-rendered headings + anchored sections + a table of contents so the
 * document is fully crawlable and deep-linkable.
 */
export function LegalDocument({
  doc,
  docKey,
  language,
}: Readonly<{ doc: LegalDoc; docKey: LegalDocKey; language: Locale }>) {
  const ui = UI[language];
  const related = legalIndex(language).filter((item) => item.key !== docKey);

  return (
    <>
      <Section tone="muted" pattern="mesh" size="sm" divider="bottom">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <li>
              <LocalizedLink href="/" className="hover:text-foreground">
                {ui.home}
              </LocalizedLink>
            </li>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <li className="text-foreground/70">{ui.legal}</li>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <li aria-current="page" className="font-medium text-foreground">
              {doc.title}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <IconTile icon={ScrollText} size="lg" />
          <div className="min-w-0">
            <Eyebrow className="mb-4">{ui.eyebrow}</Eyebrow>
            <h1 className="font-display text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-[2.25rem] md:text-[2.75rem]">
              {doc.title}
            </h1>
            <p className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              {doc.updated}
            </p>
            <p className={`mt-5 ${MEASURE} text-[15px] leading-7 text-muted-foreground`}>
              {doc.intro}
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
          <div className="min-w-0">
            <Surface
              as="nav"
              sheen
              aria-label={ui.contents}
              className="mb-10 p-5 lg:hidden"
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {ui.contents}
              </p>
              <ol className="space-y-0.5">
                {doc.sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block border-l-2 border-border py-1.5 pl-3.5 text-sm leading-6 text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </Surface>

            {doc.sections.map((section, index) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-28 border-b border-border/60 py-8 first:pt-0 last:border-b-0 last:pb-0"
              >
                <h2 className="font-display text-xl font-bold leading-snug tracking-tight md:text-[1.375rem]">
                  {section.heading}
                </h2>
                <Blocks doc={doc} index={index} />
              </article>
            ))}

            <Surface sheen className="mt-10 p-6 md:p-8">
              <IconTile icon={MessageCircleQuestion} size="lg" className="mb-5" />
              <h2 className="font-display text-lg font-bold tracking-tight">
                {ui.questionTitle}
              </h2>
              <p className="mt-2.5 text-[15px] leading-7 text-muted-foreground">
                {ui.questionBody}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-5 text-sm">
                <a
                  href={`mailto:${BRAND.contactEmail}`}
                  className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-accent-strong"
                >
                  <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
                  {BRAND.contactEmail}
                </a>
                <a
                  href={BRAND.contactPhoneHref}
                  className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-accent-strong"
                >
                  <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
                  {BRAND.contactPhone}
                </a>
                <LocalizedLink
                  href="/contact"
                  className="group inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
                >
                  {ui.contactCta}
                  <ChevronRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </LocalizedLink>
              </div>
            </Surface>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <Surface
                sheen
                className="max-h-[calc(100vh-10rem)] overflow-y-auto p-5"
              >
                <nav aria-label={ui.contents}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {ui.contents}
                  </p>
                  <ol className="space-y-0.5">
                    {doc.sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="block border-l-2 border-border py-1.5 pl-3.5 text-[13px] leading-6 text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
                        >
                          {section.heading}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </Surface>

              <a
                href="#top"
                className="mt-5 inline-block text-xs font-medium text-muted-foreground transition-colors hover:text-accent-strong"
              >
                {ui.backToTop}
              </a>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="muted" pattern="dots" divider="top">
        <SectionIntro
          className="mb-8 md:mb-10"
          title={ui.otherDocs}
          lead={ui.otherDocsHint}
        />

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <li key={item.key}>
              <Surface
                as={LocalizedLink}
                href={item.path}
                sheen
                interactive
                className="group flex h-full flex-col p-5"
              >
                <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
                  {item.title}
                </span>
                <span className="mt-2 line-clamp-3 text-[13px] leading-6 text-muted-foreground">
                  {item.intro}
                </span>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent-strong">
                  {language === "bn" ? "পড়ুন" : "Read"}
                  <ChevronRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Surface>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

export default LegalDocument;
