"use client";

import type { ReactElement, ReactNode } from "react";
import { AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type CompareAlertProps = Readonly<{
  children: ReactNode;
  variant?: "error" | "info";
  className?: string;
}>;

export function CompareAlert({
  children,
  variant = "error",
  className,
}: CompareAlertProps): ReactElement {
  const isError = variant === "error";
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-sm border px-4 py-3",
        isError
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border bg-secondary/50 text-foreground",
        className,
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : (
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <p className="text-sm">{children}</p>
    </div>
  );
}
