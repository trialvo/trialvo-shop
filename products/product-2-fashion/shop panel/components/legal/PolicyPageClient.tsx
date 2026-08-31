"use client";

import Breadcrumbs from "@/components/breadcrumb/Breadcrumbs";
import { useTranslation } from "@/hooks/useTranslation";
import type { PolicyData, PolicySummary } from "@/lib/api/policy";
import { cn, getLocalName } from "@/lib/utils";
import Link from "next/link";
import React from "react";

type Props = {
  policy: PolicyData;
  policies: PolicySummary[];
};

const PolicyPageClient: React.FC<Props> = ({ policy, policies }) => {
  const { language } = useTranslation();

  const displayTitle = getLocalName(policy.title, policy.bd_title, language);
  const hasContent = Boolean(policy.content?.trim());
  const updatedLabel = language === "bn" ? "সর্বশেষ আপডেট" : "Last updated";
  const emptyLabel = language === "bn" ? "শীঘ্রই আসছে।" : "Content coming soon.";
  const browseLabel = language === "bn" ? "অন্যান্য নীতিমালা" : "Other policies";
  const helpTitle =
    language === "bn" ? "প্রশ্ন আছে?" : "Have a question?";
  const helpBody =
    language === "bn"
      ? "নীতিমালা নিয়ে সাহায্য লাগলে আমাদের সাথে যোগাযোগ করুন।"
      : "Need clarification on a policy? Our team is happy to help.";
  const helpCta = language === "bn" ? "যোগাযোগ করুন" : "Contact us";

  const updatedAt = policy.updated_at
    ? new Date(policy.updated_at).toLocaleDateString(
        language === "bn" ? "bn-BD" : "en-US",
        { year: "numeric", month: "long", day: "numeric" },
      )
    : null;

  return (
    <section className="container mx-auto px-3 pb-16 pt-2 min-[768px]:px-0 min-[768px]:pb-20 min-[768px]:pt-0">
      <Breadcrumbs
        items={[
          { label: language === "bn" ? "হোম" : "Home", href: "/" },
          { label: displayTitle },
        ]}
      />

      <div className="mt-1 min-[768px]:mt-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
          {language === "bn" ? "আইনি নীতিমালা" : "Legal"}
        </p>
        <h1 className="mt-1.5 text-[26px] font-bold leading-none tracking-[-0.02em] text-[#191919] min-[768px]:text-[32px]">
          {displayTitle}
        </h1>
        {updatedAt ? (
          <p className="mt-2 text-sm text-[#8A8A8A]">
            {updatedLabel}: <span className="text-[#5F5F5F]">{updatedAt}</span>
          </p>
        ) : (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#5F5F5F]">
            {language === "bn"
              ? "Vellora-এর নীতিমালা ও শর্তাবলী পড়ুন।"
              : "Read how Vellora handles privacy, orders, and your rights."}
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 min-[768px]:mt-8 min-[768px]:grid-cols-[240px_minmax(0,1fr)] min-[768px]:gap-10 min-[992px]:grid-cols-[260px_minmax(0,1fr)]">
        {policies.length > 0 ? (
          <aside className="w-full min-w-0">
            <div className="min-[768px]:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {policies.map((p) => {
                  const active = p.policy_key === policy.policy_key;
                  const label = getLocalName(p.title, p.bd_title, language);
                  return (
                    <Link
                      key={p.policy_key}
                      href={`/policy/${p.policy_key}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors",
                        active
                          ? "bg-[#191919] text-white"
                          : "bg-[#F3F1ED] text-[#5F5F5F] hover:bg-[#EAE6DF] hover:text-[#191919]",
                      )}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <nav aria-label={browseLabel} className="hidden min-[768px]:block">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
                {browseLabel}
              </p>
              <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
                {policies.map((p, index) => {
                  const active = p.policy_key === policy.policy_key;
                  const label = getLocalName(p.title, p.bd_title, language);
                  return (
                    <Link
                      key={p.policy_key}
                      href={`/policy/${p.policy_key}`}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center px-4 py-3.5 text-left text-sm font-medium transition-colors",
                        index > 0 && "border-t border-black/6",
                        active
                          ? "bg-[#191919] text-white"
                          : "bg-white text-[#191919] hover:bg-[#FAF8F5]",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </aside>
        ) : null}

        <div className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
            <div className="border-b border-black/6 px-4 py-3.5 min-[768px]:px-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8A8A8A]">
                {language === "bn" ? "বিস্তারিত" : "Details"}
              </p>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-[#191919] min-[768px]:text-base">
                {displayTitle}
              </h2>
            </div>

            <div className="px-4 py-5 min-[768px]:px-6 min-[768px]:py-7">
              {!hasContent ? (
                <div className="rounded-xl bg-[#F7F4EE] px-4 py-8 text-center min-[768px]:px-6">
                  <p className="text-sm font-medium text-[#5F5F5F]">{emptyLabel}</p>
                  <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#8A8A8A]">
                    {language === "bn"
                      ? "এই নীতিমালার পূর্ণ বিবরণ শীঘ্রই প্রকাশ করা হবে।"
                      : "The full text for this policy will be published here shortly."}
                  </p>
                </div>
              ) : policy.content_type === "html" ? (
                <div
                  className="policy-content"
                  dangerouslySetInnerHTML={{ __html: policy.content ?? "" }}
                />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-[#3A3A3A]">
                  {policy.content}
                </pre>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-[#F7F4EE] px-4 py-5 min-[768px]:flex min-[768px]:items-center min-[768px]:justify-between min-[768px]:gap-6 min-[768px]:px-6 min-[768px]:py-6">
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight text-[#191919]">
                {helpTitle}
              </p>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-[#5F5F5F]">
                {helpBody}
              </p>
            </div>
            <Link
              href="/contact-us"
              className="mt-4 inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#191919] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-black min-[768px]:mt-0"
            >
              {helpCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PolicyPageClient;
