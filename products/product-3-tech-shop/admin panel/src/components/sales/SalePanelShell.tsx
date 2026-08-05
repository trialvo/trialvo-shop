import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SalePanelShellProps = {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  headerRight?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Soft, standard panel chrome for New Sale — readable and familiar.
 */
export default function SalePanelShell({
  icon,
  title,
  subtitle,
  badge,
  headerRight,
  footer,
  className,
  children,
}: Readonly<SalePanelShellProps>) {
  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white",
        "shadow-theme-sm dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5 sm:px-5 dark:border-gray-800">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            {icon}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              {badge}
            </div>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

      {footer ? (
        <footer className="shrink-0 border-t border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
