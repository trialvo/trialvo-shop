import { Truck, RotateCcw, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const BADGES = [
  { icon: Truck,     label: "Free Shipping", sub: "Orders over $150",  color: "text-accent" },
  { icon: RotateCcw, label: "Free Returns",  sub: "30-day easy returns", color: "text-accent" },
  { icon: Shield,    label: "Secure Pay",    sub: "SSL encrypted",       color: "text-accent" },
  { icon: Clock,     label: "Fast Delivery", sub: "2–4 business days",   color: "text-accent" },
] as const;

export function TrustBadges({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-border", className)}>
      {BADGES.map(({ icon: Icon, label, sub, color }) => (
        <div key={label} className="flex items-center gap-2.5">
          <Icon size={14} className={cn("shrink-0", color)} />
          <div>
            <p className="text-[11px] font-semibold text-foreground leading-tight">{label}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
