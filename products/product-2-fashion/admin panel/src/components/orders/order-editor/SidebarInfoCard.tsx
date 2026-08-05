import type React from "react";
import { User, Phone, Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SidebarInfoCardProps {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const SidebarInfoCard: React.FC<SidebarInfoCardProps> = ({
  name,
  phone,
  email,
  address,
}) => {
  const { t } = useTranslation();

  const rows = [
    { icon: User, label: t("orders.orderEditor.name"), value: name, truncate: true },
    { icon: Phone, label: t("orders.orderEditor.phone"), value: phone, truncate: true },
    { icon: Mail, label: t("orders.orderEditor.email"), value: email, truncate: false },
    { icon: MapPin, label: t("orders.orderEditor.address"), value: address, truncate: false },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <User size={16} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
            {t("orders.orderEditor.customer")}
          </div>
          <div className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {t("orders.orderEditor.contactSummary")}
          </div>
        </div>
      </div>

      {/* Name & Phone — side by side */}
      <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {[
          { icon: User, label: t("orders.orderEditor.name"), value: name },
          { icon: Phone, label: t("orders.orderEditor.phone"), value: phone },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-start gap-2.5 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50"
          >
            <Icon size={13} className="mt-0.5 shrink-0 text-gray-400" />
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
                {label}
              </div>
              <div className="truncate text-xs font-semibold text-gray-900 sm:text-sm dark:text-white">
                {value || "—"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Email & Address — full width */}
      <div className="mt-2 space-y-2">
        {[
          { icon: Mail, label: t("orders.orderEditor.email"), value: email },
          { icon: MapPin, label: t("orders.orderEditor.address"), value: address },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-start gap-2.5 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50"
          >
            <Icon size={13} className="mt-0.5 shrink-0 text-gray-400" />
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500">
                {label}
              </div>
              <div className="break-words text-xs font-semibold text-gray-900 sm:text-sm dark:text-white">
                {value || "—"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarInfoCard;
