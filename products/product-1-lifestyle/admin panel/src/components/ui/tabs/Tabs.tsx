import React from "react";
import { cn } from "@/lib/utils";

type Tab<T extends string> = {
 id: T;
 label: string;
 count?: number;
};

type Props<T extends string> = {
 tabs: Tab<T>[];
 active: T;
 onChange: (id: T) => void;
 className?: string;
};

/**
 * Tab bar that highlights the active tab and shows optional count badge.
 *
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { id: "main", label: "Main" },
 *     { id: "sub",  label: "Sub", count: 12 },
 *   ]}
 *   active={tab}
 *   onChange={setTab}
 * />
 * ```
 */
export default function Tabs<T extends string>({ tabs, active, onChange, className }: Props<T>) {
 return (
  <div className={cn("flex flex-wrap gap-1.5", className)}>
   {tabs.map((tab) => {
    const isActive = tab.id === active;
    return (
     <button
      key={tab.id}
      type="button"
      onClick={() => onChange(tab.id)}
      className={cn(
       "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
       isActive
        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.03]",
      )}
     >
      {tab.label}
      {isActive && tab.count != null && tab.count > 0 && (
       <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">
        {tab.count}
       </span>
      )}
     </button>
    );
   })}
  </div>
 );
}
