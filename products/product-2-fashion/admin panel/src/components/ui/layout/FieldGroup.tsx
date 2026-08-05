import React from "react";
import { cn } from "@/lib/utils";

type Props = {
 label: string;
 required?: boolean;
 hint?: string;
 error?: string;
 className?: string;
 children: React.ReactNode;
};

/**
 * Label + field wrapper — replaces repetitive `div > p.text-sm > Input` patterns.
 *
 * ```tsx
 * <FieldGroup label="Product Name" required>
 *   <Input value={name} onChange={...} />
 * </FieldGroup>
 * ```
 */
export default function FieldGroup({ label, required, hint, error, className, children }: Props) {
 return (
  <div className={cn("flex flex-col gap-1.5", className)}>
   <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
    {label}
    {required && <span className="ml-1 text-error-500">*</span>}
   </p>
   {children}
   {error && <p className="text-xs text-error-500">{error}</p>}
   {!error && hint && <p className="text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
  </div>
 );
}
