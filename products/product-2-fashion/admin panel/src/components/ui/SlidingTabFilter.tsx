import * as React from "react";
import { cn } from "@/lib/utils";

export type SlidingTabOption<T extends string = string> = {
  label: string;
  value: T;
};

type Props<T extends string = string> = {
  options: SlidingTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/**
 * Generic sliding-pill tab filter.
 *
 * ```tsx
 * <SlidingTabFilter
 *   options={[{ label: "Day", value: "day" }, ...]}
 *   value={range}
 *   onChange={setRange}
 * />
 * ```
 */
function SlidingTabFilter<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: Props<T>) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [pillStyle, setPillStyle] = React.useState({ left: 0, width: 0 });

  React.useLayoutEffect(() => {
    const activeIndex = options.findIndex((o) => o.value === value);
    const btn = buttonRefs.current[activeIndex];
    const container = containerRef.current;
    if (!btn || !container) return;

    const btnRect = btn.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setPillStyle({
      left: btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800",
        className
      )}
    >
      {/* Sliding pill */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1 bottom-1 rounded-lg",
          "bg-white shadow-sm ring-1 ring-gray-200",
          "dark:bg-gray-700 dark:ring-white/10",
          "transition-[left,width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
        )}
        style={{ left: pillStyle.left, width: pillStyle.width }}
      />

      {options.map((opt, i) => (
        <button
          key={opt.value}
          ref={(el) => {
            buttonRefs.current[i] = el;
          }}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "relative z-10 rounded-lg px-3 py-1.5 text-xs font-semibold",
            "transition-colors duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
            value === opt.value
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default SlidingTabFilter;
