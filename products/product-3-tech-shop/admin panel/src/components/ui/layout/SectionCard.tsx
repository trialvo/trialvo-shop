import { cn } from "@/lib/utils";
import React from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
};

const cardBaseClass =
  "overflow-hidden rounded-2xl bg-white ring-0 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)] transition-shadow duration-300 ease-out dark:border-gray-800 dark:bg-gray-900 dark:ring-white/[0.04] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)]";

const headerBaseClass =
  "flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-3.5 dark:border-gray-800";

/**
 * Card section with optional icon + title header.
 *
 * ```tsx
 * <SectionCard title="Basic Info" icon={<Package size={16} />}>
 *   <div>...</div>
 * </SectionCard>
 * ```
 */
export default function SectionCard({
  title,
  description,
  icon,
  badge,
  headerActions,
  children,
  noPadding,
  className,
}: Readonly<SectionCardProps>) {
  const hasHeader = Boolean(title || description || icon || badge || headerActions);

  return (
    <section className={cn(cardBaseClass, className)}>
      {hasHeader ? (
        <header className={headerBaseClass}>
          <div className="flex min-w-0 items-start gap-2.5">
            {icon ? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {icon}
              </span>
            ) : null}

            <div className="min-w-0">
              {title ? (
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
              ) : null}
              {description ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
              ) : null}
            </div>
          </div>

          {badge || headerActions ? (
            <div className="flex shrink-0 items-center gap-2">
              {badge}
              {headerActions}
            </div>
          ) : null}
        </header>
      ) : null}

      <div className={cn(!noPadding && "p-5")}>{children}</div>
    </section>
  );
}
