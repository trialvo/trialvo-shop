"use client";

import {
  CalendarDays,
  Clock,
  Copy,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  Trash2
} from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import type { GuestOrder } from "./types";

import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

const initials = (name: string) => {
  const parts = name.trim().split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "G";
  const b = parts[1]?.[0] ?? "O";
  return (a + b).toUpperCase();
};

const formatDate = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

/* ── Status config with distinct colors ── */
function statusConfig(status: GuestOrder["status"]) {
  if (status === "pending")
    return {
      label: "Pending",
      dotClass: "bg-amber-400",
      bgClass: "bg-amber-50 dark:bg-amber-500/10",
      textClass: "text-amber-600 dark:text-amber-400",
      borderClass: "border-amber-200 dark:border-amber-500/20",
      accentClass: "border-l-amber-400",
    };
  if (status === "complete")
    return {
      label: "Complete",
      dotClass: "bg-emerald-500",
      bgClass: "bg-emerald-50 dark:bg-emerald-500/10",
      textClass: "text-emerald-600 dark:text-emerald-400",
      borderClass: "border-emerald-200 dark:border-emerald-500/20",
      accentClass: "border-l-emerald-500",
    };
  return {
    label: "Cancelled",
    dotClass: "bg-rose-500",
    bgClass: "bg-rose-50 dark:bg-rose-500/10",
    textClass: "text-rose-600 dark:text-rose-400",
    borderClass: "border-rose-200 dark:border-rose-500/20",
    accentClass: "border-l-rose-500",
  };
}

/* ── Avatar background color based on name hash ── */
function avatarColor(name: string) {
  const colors = [
    "bg-brand-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-cyan-500",
    "bg-teal-500",
    "bg-fuchsia-500",
    "bg-sky-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

type Props = {
  orders: GuestOrder[];
  onDelete?: (id: string) => void;
  deletingId?: string | null;
};

const GuestOrdersTable: React.FC<Props> = ({ orders, onDelete, deletingId }) => {
  const { t } = useTranslation();
  const onCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden shadow-sm">
      {/* ═══════════════════ Mobile / Small screens: Card list ═══════════════════ */}
      <div className="block md:hidden">
        {orders.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <ShoppingCart className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              {t("guestOrders.noGuestOrders")}
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {orders.map((o) => {
              const s = statusConfig(o.status);

              return (
                <div
                  key={o.id}
                  className={`rounded-xl border ${s.borderClass} bg-white dark:bg-gray-900 overflow-hidden shadow-sm border-l-4 ${s.accentClass}`}
                >
                  <div className="p-4">
                    {/* Top row: avatar + name + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-full ${avatarColor(o.customerName)} text-white text-sm font-bold shrink-0 shadow-sm`}
                        >
                          {initials(o.customerName)}
                        </div>

                        <div className="min-w-0">
                          <div className="text-base font-semibold text-gray-900 dark:text-white">
                            {o.customerName}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            {o.id.substring(0, 12)}…
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.bgClass} ${s.textClass} shrink-0`}
                      >
                        <span className={`h-2 w-2 rounded-full ${s.dotClass}`} />
                        {s.label}
                      </span>
                    </div>

                    {/* Contact info */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="truncate text-sm text-gray-700 dark:text-gray-200">
                            {o.email}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onCopy(o.email)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition shrink-0"
                          aria-label="Copy email"
                        >
                          <Copy size={14} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{o.phone}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onCopy(o.phone)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition shrink-0"
                          aria-label="Copy phone"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Date / Time / Total grid */}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 uppercase font-medium tracking-wider">
                          <CalendarDays className="h-3 w-3" />
                          Date
                        </div>
                        <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDate(o.createdAt)}
                        </div>
                      </div>

                      <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 uppercase font-medium tracking-wider">
                          <Clock className="h-3 w-3" />
                          Time
                        </div>
                        <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                          {o.timeLabel}
                        </div>
                      </div>

                      <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 uppercase font-medium tracking-wider">
                          Total
                        </div>
                        <div className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                          {o.cartTotal}
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5 dark:bg-gray-800/50">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                        {o.locationLabel}
                      </span>
                    </div>

                    {/* Delete */}
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="outline"
                        size="icon"
                        ariaLabel="Delete order"
                        onClick={() => onDelete?.(o.id)}
                        className="h-9 w-9 text-error-500 hover:text-error-600 hover:border-error-300 dark:hover:border-error-500/40"
                        disabled={Boolean(deletingId && deletingId === o.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════ Desktop / md+ screens: Table ═══════════════════ */}
      <div className="hidden md:block w-full max-w-full min-w-0">
        <div className="w-full max-w-full overflow-x-auto">
          <Table className="w-full table-fixed border-collapse">
            <TableHeader>
              <TableRow className="bg-gray-50/80 dark:bg-gray-950/50 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/80 dark:hover:bg-gray-950/50">
                <TableCell
                  isHeader
                  className="w-[52px] px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  #
                </TableCell>

                <TableCell
                  isHeader
                  className="w-[230px] px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {t("guestOrders.table.name")}
                </TableCell>

                <TableCell
                  isHeader
                  className="w-[110px] px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {t("guestOrders.table.status")}
                </TableCell>

                {/* Email: hide on md, show on lg+ */}
                <TableCell
                  isHeader
                  className="hidden lg:table-cell w-[250px] px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {t("guestOrders.table.email")}
                </TableCell>

                <TableCell
                  isHeader
                  className="w-[170px] px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {t("guestOrders.table.phone")}
                </TableCell>

                <TableCell
                  isHeader
                  className="w-[110px] px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {t("guestOrders.table.date")}
                </TableCell>

                {/* Time: hide on md, show on lg+ */}
                <TableCell
                  isHeader
                  className="hidden lg:table-cell w-[100px] px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {t("guestOrders.table.time")}
                </TableCell>

                <TableCell
                  isHeader
                  className="w-[130px] px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {t("guestOrders.table.total")}
                </TableCell>

                {/* Location: hide on md/lg, show on xl+ */}
                <TableCell
                  isHeader
                  className="hidden xl:table-cell w-[240px] px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {t("guestOrders.table.location")}
                </TableCell>

                <TableCell
                  isHeader
                  className="sticky right-0 z-20 w-[70px] bg-gray-50/80 px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:bg-gray-950/50 dark:text-gray-400"
                >
                  {t("guestOrders.table.action")}
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {orders.map((o, idx) => {
                const s = statusConfig(o.status);

                return (
                  <TableRow
                    key={o.id}
                    className={`border-b border-gray-100 dark:border-gray-800/60 transition-colors hover:bg-brand-50/30 dark:hover:bg-brand-500/[0.04] ${idx % 2 === 1 ? "bg-gray-50/40 dark:bg-white/[0.015]" : ""
                      }`}
                  >
                    {/* SN */}
                    <TableCell className="px-4 py-3.5 text-center">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                        {idx + 1}
                      </span>
                    </TableCell>

                    {/* Customer Name — 1st data column */}
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${avatarColor(o.customerName)} text-white text-xs font-bold shrink-0 shadow-sm`}
                        >
                          {initials(o.customerName)}
                        </div>
                        <div className="min-w-0 leading-tight">
                          <div className="font-semibold text-sm text-gray-900 dark:text-white">
                            {o.customerName}
                          </div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate font-mono">
                            {o.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* ★ Status — 2nd data column */}
                    <TableCell className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.bgClass} ${s.textClass}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dotClass}`} />
                        {s.label}
                      </span>
                    </TableCell>

                    {/* Email (lg+) */}
                    <TableCell className="hidden lg:table-cell px-4 py-3.5">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {o.email}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onCopy(o.email)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-100 hover:text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition shrink-0"
                          aria-label="Copy email"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="px-4 py-3.5">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                            {o.phone}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onCopy(o.phone)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-brand-200 bg-brand-50 text-brand-500 hover:bg-brand-100 hover:text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 transition shrink-0"
                          aria-label="Copy phone"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {formatDate(o.createdAt)}
                      </span>
                    </TableCell>

                    {/* Time (lg+) */}
                    <TableCell className="hidden lg:table-cell px-4 py-3.5 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {o.timeLabel}
                      </span>
                    </TableCell>

                    {/* Cart Total */}
                    <TableCell className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {o.cartTotal}
                      </span>
                    </TableCell>

                    {/* Location (xl+) */}
                    <TableCell className="hidden xl:table-cell px-4 py-3.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {o.locationLabel}
                        </span>
                      </div>
                    </TableCell>

                    {/* Action (sticky) */}
                    <TableCell className="sticky right-0 z-10 bg-white px-4 py-3.5 text-center dark:bg-gray-900">
                      <button
                        type="button"
                        onClick={() => onDelete?.(o.id)}
                        disabled={Boolean(deletingId && deletingId === o.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-error-200 bg-error-50 text-error-500 hover:bg-error-100 hover:text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 transition disabled:opacity-40"
                        aria-label="Delete order"
                      >
                        <Trash2 size={15} />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}

              {orders.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={10}
                    className="px-4 py-16 text-center"
                    isHeader={false}
                  >
                    <ShoppingCart className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
                    <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                      No guest orders found.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default GuestOrdersTable;
export { GuestOrdersTable };
