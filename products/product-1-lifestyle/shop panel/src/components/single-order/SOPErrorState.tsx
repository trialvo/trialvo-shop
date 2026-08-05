"use client";

/**
 * components/single-order/SOPErrorState.tsx — Error state display
 */

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";

interface SOPErrorStateProps {
  message?: string;
}

export function SOPErrorState({ message }: SOPErrorStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <AlertCircle
          size={48}
          className="mx-auto text-destructive/50 mb-4"
        />
        <h2 className="font-display text-xl font-bold text-foreground mb-2">
          Page Not Available
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {message || "This product is not available for quick order."}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 text-xs tracking-[0.2em] uppercase hover:bg-accent hover:text-accent-foreground transition-colors rounded"
        >
          Go Home <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
