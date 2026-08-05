// src/components/contact-messages/ContactMessagesFiltersBar.tsx
"use client";

import React from "react";
import {
  Search,
  RefreshCw,
  Mail,
  MessageSquare,
  Archive,
  Eye,
  MailOpen,
  Filter,
  SlidersHorizontal,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import InputField from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { cn } from "@/lib/utils";

import type {
  ContactMessageCountsData,
  ContactMessageFilters,
  ContactTabKey,
} from "./types";
import type {
  ContactMessageBoolFilter,
  ContactMessageStatusFilter,
} from "@/api/contact-messages.api";

type Props = {
  counts: ContactMessageCountsData | null;
  filters: ContactMessageFilters;
  onChange: (patch: Partial<ContactMessageFilters>) => void;
  onRefetch: () => void;
  isRefetching?: boolean;
};

/* ── Stat pill tab (compact horizontal) ── */
const STAT_COLORS: Record<string, string> = {
  all: "text-brand-600 dark:text-brand-400",
  unread: "text-sky-600 dark:text-sky-400",
  unreplied: "text-amber-600 dark:text-amber-400",
  read_but_not_replied: "text-orange-600 dark:text-orange-400",
  archived: "text-gray-500 dark:text-gray-400",
};

const STAT_ACTIVE_BG: Record<string, string> = {
  all: "bg-brand-50 border-brand-200 dark:bg-brand-500/10 dark:border-brand-500/30",
  unread: "bg-sky-50 border-sky-200 dark:bg-sky-500/10 dark:border-sky-500/30",
  unreplied:
    "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30",
  read_but_not_replied:
    "bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30",
  archived:
    "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600",
};

const STAT_ICONS: Record<string, React.ReactNode> = {
  all: <Mail size={13} />,
  unread: <MailOpen size={13} />,
  unreplied: <MessageSquare size={13} />,
  read_but_not_replied: <Eye size={13} />,
  archived: <Archive size={13} />,
};

export default function ContactMessagesFiltersBar({
  counts,
  filters,
  onChange,
  onRefetch,
  isRefetching,
}: Props) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = React.useState(false);

  const c = counts ?? {
    total: 0,
    unread: 0,
    unreplied: 0,
    read_but_not_replied: 0,
  };

  const statusOptions = React.useMemo(
    () => [
      { value: "active", label: t("contactMessages.filters.statusActive") },
      {
        value: "archived",
        label: t("contactMessages.filters.statusArchived"),
      },
      { value: "all", label: t("contactMessages.filters.statusAll") },
    ],
    [t]
  );

  const boolOptions = React.useMemo(
    () => [
      { value: "all", label: t("contactMessages.filters.any") },
      { value: "false", label: t("contactMessages.filters.no") },
      { value: "true", label: t("contactMessages.filters.yes") },
    ],
    [t]
  );

  const setTab = (tab: ContactTabKey) => {
    if (tab === "unread") {
      onChange({ tab, status: "active", is_read: "false", is_replied: "all" });
      return;
    }
    if (tab === "unreplied") {
      onChange({ tab, status: "active", is_read: "all", is_replied: "false" });
      return;
    }
    if (tab === "read_but_not_replied") {
      onChange({
        tab,
        status: "active",
        is_read: "true",
        is_replied: "false",
      });
      return;
    }
    if (tab === "archived") {
      onChange({
        tab,
        status: "archived",
        is_read: "all",
        is_replied: "all",
      });
      return;
    }
    onChange({ tab, status: "active", is_read: "all", is_replied: "all" });
  };

  const tabs: { key: ContactTabKey; label: string; count: number }[] = [
    { key: "all", label: t("contactMessages.stats.total"), count: c.total },
    {
      key: "unread",
      label: t("contactMessages.stats.unread"),
      count: c.unread,
    },
    {
      key: "unreplied",
      label: t("contactMessages.stats.unreplied"),
      count: c.unreplied,
    },
    {
      key: "read_but_not_replied",
      label: t("contactMessages.stats.readButNotReplied"),
      count: c.read_but_not_replied,
    },
    {
      key: "archived",
      label: t("contactMessages.stats.archived"),
      count: 0,
    },
  ];

  return (
    <div className="space-y-3">
      {/* ── Tab Pills + Actions Row ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Stat tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((tab) => {
            const active = filters.tab === tab.key;
            return (
              <Button
                key={tab.key}
                variant="outline"
                size="xs"
                onClick={() => setTab(tab.key)}
                className={cn(
                  "gap-1.5",
                  active
                    ? STAT_ACTIVE_BG[tab.key]
                    : "",
                  STAT_COLORS[tab.key]
                )}
                startIcon={STAT_ICONS[tab.key]}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    active
                      ? "bg-white/60 dark:bg-black/20"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  )}
                >
                  {tab.count}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Actions — now both use Button consistently */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={showFilters ? "primary" : "outline"}
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            startIcon={<SlidersHorizontal size={14} />}
          >
            <span className="hidden sm:inline">{t("contactMessages.filters.filtersButton")}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefetch}
            startIcon={
              <RefreshCw
                size={14}
                className={isRefetching ? "animate-spin" : ""}
              />
            }
            disabled={isRefetching}
          >
            <span className="hidden sm:inline">
              {isRefetching
                ? t("contactMessages.filters.refreshing")
                : t("contactMessages.filters.refresh")}
            </span>
          </Button>
        </div>
      </div>

      {/* ── Collapsible Filters ── */}
      {showFilters && (
        <div
          className={cn(
            "rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm",
            "dark:border-gray-800 dark:bg-gray-900"
          )}
        >
          <div className="flex items-center gap-2 pb-3">
            <Filter size={14} className="text-gray-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {t("contactMessages.filters.advancedFilters")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t("contactMessages.filters.searchLabel")}
              </p>
              <InputField
                value={filters.search}
                onChange={(e) => onChange({ search: e.target.value })}
                placeholder={t("contactMessages.filters.searchPlaceholder")}
                startIcon={<Search size={14} />}
              />
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t("contactMessages.filters.subjectLabel")}
              </p>
              <InputField
                value={filters.subject}
                onChange={(e) => onChange({ subject: e.target.value })}
                placeholder={t("contactMessages.filters.subjectPlaceholder")}
              />
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t("contactMessages.filters.statusLabel")}
              </p>
              <Select
                options={statusOptions}
                placeholder={t("contactMessages.filters.statusPlaceholder")}
                value={filters.status}
                onChange={(v) =>
                  onChange({
                    status: v as ContactMessageStatusFilter,
                    tab: "all",
                  })
                }
              />
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t("contactMessages.filters.readLabel")}
              </p>
              <Select
                options={boolOptions}
                placeholder={t("contactMessages.filters.readPlaceholder")}
                value={filters.is_read}
                onChange={(v) =>
                  onChange({
                    is_read: v as ContactMessageBoolFilter,
                    tab: "all",
                  })
                }
              />
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {t("contactMessages.filters.repliedLabel")}
              </p>
              <Select
                options={boolOptions}
                placeholder={t("contactMessages.filters.repliedPlaceholder")}
                value={filters.is_replied}
                onChange={(v) =>
                  onChange({
                    is_replied: v as ContactMessageBoolFilter,
                    tab: "all",
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
