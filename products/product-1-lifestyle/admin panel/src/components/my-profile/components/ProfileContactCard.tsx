import React from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ProfileContact } from "../types";

type Props = {
  contact: ProfileContact;
};

function Item({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value?: string;
}) {
  const v = (value || "").trim();
  if (!v) return null;

  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-1 break-words text-sm text-gray-900 dark:text-white">{v}</p>
      </div>
    </div>
  );
}

export default function ProfileContactCard({ contact }: Props) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <h4 className="text-base font-semibold text-gray-900 dark:text-white">
        {t("myProfile.contact.title")}
      </h4>

      <div className="mt-5 space-y-4">
        <Item
          icon={<Mail size={16} />}
          title={t("myProfile.contact.email")}
          value={contact.email}
        />
        <Item
          icon={<Phone size={16} />}
          title={t("myProfile.contact.phone")}
          value={contact.phonePrimary}
        />
        <Item
          icon={<MapPin size={16} />}
          title={t("myProfile.contact.address")}
          value={contact.address}
        />
      </div>
    </div>
  );
}
