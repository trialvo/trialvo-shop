import { cn } from "@/lib/utils";

function Section({
  title,
  description,
  children,
  className,
  headerRight,
  icon,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_20px_-14px_rgba(16,24,40,0.14)] dark:bg-gray-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_10px_24px_-14px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      {/* Section Header */}
      <div className="flex flex-col gap-1 border-b border-gray-100 bg-gray-50/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 dark:border-gray-800 dark:bg-white/[0.02]">
        <div className="flex items-start gap-3">
          {icon ? (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>

      {/* Section Body */}
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}
export default Section;