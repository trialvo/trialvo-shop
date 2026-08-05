import React from "react";
import { Bell, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { NotificationCount } from "../types";

type Props = {
  counts: NotificationCount;
};

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-4 text-left shadow-theme-xs hover:bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
          {icon}
        </span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {label}
        </span>
      </div>

      <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700 dark:bg-gray-900 dark:text-gray-200">
        {value}
      </span>
    </button>
  );
}

export default function ProfileQuickLinksCard({ counts }: Props) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="space-y-3">
        <Row
          icon={<Bell size={18} className="text-error-500" />}
          label={t("myProfile.quickLinks.notifications", {
            count: counts.notifications,
          })}
          value={counts.notifications}
        />
        <Row
          icon={<Mail size={18} className="text-success-500" />}
          label={t("myProfile.quickLinks.messages", { count: counts.messages })}
          value={counts.messages}
        />
      </div>
    </div>
  );
}
