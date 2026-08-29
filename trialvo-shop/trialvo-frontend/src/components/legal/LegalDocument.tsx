import { AlertCircle, Check, ChevronRight, Mail, Phone } from "lucide-react";
import LocalizedLink from "@/components/i18n/LocalizedLink";
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

function Blocks({ doc, index }: Readonly<{ doc: LegalDoc; index: number }>) {
  const section = doc.sections[index];
  return (
    <>
      {section.blocks.map((block, blockIndex) => {
        const key = `${section.id}-${blockIndex}`;

        if (block.type === "p") {
          return (
            <p key={key} className="mt-3 text-[15px] leading-7 text-muted-foreground">
              {block.text}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={key} className="mt-4 space-y-2.5">
              {block.items.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-7 text-muted-foreground">
                  <Check
                    className="mt-1.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <div
            key={key}
            className="mt-4 flex gap-3 rounded-xl border border-accent/25 bg-accent/[0.06] p-4"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            <p className="text-[14px] leading-6 text-foreground/80">{block.text}</p>
          </div>
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
      <section className="border-b border-border bg-muted/30">
        <div className="container-custom py-10 md:py-14">
          <nav aria-label="Breadcrumb" className="mb-5">
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

          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {ui.eyebrow}
          </p>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {doc.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{doc.updated}</p>
          <p className="mt-5 max-w-3xl text-[15px] leading-7 text-muted-foreground">
            {doc.intro}
          </p>
        </div>
      </section>

      <section className="bg-background py-10 md:py-14">
        <div className="container-custom">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-12">
            <div className="min-w-0">
              <nav
                aria-label={ui.contents}
                className="mb-10 rounded-xl border border-border bg-card p-5 lg:hidden"
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {ui.contents}
                </p>
                <ol className="space-y-2">
                  {doc.sections.map((section) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {section.heading}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              {doc.sections.map((section, index) => (
                <article
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 border-b border-border/60 pb-8 pt-2 last:border-b-0"
                >
                  <h2 className="font-display text-xl font-bold tracking-tight md:text-[1.375rem]">
                    {section.heading}
                  </h2>
                  <Blocks doc={doc} index={index} />
                </article>
              ))}

              <div className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-7">
                <h2 className="font-display text-lg font-bold tracking-tight">
                  {ui.questionTitle}
                </h2>
                <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                  {ui.questionBody}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                  <a
                    href={`mailto:${BRAND.contactEmail}`}
                    className="inline-flex items-center gap-2 font-medium text-foreground hover:text-accent"
                  >
                    <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
                    {BRAND.contactEmail}
                  </a>
                  <a
                    href={BRAND.contactPhoneHref}
                    className="inline-flex items-center gap-2 font-medium text-foreground hover:text-accent"
                  >
                    <Phone className="h-4 w-4 text-accent" aria-hidden="true" />
                    {BRAND.contactPhone}
                  </a>
                  <LocalizedLink
                    href="/contact"
                    className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
                  >
                    {ui.contactCta}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </LocalizedLink>
                </div>
              </div>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <nav aria-label={ui.contents}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {ui.contents}
                  </p>
                  <ol className="space-y-2 border-l border-border pl-4">
                    {doc.sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="block text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {section.heading}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>

                <a
                  href="#top"
                  className="mt-6 inline-block text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {ui.backToTop}
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-12 md:py-16">
        <div className="container-custom">
          <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
            {ui.otherDocs}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {ui.otherDocsHint}
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.key}>
                <LocalizedLink
                  href={item.path}
                  className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-accent/40"
                >
                  <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
                    {item.title}
                  </span>
                  <span className="mt-1.5 line-clamp-3 text-[13px] leading-6 text-muted-foreground">
                    {item.intro}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent">
                    {language === "bn" ? "পড়ুন" : "Read"}
                    <ChevronRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </LocalizedLink>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

export default LegalDocument;
