"use client";

import type { ReactElement } from "react";
import { Package, Percent, Truck, Warehouse } from "lucide-react";
import type { BetterFlags } from "@/lib/compare/betterFlags";
import { fmtBdt } from "@/lib/compare/fmtBdt";
import type { CompareProductDetail } from "@/lib/api/product/service";
import { cn } from "@/lib/utils";

type CompareScoreboardProps = Readonly<{
  left: CompareProductDetail;
  right: CompareProductDetail;
  leftBetter: BetterFlags;
  rightBetter: BetterFlags;
}>;

function countWins(flags: BetterFlags): number {
  return Object.values(flags).filter(Boolean).length;
}

/**
 * At-a-glance winner strip — reduces cognitive load before deep tables.
 */
export function CompareScoreboard({
  left,
  right,
  leftBetter,
  rightBetter,
}: CompareScoreboardProps): ReactElement {
  const leftWins = countWins(leftBetter);
  const rightWins = countWins(rightBetter);
  const leftLeads = leftWins > rightWins;
  const rightLeads = rightWins > leftWins;

  const metrics = [
    {
      key: "price",
      label: "Price",
      icon: Percent,
      leftVal: fmtBdt(left.summary.min_price),
      rightVal: fmtBdt(right.summary.min_price),
      leftWin: leftBetter.price,
      rightWin: rightBetter.price,
    },
    {
      key: "stock",
      label: "In stock",
      icon: Warehouse,
      leftVal: String(left.summary.total_in_stock),
      rightVal: String(right.summary.total_in_stock),
      leftWin: leftBetter.stock,
      rightWin: rightBetter.stock,
    },
    {
      key: "variants",
      label: "Variants",
      icon: Package,
      leftVal: String(left.summary.total_variations),
      rightVal: String(right.summary.total_variations),
      leftWin: leftBetter.variants,
      rightWin: rightBetter.variants,
    },
    {
      key: "delivery",
      label: "Delivery",
      icon: Truck,
      leftVal: left.free_delivery ? "Free" : "Paid",
      rightVal: right.free_delivery ? "Free" : "Paid",
      leftWin: leftBetter.delivery,
      rightWin: rightBetter.delivery,
    },
  ] as const;

  return (
    <div className="animate-compare-pop overflow-hidden rounded-sm border border-border bg-card shadow-product">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-3">
        <div>
          <p className="font-heading text-sm font-bold text-foreground">
            Snapshot scoreboard
          </p>
          <p className="text-[11px] text-muted-foreground">
            Quick wins before you dig into full details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-sm px-2.5 py-1 font-heading text-xs font-bold",
              leftLeads
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            A · {leftWins}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground">VS</span>
          <span
            className={cn(
              "rounded-sm px-2.5 py-1 font-heading text-xs font-bold",
              rightLeads
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground",
            )}
          >
            B · {rightWins}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.key} className="bg-card p-3 sm:p-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Icon className="h-3 w-3 text-primary" aria-hidden />
                {m.label}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={cn(
                    "rounded-sm px-2 py-1.5",
                    m.leftWin ? "bg-success/10" : "bg-secondary/50",
                  )}
                >
                  <p className="text-[9px] font-bold text-muted-foreground">A</p>
                  <p
                    className={cn(
                      "truncate text-xs font-bold",
                      m.leftWin ? "text-success" : "text-foreground",
                    )}
                  >
                    {m.leftVal}
                  </p>
                </div>
                <div
                  className={cn(
                    "rounded-sm px-2 py-1.5",
                    m.rightWin ? "bg-success/10" : "bg-secondary/50",
                  )}
                >
                  <p className="text-[9px] font-bold text-muted-foreground">B</p>
                  <p
                    className={cn(
                      "truncate text-xs font-bold",
                      m.rightWin ? "text-success" : "text-foreground",
                    )}
                  >
                    {m.rightVal}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
