"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { useActiveSection } from "@/hooks/useActiveSection";
import {
  POLICY_DOCUMENTS,
  POLICY_TYPES,
  type PolicyType,
} from "@/lib/policies/policyContent";
import { cn } from "@/lib/utils";

const BASE_SECTIONS = [
  { id: "policy-steps", label: "How it works" },
  { id: "policy-rules", label: "Covered / not covered" },
  { id: "policy-faqs", label: "Common questions" },
  { id: "policy-details", label: "Full details" },
] as const;

type PolicySidebarProps = Readonly<{
  currentType: PolicyType;
  /** When false, FAQ link is omitted from scroll-spy nav. */
  hasFaqs?: boolean;
}>;

/**
 * Sticky policy sidebar — highlights active in-page section + current policy.
 */
export function PolicySidebar({
  currentType,
  hasFaqs = true,
}: PolicySidebarProps): ReactElement {
  const pageSections = BASE_SECTIONS.filter(
    (s) => hasFaqs || s.id !== "policy-faqs",
  );
  const sectionIds = pageSections.map((s) => s.id);
  const activeSection = useActiveSection(sectionIds);

  const handleSectionClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Keep URL in sync without jumping
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <nav
        aria-label="On this page"
        className="rounded-sm border border-border bg-card p-4 shadow-product"
      >
        <p className="font-heading text-sm font-semibold text-foreground">
          On this page
        </p>
        <ul className="mt-2 space-y-0.5 text-sm">
          {pageSections.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <li key={link.id}>
                <button
                  type="button"
                  onClick={() => handleSectionClick(link.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors",
                    isActive
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-primary",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "h-4 w-0.5 shrink-0 rounded-full transition-colors",
                      isActive ? "bg-primary" : "bg-transparent",
                    )}
                  />
                  <span className="truncate">{link.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="All policies"
        className="rounded-sm border border-border bg-card p-4 shadow-product"
      >
        <p className="font-heading text-sm font-semibold text-foreground">
          All policies
        </p>
        <ul className="mt-2 space-y-0.5">
          {POLICY_TYPES.map((type) => {
            const item = POLICY_DOCUMENTS[type];
            const isActive = type === currentType;
            return (
              <li key={type}>
                <Link
                  href={`/policies/${type}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-primary",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        "h-4 w-0.5 shrink-0 rounded-full transition-colors",
                        isActive ? "bg-primary" : "bg-transparent",
                      )}
                    />
                    <span className="truncate">{item.title}</span>
                  </span>
                  {!isActive ? (
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                      Active
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="rounded-sm border border-primary/25 bg-primary/5 p-4">
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
          <Mail className="h-4 w-4" aria-hidden />
        </div>
        <p className="font-heading text-sm font-semibold text-foreground">
          Still stuck?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Send your Order ID and a short note — we&apos;ll help with returns,
          refunds, or warranty next steps.
        </p>
        <Link
          href="/contact"
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-sm bg-primary text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Contact support
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </aside>
  );
}

export default PolicySidebar;
