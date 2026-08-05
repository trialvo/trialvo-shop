// src/components/contact-messages/ContactMessageDetailsPanel.tsx
"use client";

import React from "react";
import {
  Archive,
  ArchiveRestore,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  ShoppingBag,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import ConfirmDeleteModal from "@/components/ui/modal/ConfirmDeleteModal";
import { cn } from "@/lib/utils";

import type { ContactMessageDetails } from "./types";
import { formatDateTime, formatName } from "./utils";

type Props = {
  data: ContactMessageDetails;
  onReply: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  isToggling?: boolean;
  isDeleting?: boolean;
};

export default function ContactMessageDetailsPanel({
  data,
  onReply,
  onToggleArchive,
  onDelete,
  isToggling,
  isDeleting,
}: Props) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const name = formatName(data.first_name, data.last_name);
  const email = data.email ?? "-";
  const phone = data.phone ?? "-";
  const subject = data.subject ?? "-";
  const msg = data.message ?? "-";
  const isArchived = data.status === 0;
  const isReplied = data.is_replied === 1;

  return (
    <div className={cn("flex h-full w-full flex-col")}>
      {/* ── Header ── */}
      <div
        className={cn(
          "flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
          "dark:border-gray-800 dark:from-white/[0.03] dark:to-white/[0.01]"
        )}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            {data.first_name ? (
              data.first_name.charAt(0).toUpperCase()
            ) : (
              <User size={18} />
            )}
          </span>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {name}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
              <Clock size={11} />
              <span>{formatDateTime(data.created_at)}</span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span>#{data.id}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReply}
            disabled={isArchived}
            startIcon={
              isReplied ? <Mail size={14} /> : <MessageCircle size={14} />
            }
          >
            {t("contactMessages.details.reply")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleArchive}
            disabled={isToggling}
            startIcon={
              isArchived ? (
                <ArchiveRestore size={14} />
              ) : (
                <Archive size={14} />
              )
            }
          >
            {isArchived
              ? t("contactMessages.details.unarchive")
              : t("contactMessages.details.archive")}
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            startIcon={<Trash2 size={14} />}
          >
            {t("contactMessages.details.delete")}
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Contact + Status Cards */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <User size={13} />
              {t("contactMessages.details.contact")}
            </p>

            <div className="mt-3 space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <Mail
                  size={14}
                  className="flex-shrink-0 text-gray-400 dark:text-gray-500"
                />
                <span className="text-gray-500 dark:text-gray-400">
                  {t("contactMessages.details.email")}
                </span>
                <span className="ml-auto font-medium text-gray-900 dark:text-white">
                  {email}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone
                  size={14}
                  className="flex-shrink-0 text-gray-400 dark:text-gray-500"
                />
                <span className="text-gray-500 dark:text-gray-400">
                  {t("contactMessages.details.phone")}
                </span>
                <span className="ml-auto font-medium text-gray-900 dark:text-white">
                  {phone}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShoppingBag
                  size={14}
                  className="flex-shrink-0 text-gray-400 dark:text-gray-500"
                />
                <span className="text-gray-500 dark:text-gray-400">
                  {t("contactMessages.details.orders")}
                </span>
                <span className="ml-auto font-medium text-gray-900 dark:text-white">
                  {data.total_orders ?? 0}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Wallet
                  size={14}
                  className="flex-shrink-0 text-gray-400 dark:text-gray-500"
                />
                <span className="text-gray-500 dark:text-gray-400">
                  {t("contactMessages.details.totalSpent")}
                </span>
                <span className="ml-auto font-medium text-gray-900 dark:text-white">
                  {data.total_spent ?? 0} BDT
                </span>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Archive size={13} />
              {t("contactMessages.details.status")}
            </p>

            <div className="mt-3 space-y-2.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {t("contactMessages.details.read")}
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    data.is_read === 1
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                  )}
                >
                  {data.is_read === 1
                    ? t("contactMessages.details.yes")
                    : t("contactMessages.details.no")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {t("contactMessages.details.replied")}
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    data.is_replied === 1
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                  )}
                >
                  {data.is_replied === 1
                    ? t("contactMessages.details.yes")
                    : t("contactMessages.details.no")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {t("contactMessages.details.inbox")}
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    isArchived
                      ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      : "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                  )}
                >
                  {isArchived
                    ? t("contactMessages.details.archived")
                    : t("contactMessages.details.active")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {t("contactMessages.details.lastUpdate")}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDateTime(data.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subject & Message */}
        <div className="mt-5 rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t("contactMessages.details.subject")}
          </p>
          <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
            {subject}
          </p>

          <div className="my-4 border-t border-gray-100 dark:border-gray-800" />

          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t("contactMessages.details.message")}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">
            {msg}
          </p>
        </div>

        {/* Replies */}
        <div className="mt-5 rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <MessageCircle size={13} />
            {t("contactMessages.details.replies")}
            {data.replies?.length ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                {data.replies.length}
              </span>
            ) : null}
          </p>

          {data.replies?.length ? (
            <div className="mt-3 space-y-3">
              {data.replies.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-white/[0.02]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                        r.type === "email"
                          ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                      )}
                    >
                      {(
                        r.type ??
                        t("contactMessages.details.replyType")
                      ).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      {formatDateTime(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                    {r.reply_text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {t("contactMessages.details.noReplies")}
            </p>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("contactMessages.details.confirmDeleteTitle")}
        description={t("contactMessages.details.confirmDeleteDescription")}
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete();
        }}
        loading={isDeleting}
      />
    </div>
  );
}
