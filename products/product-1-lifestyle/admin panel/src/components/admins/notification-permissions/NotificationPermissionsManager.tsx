import { useState } from "react";
import toast from "react-hot-toast";
import { Bell, Save } from "lucide-react";
import {
  useAllAdminNotificationPermissions,
  useSetAdminNotificationPermissions,
} from "@/hooks/useNotificationPermissions";
import { toPublicUrl } from "@/config/env";
import type { AdminNotificationPermission, SetNotificationPermissionsPayload } from "@/api/notification-permissions.api";

type PermRow = AdminNotificationPermission & { dirty: boolean };

function initials(name: string | null | undefined) {
  const p = (name ?? "").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "A";
}

const PERM_FIELDS: { key: keyof SetNotificationPermissionsPayload; label: string; short: string }[] = [
  { key: "order_notification_email", label: "Order Email", short: "Email" },
  { key: "order_notification_sms", label: "Order SMS", short: "SMS" },
  { key: "order_notification_firebase_push", label: "Order Push", short: "Push" },
  { key: "personal_notification_email", label: "Personal Email", short: "Email" },
  { key: "personal_notification_sms", label: "Personal SMS", short: "SMS" },
  { key: "personal_notification_firebase_push", label: "Personal Push", short: "Push" },
];

export default function NotificationPermissionsManager() {
  const { data, isLoading, isError } = useAllAdminNotificationPermissions();
  const setPermsMutation = useSetAdminNotificationPermissions();
  const [rows, setRows] = useState<PermRow[]>([]);
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  // sync from API
  useState(() => {
    if (!data?.data) return;
    setRows(data.data.map((p) => ({ ...p, dirty: false })));
  });

  if (isLoading) return <p className="text-sm text-gray-500 p-4">Loading permissions...</p>;
  if (isError || !data) return <p className="text-sm text-error-500 p-4">Failed to load permissions.</p>;

  const perms = data.data;
  if (perms.length === 0)
    return <p className="text-sm text-gray-500 p-4">No active admins found.</p>;

  const toggle = (admin_id: number, key: keyof SetNotificationPermissionsPayload) => {
    setRows((prev) =>
      prev.map((r) => (r.admin_id === admin_id ? { ...r, [key]: !r[key], dirty: true } : r))
    );
  };

  const saveRow = async (row: PermRow) => {
    setSaving((s) => ({ ...s, [row.admin_id]: true }));
    try {
      const payload: SetNotificationPermissionsPayload = {
        order_notification_email: row.order_notification_email,
        order_notification_sms: row.order_notification_sms,
        order_notification_firebase_push: row.order_notification_firebase_push,
        personal_notification_email: row.personal_notification_email,
        personal_notification_sms: row.personal_notification_sms,
        personal_notification_firebase_push: row.personal_notification_firebase_push,
      };
      await setPermsMutation.mutateAsync({ admin_id: row.admin_id, payload });
      setRows((prev) => prev.map((r) => (r.admin_id === row.admin_id ? { ...r, dirty: false } : r)));
      toast.success(`Permissions saved for ${row.admin_name}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save.");
    } finally {
      setSaving((s) => ({ ...s, [row.admin_id]: false }));
    }
  };

  const rowsState: PermRow[] = rows.length === perms.length ? rows : perms.map((p) => ({ ...p, dirty: false }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <Bell size={18} className="text-brand-500" />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Admin Notification Permissions</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Control email, SMS, and push notification alerts per admin account.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left text-xs font-semibold text-brand-500 w-56">Admin</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400" colSpan={3}>
                Order Notifications
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700" colSpan={3}>
                Personal Notifications
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-brand-500 w-20">Save</th>
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <th />
              {["Email", "SMS", "Push", "Email", "SMS", "Push"].map((label, i) => (
                <th
                  key={i}
                  className={`px-2 py-2 text-center text-xs text-gray-400 ${i === 3 ? "border-l border-gray-200 dark:border-gray-700" : ""}`}
                >
                  {label}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rowsState.map((row) => (
              <tr key={row.admin_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                {/* Admin info */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                      {row.profile_img_path ? (
                        <img src={toPublicUrl(row.profile_img_path) ?? ""} alt={row.admin_name} className="h-full w-full object-cover" />
                      ) : (
                        initials(row.admin_name)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{row.admin_name}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{row.role_name}</p>
                    </div>
                  </div>
                </td>

                {/* Order toggles */}
                {(["order_notification_email", "order_notification_sms", "order_notification_firebase_push"] as const).map((key) => (
                  <td key={key} className="px-2 py-3 text-center">
                    <button
                      type="button"
                      aria-label={key}
                      onClick={() => toggle(row.admin_id, key)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${row[key] ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${row[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                ))}

                {/* Personal toggles */}
                {(["personal_notification_email", "personal_notification_sms", "personal_notification_firebase_push"] as const).map((key, i) => (
                  <td key={key} className={`px-2 py-3 text-center ${i === 0 ? "border-l border-gray-200 dark:border-gray-700" : ""}`}>
                    <button
                      type="button"
                      aria-label={key}
                      onClick={() => toggle(row.admin_id, key)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${row[key] ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${row[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                ))}

                {/* Save */}
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => saveRow(row)}
                    disabled={!row.dirty || saving[row.admin_id]}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                      row.dirty
                        ? "border-brand-500 bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400"
                        : "border-gray-200 bg-white text-gray-300 cursor-not-allowed dark:border-gray-800 dark:bg-gray-900 dark:text-gray-700"
                    }`}
                    title={row.dirty ? "Save changes" : "No changes"}
                  >
                    {saving[row.admin_id] ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    ) : (
                      <Save size={14} />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
