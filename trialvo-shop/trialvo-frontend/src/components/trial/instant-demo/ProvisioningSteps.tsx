"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Perceived-progress animation while the backend creates the demo admin.
 * Steps advance on a timer (the request is a single call) but the last one
 * only completes when `done` flips true, so the UI never lies about readiness.
 */
export function ProvisioningSteps({
  title,
  steps,
  done,
}: Readonly<{ title: string; steps: readonly [string, string, string]; done: boolean }>) {
  const [reached, setReached] = useState(0);

  useEffect(() => {
    const timers = [setTimeout(() => setReached(1), 900), setTimeout(() => setReached(2), 2200)];
    return () => timers.forEach(clearTimeout);
  }, []);

  const current = done ? steps.length : Math.min(reached, steps.length - 1);

  return (
    <div className="py-6" role="status" aria-live="polite">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
        <motion.span
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
        </motion.span>
      </div>
      <h3 className="mt-5 text-center font-display text-lg font-bold tracking-tight text-foreground">{title}</h3>

      <ol className="mx-auto mt-6 max-w-xs space-y-2.5">
        {steps.map((label, i) => {
          const isDone = i < current;
          const isActive = i === current && !done;
          return (
            <motion.li
              key={label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                isDone && "border-accent/30 bg-accent/[0.05] text-foreground",
                isActive && "border-border bg-card text-foreground",
                !isDone && !isActive && "border-border/60 text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  isDone ? "bg-accent text-accent-foreground" : isActive ? "border-2 border-accent" : "border border-border",
                )}
              >
                {isDone ? <Check className="h-3 w-3" strokeWidth={3} /> : isActive ? <Loader2 className="h-3 w-3 animate-spin text-accent" /> : null}
              </span>
              {label}
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

export default ProvisioningSteps;
