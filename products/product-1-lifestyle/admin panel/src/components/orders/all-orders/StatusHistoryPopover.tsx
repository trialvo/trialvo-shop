// src/components/orders/all-orders/StatusHistoryPopover.tsx
import React, { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getOrderStatusHistory } from "@/api/orders.api";
import type { OrderStatusHistoryEntry } from "@/api/orders.api";

// ── Status colour map ─────────────────────────────────────────────────────────
function statusColor(s: string | null | undefined) {
  switch (s) {
    case "new":              return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
    case "approved":         return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300";
    case "processing":       return "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300";
    case "packaging":        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300";
    case "shipped":          return "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300";
    case "out_for_delivery": return "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300";
    case "delivered":        return "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300";
    case "returned":         return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
    case "cancelled":        return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300";
    case "on_hold":          return "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400";
    case "trash":            return "bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300";
    default:                 return "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
  }
}

function statusDot(s: string | null | undefined) {
  switch (s) {
    case "delivered":        return "bg-green-500";
    case "cancelled":        return "bg-red-500";
    case "shipped":
    case "out_for_delivery": return "bg-cyan-500";
    case "returned":         return "bg-amber-500";
    case "new":              return "bg-blue-500";
    default:                 return "bg-gray-400";
  }
}

function formatLabel(s: string | null | undefined) {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ── Subcomponent: one timeline entry ─────────────────────────────────────────
function HistoryEntry({ entry }: { entry: OrderStatusHistoryEntry }) {
  return (
    <li className="flex gap-3">
      {/* Dot + line */}
      <div className="flex flex-col items-center">
        <span className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-gray-900", statusDot(entry.status_change.to))} />
        <span className="mt-1 h-full w-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Content */}
      <div className="min-w-0 pb-3">
        {/* Status pill row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {entry.status_change.from && (
            <>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusColor(entry.status_change.from))}>
                {formatLabel(entry.status_change.from)}
              </span>
              <ChevronRight size={10} className="shrink-0 text-gray-400" />
            </>
          )}
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusColor(entry.status_change.to))}>
            {formatLabel(entry.status_change.to)}
          </span>
        </div>

        {/* Actor + time */}
        <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
          {entry.admin ? (
            <span className="truncate font-medium text-gray-700 dark:text-gray-300">
              {entry.admin.name}
            </span>
          ) : (
            <span className="italic text-gray-400">System</span>
          )}
          <span>·</span>
          <span title={new Date(entry.created_at).toLocaleString()}>
            {relativeTime(entry.created_at)}
          </span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span>{shortDate(entry.created_at)}</span>
        </div>

        {/* Note (only if present and not a system tag) */}
        {entry.note && !entry.note.startsWith("[") && (
          <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500 line-clamp-2">
            {entry.note}
          </p>
        )}
      </div>
    </li>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
type Props = {
  orderId: string | number;
};

const POPOVER_WIDTH = 288; // w-72 = 18rem = 288px

export default function StatusHistoryPopover({ orderId }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [align, setAlign] = useState<"left" | "right">("left");

  // Fetch lazily — only starts when popover first opens
  const { data, isLoading, isError } = useQuery({
    queryKey: ["order-status-history", String(orderId)],
    queryFn: () => getOrderStatusHistory(orderId),
    enabled: open,
    staleTime: 60_000,
  });

  const entries = data?.data ?? [];

  // Dynamically compute alignment when popover opens
  useEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Check if there's enough room to the right of the trigger
    const spaceRight = window.innerWidth - rect.left;
    // If there isn't enough room to fit the popover on the right, anchor right
    setAlign(spaceRight < POPOVER_WIDTH + 16 ? "right" : "left");
  }, [open]);

  // Click-outside to close
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="View status history"
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-150",
          "border border-gray-200 bg-white text-gray-600",
          "hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700",
          "active:scale-95",
          "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300",
          "dark:hover:border-purple-500/50 dark:hover:bg-purple-500/10 dark:hover:text-purple-300",
          open && "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/50 dark:bg-purple-500/10 dark:text-purple-300",
        )}
      >
        <History size={12} />
        <span>{entries.length > 0 ? `${entries.length} events` : "History"}</span>
      </button>

      {/* Popover panel */}
      {open && (
        <div
          ref={panelRef}
          className={cn(
            "absolute top-full z-20 mt-2 w-72",
            "rounded-xl border border-gray-200 bg-white shadow-xl",
            "dark:border-gray-800 dark:bg-gray-900",
            align === "right" ? "right-0" : "left-0",
            // Ensure it stays above the table
            "animate-in fade-in slide-in-from-top-1 duration-150",
          )}
          style={{ maxHeight: 360, overflowY: "auto" }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-gray-100 bg-white px-4 py-2.5 dark:border-gray-800 dark:bg-gray-900">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Status Timeline
              </p>
              <p className="text-xs font-semibold text-gray-800 dark:text-white">
                Order #{orderId}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            {isLoading && (
              <div className="flex flex-col gap-2.5 py-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-32 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                      <div className="h-2.5 w-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <p className="py-4 text-center text-xs text-red-500">
                Failed to load history.
              </p>
            )}

            {!isLoading && !isError && entries.length === 0 && (
              <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                No status changes recorded yet.
              </p>
            )}

            {!isLoading && !isError && entries.length > 0 && (
              <ul className="space-y-0">
                {entries.map(entry => (
                  <HistoryEntry key={entry.id} entry={entry} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
