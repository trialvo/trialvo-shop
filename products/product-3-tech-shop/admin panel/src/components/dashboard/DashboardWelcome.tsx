import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/AuthProvider";

function getGreetingKey(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/**
 * Lightweight welcome banner for the dashboard home.
 * Display-only — no data fetching or business logic.
 */
export default function DashboardWelcome() {
  const { t, i18n } = useTranslation();
  const { admin } = useAuth();

  const displayName = useMemo(() => {
    const first = admin?.first_name?.trim();
    const last = admin?.last_name?.trim();
    const full = [first, last].filter(Boolean).join(" ");
    if (full) return full;
    if (admin?.email) return admin.email.split("@")[0] ?? "Admin";
    return "Admin";
  }, [admin]);

  const { greeting, dateLabel } = useMemo(() => {
    const now = new Date();
    return {
      greeting: t(`dashboard.welcome.${getGreetingKey(now.getHours())}`),
      dateLabel: new Intl.DateTimeFormat(i18n.language || undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(now),
    };
  }, [i18n.language, t]);

  return (
    <header
      className="welcome-banner rounded-2xl border border-gray-200/80 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6"
      aria-label={greeting}
    >
      <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
        {dateLabel}
      </p>
      <h1 className="mt-1 text-lg font-semibold tracking-tight text-gray-900 dark:text-white sm:text-xl">
        {greeting}, {displayName}
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t("dashboard.welcome.subtitle")}
      </p>
    </header>
  );
}
