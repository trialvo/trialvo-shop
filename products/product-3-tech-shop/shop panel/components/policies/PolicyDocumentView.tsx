import Link from "next/link";
import type { ReactElement } from "react";
import {
  ArrowRight,
  Check,
  CircleHelp,
  FileText,
  ListOrdered,
  X,
} from "lucide-react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { PolicySidebar } from "@/components/policies/PolicySidebar";
import type { PolicyDocument } from "@/lib/policies/policyContent";
import { cn } from "@/lib/utils";

type PolicyDocumentViewProps = Readonly<{
  policy: PolicyDocument;
}>;

function SectionTitle({
  icon,
  title,
  id,
}: Readonly<{
  icon: ReactElement;
  title: string;
  id: string;
}>): ReactElement {
  return (
    <h2
      id={id}
      className="mb-3 flex scroll-mt-28 items-center gap-2 font-heading text-sm font-semibold text-foreground"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary/10 text-primary">
        {icon}
      </span>
      {title}
    </h2>
  );
}

/**
 * User-friendly policy layout — steps, do/don't, FAQs, sticky help sidebar.
 */
export function PolicyDocumentView({
  policy,
}: PolicyDocumentViewProps): ReactElement {
  return (
    <div className="container py-4 md:py-6 pb-12 md:pb-14">
      <Breadcrumbs items={[{ label: policy.title }]} className="mb-3" />

      {/* Intro band */}
      <section className="relative mb-6 overflow-hidden rounded-sm border border-border bg-card p-5 shadow-product sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_0%_0%,hsl(var(--primary)/0.1),transparent_55%)]"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <FileText className="h-3.5 w-3.5" aria-hidden />
              Help & policies
            </p>
            <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
              {policy.title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              {policy.summary}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={policy.primaryCta.href}
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {policy.primaryCta.label}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            {policy.secondaryCta ? (
              <Link
                href={policy.secondaryCta.href}
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {policy.secondaryCta.label}
              </Link>
            ) : null}
          </div>
        </div>

        {policy.highlights.length > 0 ? (
          <ul className="relative mt-5 flex flex-wrap gap-2">
            {policy.highlights.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1.5 rounded-sm border border-success/25 bg-success/5 px-2.5 py-1 text-xs font-medium text-foreground"
              >
                <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8">
        <div className="space-y-5">
          <section
            id="policy-steps"
            aria-labelledby="policy-steps-title"
            className="scroll-mt-28 rounded-sm border border-border bg-card p-4 shadow-product sm:p-5"
          >
            <SectionTitle
              id="policy-steps-title"
              icon={<ListOrdered className="h-3.5 w-3.5" />}
              title="How it works"
            />
            <ol className="relative space-y-0">
              {policy.steps.map((step, index) => {
                const isLast = index === policy.steps.length - 1;
                return (
                  <li
                    key={step.title}
                    className="relative flex gap-3 pb-5 last:pb-0"
                  >
                    {!isLast ? (
                      <span
                        aria-hidden
                        className="absolute left-[13px] top-8 bottom-0 w-px bg-border"
                      />
                    ) : null}
                    <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-primary font-heading text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-sm font-semibold text-foreground">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section
            id="policy-rules"
            aria-labelledby="policy-rules-title"
            className="scroll-mt-28 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div className="rounded-sm border border-success/25 bg-success/5 p-4 shadow-product">
              <h2
                id="policy-rules-title"
                className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold text-foreground"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-success text-success-foreground">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
                Covered / allowed
              </h2>
              <ul className="space-y-2">
                {policy.allowed.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-snug text-foreground"
                  >
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-sm border border-destructive/25 bg-destructive/5 p-4 shadow-product">
              <h2 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-destructive text-destructive-foreground">
                  <X className="h-3.5 w-3.5" aria-hidden />
                </span>
                Not covered
              </h2>
              <ul className="space-y-2">
                {policy.notAllowed.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-snug text-foreground"
                  >
                    <X
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {policy.faqs.length > 0 ? (
            <section
              id="policy-faqs"
              aria-labelledby="policy-faqs-title"
              className="scroll-mt-28 rounded-sm border border-border bg-card p-4 shadow-product sm:p-5"
            >
              <SectionTitle
                id="policy-faqs-title"
                icon={<CircleHelp className="h-3.5 w-3.5" />}
                title="Common questions"
              />
              <div className="divide-y divide-border rounded-sm border border-border">
                {policy.faqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group px-3.5 py-3 open:bg-secondary/30"
                  >
                    <summary className="cursor-pointer list-none text-sm font-medium text-foreground marker:content-none [&::-webkit-details-marker]:hidden">
                      <span className="flex items-start justify-between gap-3">
                        {faq.question}
                        <span
                          className={cn(
                            "mt-0.5 text-muted-foreground transition-transform duration-200",
                            "group-open:rotate-45",
                          )}
                          aria-hidden
                        >
                          +
                        </span>
                      </span>
                    </summary>
                    <p className="mt-2 pr-6 text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <section
            id="policy-details"
            aria-labelledby="policy-details-title"
            className="scroll-mt-28 rounded-sm border border-border bg-card p-4 shadow-product sm:p-5"
          >
            <SectionTitle
              id="policy-details-title"
              icon={<FileText className="h-3.5 w-3.5" />}
              title="Full policy details"
            />
            <ol className="space-y-2.5">
              {policy.sections.map((para, index) => (
                <li
                  key={`${policy.type}-${index}`}
                  className="flex gap-3 rounded-sm bg-secondary/25 px-3 py-2.5"
                >
                  <span className="font-heading text-xs font-bold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {para}
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
              Last updated: {policy.updatedAt}. Need clarification?{" "}
              <Link
                href="/contact"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Contact us
              </Link>{" "}
              or email{" "}
              <a
                href="mailto:support@shoplinkbd.com"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                support@shoplinkbd.com
              </a>
              .
            </p>
          </section>
        </div>

        <PolicySidebar
          currentType={policy.type}
          hasFaqs={policy.faqs.length > 0}
        />
      </div>
    </div>
  );
}

export default PolicyDocumentView;
