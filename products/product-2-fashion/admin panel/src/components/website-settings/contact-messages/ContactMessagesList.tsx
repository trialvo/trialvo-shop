// src/components/contact-messages/ContactMessagesList.tsx
"use client";

import React from "react";
import { Mail, MessageSquare, Archive, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { ContactMessageRow } from "./types";
import { formatDateTime, formatName } from "./utils";

type Props = {
  rows: ContactMessageRow[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

function StatusPills({ row }: { row: ContactMessageRow }) {
  const { t } = useTranslation();
  const unread = row.is_read === 0;
  const unreplied = row.is_replied === 0;
  const archived = row.status === 0;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {archived ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-white/[0.06] dark:text-gray-400">
          <Archive size={10} /> {t("contactMessages.badges.archived")}
        </span>
      ) : null}

      {unread ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
          <Mail size={10} /> {t("contactMessages.badges.unread")}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {t("contactMessages.badges.read")}
        </span>
      )}

      {unreplied ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <MessageSquare size={10} /> {t("contactMessages.badges.unreplied")}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {t("contactMessages.badges.replied")}
        </span>
      )}
    </div>
  );
}

export default function ContactMessagesList({
  rows,
  selectedId,
  onSelect,
}: Props) {
  const { t } = useTranslation();

  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <Mail className="h-5 w-5 text-gray-400" />
        </span>
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
          {t("contactMessages.emptyFiltered")}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {rows.map((r) => {
        const isActive = selectedId === r.id;
        const unread = r.is_read === 0;

        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            className={cn(
              "group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-all duration-150",
              isActive
                ? "bg-brand-50/60 dark:bg-brand-500/[0.08]"
                : "hover:bg-gray-50 dark:hover:bg-white/[0.02]",
              unread && !isActive && "bg-sky-50/30 dark:bg-sky-500/[0.03]"
            )}
          >
            {/* Avatar */}
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                isActive
                  ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              )}
            >
              {r.first_name ? (
                r.first_name.charAt(0).toUpperCase()
              ) : (
                <User size={14} />
              )}
            </span>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "truncate text-sm",
                    unread
                      ? "font-bold text-gray-900 dark:text-white"
                      : "font-semibold text-gray-700 dark:text-gray-200"
                  )}
                >
                  {formatName(r.first_name, r.last_name)}
                </p>
                <span className="flex-shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                  {formatDateTime(r.created_at)}
                </span>
              </div>

              <p className="mt-0.5 truncate text-xs font-medium text-gray-800 dark:text-gray-300">
                {r.subject || t("contactMessages.noSubject")}
              </p>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">
                {r.message || t("contactMessages.emptyValue")}
              </p>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                  {r.email ? (
                    <span className="truncate">{r.email}</span>
                  ) : null}
                  {r.phone ? <span>• {r.phone}</span> : null}
                </div>
                <StatusPills row={r} />
              </div>
            </div>

            {/* Unread indicator dot */}
            {unread && (
              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-sky-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
