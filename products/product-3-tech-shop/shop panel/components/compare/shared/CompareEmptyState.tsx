"use client";

import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CompareEmptyStateProps = Readonly<{
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  actionHref?: string;
  actionLabel?: string;
}>;

export function CompareEmptyState({
  icon,
  title,
  description,
  className,
  actionHref = "/",
  actionLabel = "Browse products",
}: CompareEmptyStateProps): ReactElement {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-sm border border-dashed border-primary/30 compare-stage px-5 py-12 text-center shadow-product sm:px-8 sm:py-14",
        className,
      )}
    >
      <div
        aria-hidden
        className="compare-grid-mask pointer-events-none absolute inset-0"
      />

      <div className="relative mx-auto flex max-w-md flex-col items-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-sm border border-primary/25 bg-primary text-primary-foreground shadow-product animate-vs-pulse">
          {icon}
        </div>
        <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="mt-6 grid w-full max-w-sm grid-cols-3 gap-2 text-left">
          {[
            { n: "01", t: "Search A" },
            { n: "02", t: "Search B" },
            { n: "03", t: "Decide" },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-sm border border-border/70 bg-card/80 px-2.5 py-2 backdrop-blur-sm"
            >
              <p className="font-heading text-[10px] font-bold text-primary">{s.n}</p>
              <p className="text-[11px] font-semibold text-foreground">{s.t}</p>
            </div>
          ))}
        </div>

        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-product transition hover:bg-primary/90"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
