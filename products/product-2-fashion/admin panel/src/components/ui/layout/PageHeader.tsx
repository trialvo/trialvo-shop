import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Reusable page-level header for all product verticals.
 *
 * ```tsx
 * <PageHeader
 *   title="Product Categories"
 *   subtitle="Manage main, sub and child categories"
 *   actions={<Button>Create</Button>}
 * />
 * ```
 */
export default function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  className,
}: Readonly<PageHeaderProps>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
