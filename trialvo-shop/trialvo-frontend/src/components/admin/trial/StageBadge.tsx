import { AlertTriangle, CheckCircle2, Clock, Hammer, Inbox, Server, ShoppingBag, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FulfillmentStage } from "@/lib/trial/types";
import { cn } from "@/lib/utils";

const ICON = "h-3.5 w-3.5";

const META: Record<FulfillmentStage, { label: string; className: string; icon: React.ReactNode }> = {
  received: { label: "Received", className: "border-border bg-muted text-foreground", icon: <Inbox className={ICON} /> },
  hosting_pending: { label: "Hosting pending", className: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300", icon: <Server className={ICON} /> },
  deploying: { label: "Deploying", className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300", icon: <Hammer className={ICON} /> },
  live: { label: "Live", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", icon: <CheckCircle2 className={ICON} /> },
  expiring: { label: "Expiring", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300", icon: <Clock className={ICON} /> },
  expired: { label: "Expired", className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300", icon: <AlertTriangle className={ICON} /> },
  converted: { label: "Converted", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", icon: <ShoppingBag className={ICON} /> },
  rejected: { label: "Rejected", className: "border-destructive/30 bg-destructive/10 text-destructive", icon: <XCircle className={ICON} /> },
};

/** Fulfilment stage pill for the own-domain queue. Icon + text, never colour alone. */
export function StageBadge({ stage, className }: Readonly<{ stage: FulfillmentStage | null | undefined; className?: string }>) {
  const meta = META[stage || "received"] || META.received;
  return (
    <Badge variant="outline" className={cn("inline-flex items-center gap-1", meta.className, className)}>
      {meta.icon}
      {meta.label}
    </Badge>
  );
}

export default StageBadge;
