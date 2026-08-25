import * as React from "react";

import { cn } from "@/lib/utils";

/** Shared shop form field — matches auth form chrome */
const inputBaseClass = [
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
  "h-11 w-full min-w-0 rounded-[4px] border border-border bg-background px-3 text-[14px] text-foreground shadow-none",
  "transition-[color,border-color,box-shadow] outline-none",
  "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-normal",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground/20",
  "aria-invalid:border-destructive aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/25",
].join(" ");

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputBaseClass, className)}
      {...props}
    />
  );
}

export { Input, inputBaseClass };
