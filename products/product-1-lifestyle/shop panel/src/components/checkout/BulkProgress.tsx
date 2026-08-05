import { cn } from "@/lib/utils";

interface BulkProgressProps {
  mode: "bulk" | "combo";
  current: number;
  required: number;
}

/**
 * Progress bar + fraction label for bulk/combo order requirements.
 * Turns green when requirement is met.
 */
export function BulkProgress({ mode, current, required }: BulkProgressProps) {
  const met = current >= required;
  const pct = Math.min(100, (current / required) * 100);

  return (
    <div className="bg-secondary/50 border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs tracking-wider uppercase text-muted-foreground font-medium">
          {mode === "bulk" ? "Total Quantity" : "Products Selected"}
        </span>
        <span className={cn("text-sm font-semibold", met ? "text-accent" : "text-destructive")}>
          {current} / {required} min
        </span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
