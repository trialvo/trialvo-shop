import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertTriangle, Bell, BellRing, KeyRound, Lock,
  Mail, MessageSquare, Percent, Save, Settings2,
  ShoppingCart, Smartphone, X, Zap,
} from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import { usePermissionConfig, usePatchPermissionConfig } from "@/hooks/usePermissions";
import { useFirebaseCredential } from "@/hooks/useFirebaseConfig";
import {
  useAllAdminNotificationPermissions,
  useSetAdminNotificationPermissions,
} from "@/hooks/useNotificationPermissions";
import { toPublicUrl } from "@/config/env";
import type { AdminNotificationPermission, SetNotificationPermissionsPayload } from "@/api/notification-permissions.api";
import Switch from "@/components/form/switch/Switch";
import Select from "@/components/form/Select";

import { cn } from "@/lib/utils";

// â”€â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //
type PermRow = AdminNotificationPermission & { dirty: boolean };

function initials(name: string | null | undefined) {
  const p = (name ?? "").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "A";
}

// â”€â”€â”€ Rich metadata derived from PermissionSettingsDB.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //

/** Section keys displayed in the System Settings tab */
const SECTION_ORDER = [
  "forgot_pass_method",
  "forget_pass_method_admin",
  "order_place_permission",
  "order_status_notification_user",
  "overall_cart_discount",
  "announcement",
];

/** The 4 admin-channel sections live in the Admin Notifications tab */
const ADMIN_NOTIF_SECTIONS = new Set([
  "order__notification_admin",
  "personal_notification_admin",
  "contact__notification_admin",
  "report__notification_admin",
]);

type SectionMeta = {
  label: string;
  description: string;
  icon: React.ReactNode;
};
const SECTION_META: Record<string, SectionMeta> = {
  forgot_pass_method: {
    label: "Forgot Password — Customer",
    description: "How customers can reset their password.",
    icon: <KeyRound size={15} />,
  },
  forget_pass_method_admin: {
    label: "Forgot Password — Admin",
    description: "How admin accounts can reset their password.",
    icon: <Lock size={15} />,
  },
  order_place_permission: {
    label: "Order Placement Requirements",
    description: "Verification requirements before a customer can place an order.",
    icon: <ShoppingCart size={15} />,
  },
  order_status_notification_user: {
    label: "Order Notifications → Customer",
    description: "Channels used to notify customers about order status changes.",
    icon: <BellRing size={15} />,
  },
  order__notification_admin: {
    label: "Order Notifications → Admin",
    description: "Channels used to alert admins when new orders arrive or change status.",
    icon: <Bell size={15} />,
  },
  personal_notification_admin: {
    label: "Personal Notifications → Admin",
    description: "Channels for personal/account-level notifications sent to admins.",
    icon: <MessageSquare size={15} />,
  },
  contact__notification_admin: {
    label: "Contact Us Notifications → Admin",
    description: "Channels used to notify admins when a Contact Us message is assigned to them.",
    icon: <MessageSquare size={15} />,
  },
  report__notification_admin: {
    label: "Report Notifications → Admin",
    description: "Channels used to notify admins when a customer Report is assigned to them.",
    icon: <AlertTriangle size={15} />,
  },
  overall_cart_discount: {
    label: "Cart-Wide Discount",
    description: "Automatic discount applied to the entire cart based on configurable rules.",
    icon: <Percent size={15} />,
  },
  announcement: {
    label: "Announcements",
    description: "System behaviour for scheduled and automated announcements.",
    icon: <Zap size={15} />,
  },
};

type KeyMeta = { label: string; description: string };
const KEY_META: Record<string, KeyMeta> = {
  email: { label: "Email", description: "Use email as a delivery channel." },
  sms: { label: "SMS", description: "Use SMS as a delivery channel." },
  firebase_push_notification: { label: "Firebase Push", description: "Use Firebase Cloud Messaging for push notifications." },
  email_verified: { label: "Require Email Verified", description: "Customer must have a verified email address before placing an order." },
  phone_verified_mode: { label: "Phone Verification Mode", description: "Which phone number(s) must be verified to complete an order." },
  phone_verified: { label: "Require Phone Verified", description: "Customer must verify their phone number before placing an order." },
  is_email_required: { label: "Email Required", description: "Guest must provide an email address at checkout." },
  is_phone_verification_required: { label: "Phone Verification Required", description: "Guest must verify their phone number before placing an order." },
  is_enabled: { label: "Enable Discount", description: "Turn the cart-wide discount on or off globally." },
  min_item_count: { label: "Min Item Count", description: "Minimum number of cart items required for the discount to apply. Set to 0 to disable." },
  min_total_selling_price: { label: "Min Cart Total (৳)", description: "Minimum cart subtotal (selling price) the customer must reach. Set to 0 to disable." },
  discount_type: { label: "Discount Type", description: "Whether the discount is a fixed amount or a percentage of the cart total." },
  discount_value: { label: "Discount Value", description: "The discount amount — flat (৳) or percentage (%) depending on Discount Type." },
  basis: { label: "Apply Based On", description: "Which threshold triggers the discount — item count or cart total price." },
  apply_with_bulk_combo: { label: "Stack With Bulk / Combo Offers", description: "When enabled, this discount applies on top of existing bulk or combo deals." },
  auto_send_scheduled_announcement: { label: "Auto-Send Scheduled Announcements", description: "When enabled, the system automatically sends scheduled announcements at their configured time without manual admin action." },
};

const SCOPE_LABELS: Record<string, string> = {
  default: "",
  regular: "Registered Customer Order",
  guest: "Guest Order",
  admin_manual: "Admin-Created Manual Order",
  single_page: "Single-Page Checkout Order",
};

// Human-readable labels for enum option values
const ENUM_OPTION_LABELS: Record<string, string> = {
  // phone_verified_mode
  address_phone_verified: "Shipping Address Phone Verified",
  default_phone_verified: "Account Default Phone Verified",
  both: "Both Phones Verified",
  no_phone_verification_needed: "No Verification Required",
  // discount_type
  flat: "Flat Amount (৳)",
  percentage: "Percentage (%)",
  // basis
  item_count: "Item Count",
  total_selling_price: "Cart Total Price",
};

// Channel icons for notification-type keys
const KEY_ICON: Record<string, React.ReactNode> = {
  email: <Mail size={13} />,
  sms: <Smartphone size={13} />,
  firebase_push_notification: <Bell size={13} />,
};




function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) return fallback;
  const err = error as {
    response?: { data?: { error?: unknown; message?: unknown } };
    message?: unknown;
  };
  const apiError = err.response?.data?.error;
  if (typeof apiError === "string" && apiError.trim()) return apiError.trim();
  const apiMessage = err.response?.data?.message;
  if (typeof apiMessage === "string" && apiMessage.trim()) return apiMessage.trim();
  if (typeof err.message === "string" && err.message.trim()) return err.message.trim();
  return fallback;
}

// â”€â”€â”€ SystemPermissionsPanel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //


// Flatten the nested data object into a renderable list of { section, scope, key, value, valueType, enumValues }
type FlatRow = {
  section: string;
  scope: string;   // "default" or a named scope like "regular"
  key: string;
  value: unknown;
};

function flattenPermissionData(data: Record<string, Record<string, unknown>>): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const [section, sectionVal] of Object.entries(data ?? {})) {
    if (sectionVal == null || typeof sectionVal !== "object") continue;
    for (const [scopeOrKey, val] of Object.entries(sectionVal)) {
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        // scoped section: { section: { scope: { key: value } } }
        for (const [key, v] of Object.entries(val as Record<string, unknown>)) {
          rows.push({ section, scope: scopeOrKey, key, value: v });
        }
      } else {
        // default scope section: { section: { key: value } }
        rows.push({ section, scope: "default", key: scopeOrKey, value: val });
      }
    }
  }
  return rows;
}

type FlatRowGrouped = { sectionMeta: SectionMeta | null; section: string; scopeLabel: string; groupKey: string; rows: FlatRow[] };

function groupFlatRows(rows: FlatRow[]): FlatRowGrouped[] {
  const map = new Map<string, FlatRow[]>();
  for (const row of rows) {
    const key = `${row.section}||${row.scope}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  const groups = Array.from(map.entries()).map(([groupKey, rows]) => {
    const [section, scope] = groupKey.split("||");
    return {
      groupKey,
      section,
      sectionMeta: SECTION_META[section] ?? null,
      scopeLabel: scope === "default" ? "" : (SCOPE_LABELS[scope] ?? scope.replace(/_/g, " ")),
      rows,
    };
  });
  // Sort by SECTION_ORDER, then alphabetically for unknowns
  groups.sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a.section);
    const bi = SECTION_ORDER.indexOf(b.section);
    if (ai === -1 && bi === -1) return a.section.localeCompare(b.section);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return groups;
}


// Actually we can infer type from the JS value since backend parsed it
function inferType(val: unknown): "bool" | "enum" | "number" | "string" {
  if (typeof val === "boolean") return "bool";
  if (typeof val === "number") return "number";
  return "string";
}

function SystemPermissionsPanel({
  onDirtyChange,
  saveRef,
}: {
  onDirtyChange?: (dirty: boolean) => void;
  saveRef?: React.MutableRefObject<((opts?: { onSuccess?: () => void }) => void) | null>;
}) {
  const { data, isLoading, isError } = usePermissionConfig();
  const patchMutation = usePatchPermissionConfig();

  // edits: "section||scope||key" -> new JS value (boolean | number | string)
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const eKey = (r: FlatRow) => `${r.section}||${r.scope}||${r.key}`;

  const handleChange = useCallback((r: FlatRow, val: unknown) => {
    setEdits((e) => ({ ...e, [eKey(r)]: val }));
  }, []);

  const handleSave = useCallback(async (opts?: { onSuccess?: () => void }) => {
    setSaving(true);
    const payload: Record<string, Record<string, unknown>> = {};
    for (const [k, val] of Object.entries(edits)) {
      const [section, scope, key] = k.split("||");
      if (!payload[section]) payload[section] = {};
      if (scope === "default") {
        payload[section][key] = val;
      } else {
        if (!payload[section][scope] || typeof payload[section][scope] !== "object") {
          payload[section][scope] = {};
        }
        (payload[section][scope] as Record<string, unknown>)[key] = val;
      }
    }
    try {
      await patchMutation.mutateAsync(payload);
      setEdits({});
      toast.success("System permissions saved.");
      opts?.onSuccess?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save."));
    } finally {
      setSaving(false);
    }
  }, [edits, patchMutation]);

  // Notify parent whenever dirty state changes
  useEffect(() => {
    onDirtyChange?.(Object.keys(edits).length > 0);
  }, [edits, onDirtyChange]);

  // Keep saveRef current so parent can call it from the modal
  useEffect(() => {
    if (saveRef) saveRef.current = handleSave;
  }, [saveRef, handleSave]);

  // â”€â”€ Early returns AFTER all hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //
  if (isLoading)
    return <p className="text-sm text-gray-500 p-4">Loading system permissions…</p>;
  if (isError || !data?.data)
    return (
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/50">
        <Settings2 size={16} className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500" />
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            System Permissions
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            System-level permission configuration is only available to Super Admins.
            Contact your system administrator to adjust global channel settings.
          </p>
        </div>
      </div>
    );


  const flat = flattenPermissionData(data.data);
  // Skip the 4 admin notification sections — they live in the Admin Notifications tab
  const groups = groupFlatRows(flat).filter(g => !ADMIN_NOTIF_SECTIONS.has(g.section) && g.section !== "storefront_visibility");
  const hasChanges = Object.keys(edits).length > 0;
  const currentVal = (r: FlatRow) => eKey(r) in edits ? edits[eKey(r)] : r.value;

  // Sections locked behind a "Coming Soon" overlay
  const COMING_SOON_SECTIONS = new Set<string>([]);
  const isComingSoon = (section: string, _scope: string) =>
    COMING_SOON_SECTIONS.has(section);


  return (
    <div className="space-y-5">
      {groups.map(({ groupKey, section, sectionMeta, scopeLabel, rows }) => {
        const locked = isComingSoon(section, rows[0]?.scope ?? "default");

        return (
        <div key={groupKey} className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {/* Coming Soon overlay */}
          {locked && (
            <div className="absolute inset-0 z-20 flex cursor-not-allowed select-none items-center justify-center animate-in fade-in duration-300" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(249,250,251,0.85) 50%, rgba(255,255,255,0.75) 100%)" }}>
              {/* Dot grid pattern */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "16px 16px" }} />

              <div className="relative flex flex-col items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 ring-4 ring-gray-100/50 dark:bg-gray-800 dark:ring-gray-800/50">
                  <Lock size={18} className="text-gray-400 animate-pulse" style={{ animationDuration: "3s" }} />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[13px] font-bold tracking-[0.08em] uppercase text-gray-500 dark:text-gray-400">
                    Coming Soon
                  </span>
                  <p className="text-[11px] font-medium text-gray-400/80 dark:text-gray-500">
                    This feature is currently under development
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section header */}
          <div className="flex items-start gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/40">
            {sectionMeta && (
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                {sectionMeta.icon}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {sectionMeta?.label ?? section.replace(/_/g, " ")}
                {scopeLabel && (
                  <span className="ml-2 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:border-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                    {scopeLabel}
                  </span>
                )}
              </p>
              {sectionMeta?.description && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{sectionMeta.description}</p>
              )}
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => {
              const val = currentVal(row);
              const isDirty = eKey(row) in edits;
              const valType = inferType(row.value);
              const keyMeta = KEY_META[row.key];
              const channelIcon = KEY_ICON[row.key];



              const KNOWN_ENUMS: Record<string, string[]> = {
                phone_verified_mode: ["address_phone_verified", "default_phone_verified", "both", "no_phone_verification_needed"],
                discount_type: ["flat", "percentage"],
                basis: ["item_count", "total_selling_price"],
              };
              const enumOpts = KNOWN_ENUMS[row.key];

              const labelBlock = (
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    {channelIcon && <span className="text-gray-400 dark:text-gray-500">{channelIcon}</span>}
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {keyMeta?.label ?? row.key.replace(/_/g, " ")}
                    </p>
                    {isDirty && (
                      <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                        unsaved
                      </span>
                    )}
                  </div>
                  {keyMeta?.description && (
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 leading-snug max-w-lg">
                      {keyMeta.description}
                    </p>
                  )}
                </div>
              );



              return (
                <div key={row.key} className={cn(
                  "flex items-center justify-between px-5 py-3.5 gap-4 transition-colors",
                  isDirty && "bg-amber-50/40 dark:bg-amber-500/5",
                )}>
                  <div className="flex-1">{labelBlock}</div>

                  {valType === "bool" && (
                    <Switch
                      checked={!!val}
                      onChange={(checked) => handleChange(row, checked)}
                      size="md"
                      color="brand"
                    />
                  )}

                  {valType === "number" && (
                    <input
                      type="number"
                      min={0}
                      max={undefined}
                      value={String(val)}
                      onChange={(e) => handleChange(row, Number(e.target.value))}
                      className="w-28 shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-right outline-none transition-colors focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  )}

                  {valType === "string" && (() => {
                    if (enumOpts) {
                      const selectOptions = enumOpts.map((o) => ({
                        value: o,
                        label: ENUM_OPTION_LABELS[o] ?? o.replace(/_/g, " "),
                      }));
                      return (
                        <div className="w-56 shrink-0">
                          <Select
                            options={selectOptions}
                            value={String(val)}
                            onChange={(v) => handleChange(row, v)}
                          />
                        </div>
                      );
                    }



                    const inputValue = typeof val === "string" ? val : String(val ?? "");
                    return (
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => handleChange(row, e.target.value)}
                        className="w-56 shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
        );
      })}

      <div className="sticky bottom-4 flex justify-end">
        <button type="button" onClick={() => handleSave()} disabled={!hasChanges || saving}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow transition-colors ${
            hasChanges && !saving
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
          }`}>
          <Save size={15} />
          {saving ? "Saving…" : "Save System Permissions"}
        </button>
      </div>
    </div>
  );
}

// â”€â”€â”€ GlobalChannelSettingsBlock â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Renders the 4 admin-notification sections from SystemPermissions inside the
// Admin Notifications tab so Super Admins can edit global channel flags there.

function GlobalChannelSettingsBlock() {
  const { data, isLoading } = usePermissionConfig();
  const patchMutation = usePatchPermissionConfig();

  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const eKey = (r: FlatRow) => `${r.section}||${r.scope}||${r.key}`;

  const handleChange = useCallback((r: FlatRow, val: unknown) => {
    setEdits((e) => ({ ...e, [eKey(r)]: val }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, Record<string, unknown>> = {};
    for (const [k, val] of Object.entries(edits)) {
      const [section, scope, key] = k.split("||");
      if (!payload[section]) payload[section] = {};
      if (scope === "default") {
        payload[section][key] = val;
      } else {
        if (!payload[section][scope] || typeof payload[section][scope] !== "object") {
          payload[section][scope] = {};
        }
        (payload[section][scope] as Record<string, unknown>)[key] = val;
      }
    }
    try {
      await patchMutation.mutateAsync(payload);
      setEdits({});
      toast.success("Channel settings saved.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save."));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <p className="text-sm text-gray-500 p-4">Loading channel settings…</p>;
  if (!data?.data) return null; // Non-super-admins: silently hidden (section title explains it)

  const flat = flattenPermissionData(data.data);
  // Only the 4 admin-notification sections
  const ADMIN_NOTIF_ORDER = [
    "order__notification_admin",
    "personal_notification_admin",
    "contact__notification_admin",
    "report__notification_admin",
  ];
  const groups = groupFlatRows(flat)
    .filter(g => ADMIN_NOTIF_SECTIONS.has(g.section))
    .sort((a, b) => ADMIN_NOTIF_ORDER.indexOf(a.section) - ADMIN_NOTIF_ORDER.indexOf(b.section));

  if (!groups.length) return null;

  const hasChanges = Object.keys(edits).length > 0;
  const currentVal = (r: FlatRow) => eKey(r) in edits ? edits[eKey(r)] : r.value;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Global Channel Settings</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Toggle which delivery channels are globally active for each notification type.
            Per-admin toggles below only apply when the global channel is on.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
            hasChanges && !saving
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
          }`}
        >
          <Save size={14} />
          {saving ? "Saving…" : hasChanges ? `Save (${Object.keys(edits).length})` : "Save"}
        </button>
      </div>

      {groups.map(({ groupKey, section, sectionMeta, scopeLabel, rows }) => (
        <div key={groupKey} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4 dark:border-gray-800 dark:bg-gray-800/40">
            {sectionMeta && (
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                {sectionMeta.icon}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {sectionMeta?.label ?? section.replace(/_/g, " ")}
                {scopeLabel && (
                  <span className="ml-2 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:border-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                    {scopeLabel}
                  </span>
                )}
              </p>
              {sectionMeta?.description && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{sectionMeta.description}</p>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((row) => {
              const val = currentVal(row);
              const isDirty = eKey(row) in edits;
              const keyMeta = KEY_META[row.key];
              const channelIcon = KEY_ICON[row.key];
              return (
                <div key={row.key} className={`flex items-center justify-between px-5 py-3.5 gap-4 transition-colors ${isDirty ? "bg-amber-50/40 dark:bg-amber-500/5" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {channelIcon && <span className="text-gray-400 dark:text-gray-500">{channelIcon}</span>}
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                        {keyMeta?.label ?? row.key.replace(/_/g, " ")}
                      </p>
                      {isDirty && (
                        <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                          unsaved
                        </span>
                      )}
                    </div>
                    {keyMeta?.description && (
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 leading-snug">{keyMeta.description}</p>
                    )}
                  </div>
                  {typeof val === "boolean" && (
                    <button type="button"
                      onClick={() => handleChange(row, !val)}
                      title={val ? "Enabled — click to disable" : "Disabled — click to enable"}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        val ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                      }`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        val ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <hr className="border-gray-200 dark:border-gray-700 my-2" />
    </div>
  );
}

// â”€â”€â”€ AdminNotifPermissionsPanel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //
function AdminNotifPermissionsPanel() {
  const { data, isLoading, isError } = useAllAdminNotificationPermissions();
  const setPermsMutation = useSetAdminNotificationPermissions();
  // Firebase credential status to reflect push availability
  const { data: firebaseCred, isLoading: fbLoading } = useFirebaseCredential();
  const firebaseActive = !fbLoading && !!firebaseCred?.is_active;
  const firebaseConfigured = !fbLoading && !!firebaseCred;
  // System-level channel flags from getPermissionConfig
  const { data: sysConfig } = usePermissionConfig();

  const [rows, setRows] = useState<PermRow[]>([]);
  const [saving, setSaving] = useState(false);

  // Sync rows when data loads / changes.
  // MERGE instead of replace: preserve any row the user has already edited
  // (dirty=true). This prevents saving row A from resetting unsaved changes
  // in rows B, C, D when the query refetches after the mutation.
  useEffect(() => {
    if (!data?.data) return;
    setRows((prev) => {
      if (prev.length === 0) {
        // Initial load — populate from server
        return data.data.map((p) => ({ ...p, dirty: false }));
      }
      // Subsequent loads (e.g. after a successful save refetch) — merge
      return data.data.map((p) => {
        const existing = prev.find((r) => r.admin_id === p.admin_id);
        // Keep the user's unsaved edits; only update rows that are clean
        if (existing?.dirty) return existing;
        return { ...p, dirty: false };
      });
    });
  }, [data]);


  if (isLoading)
    return <p className="text-sm text-gray-500 p-4">Loading admin permissions…</p>;
  if (isError || !data)
    return (
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 dark:border-gray-700 dark:bg-gray-800/50">
        <Bell size={16} className="mt-0.5 shrink-0 text-gray-400 dark:text-gray-500" />
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Admin Notification Permissions
          </p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Per-admin notification settings are only available to Super Admins.
            Contact your system administrator to adjust individual notification preferences.
          </p>
        </div>
      </div>
    );

  const perms = data.data;
  if (perms.length === 0)
    return <p className="text-sm text-gray-500 p-4">No active admins found.</p>;

  // Extract system-level channel on/off from permission config
  // sysConfig.data shape: { order__notification_admin: { email, sms, firebase_push_notification }, personal_notification_admin: { ... } }
  const sysData = sysConfig?.data as Record<string, Record<string, unknown>> | undefined;
  const orderSys    = (sysData?.["order__notification_admin"]   ?? {}) as Record<string, unknown>;
  const personalSys = (sysData?.["personal_notification_admin"] ?? {}) as Record<string, unknown>;
  const contactSys  = (sysData?.["contact__notification_admin"] ?? {}) as Record<string, unknown>; // V2-036
  const reportSys   = (sysData?.["report__notification_admin"]  ?? {}) as Record<string, unknown>;  // V2-036

  // true = channel is globally ON (or unknown—default open)
  const sysOn = {
    order_email:    sysData ? !!orderSys["email"]    : true,
    order_sms:      sysData ? !!orderSys["sms"]      : true,
    order_push:     sysData ? !!orderSys["firebase_push_notification"] : true,
    personal_email: sysData ? !!personalSys["email"] : true,
    personal_sms:   sysData ? !!personalSys["sms"]   : true,
    personal_push:  sysData ? !!personalSys["firebase_push_notification"] : true,
    contact_email:  sysData ? !!contactSys["email"]  : true,
    contact_sms:    sysData ? !!contactSys["sms"]    : true,
    contact_push:   sysData ? !!contactSys["firebase_push_notification"] : true,
    report_email:   sysData ? !!reportSys["email"]   : true,
    report_sms:     sysData ? !!reportSys["sms"]     : true,
    report_push:    sysData ? !!reportSys["firebase_push_notification"]  : true,
  };

  // Map admin notification keys to their system channel flag
  const systemChannel: Record<string, boolean> = {
    order_notification_email:             sysOn.order_email,
    order_notification_sms:               sysOn.order_sms,
    order_notification_firebase_push:     sysOn.order_push,
    personal_notification_email:          sysOn.personal_email,
    personal_notification_sms:            sysOn.personal_sms,
    personal_notification_firebase_push:  sysOn.personal_push,
    contact_notification_email:           sysOn.contact_email,
    contact_notification_sms:             sysOn.contact_sms,
    contact_notification_firebase_push:   sysOn.contact_push,
    report_notification_email:            sysOn.report_email,
    report_notification_sms:              sysOn.report_sms,
    report_notification_firebase_push:    sysOn.report_push,
  };

  const toggle = (admin_id: number, key: keyof SetNotificationPermissionsPayload) => {
    setRows((prev) =>
      prev.map((r) => (r.admin_id === admin_id ? { ...r, [key]: !r[key], dirty: true } : r))
    );
  };

  const saveAll = async () => {
    const dirty = rowsState.filter((r) => r.dirty);
    if (!dirty.length) return;
    setSaving(true);
    try {
      await Promise.all(
        dirty.map((row) => {
          const payload: SetNotificationPermissionsPayload = {
            order_notification_email:             row.order_notification_email,
            order_notification_sms:               row.order_notification_sms,
            order_notification_firebase_push:     row.order_notification_firebase_push,
            personal_notification_email:          row.personal_notification_email,
            personal_notification_sms:            row.personal_notification_sms,
            personal_notification_firebase_push:  row.personal_notification_firebase_push,
            contact_notification_email:           row.contact_notification_email,
            contact_notification_sms:             row.contact_notification_sms,
            contact_notification_firebase_push:   row.contact_notification_firebase_push,
            report_notification_email:            row.report_notification_email,
            report_notification_sms:              row.report_notification_sms,
            report_notification_firebase_push:    row.report_notification_firebase_push,
            allow_handle_unassigned_order:        row.allow_handle_unassigned_order,
          };
          return setPermsMutation.mutateAsync({ admin_id: row.admin_id, payload });
        })
      );
      setRows((prev) => prev.map((r) => ({ ...r, dirty: false })));
      toast.success(
        dirty.length === 1
          ? `Permissions saved for ${dirty[0].admin_name ?? 'admin'}`
          : `Permissions saved for ${dirty.length} admins`
      );
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to save permissions.'));
    } finally {
      setSaving(false);
    }
  };

  const rowsState: PermRow[] =
    rows.length === perms.length ? rows : perms.map((p) => ({ ...p, dirty: false }));

  // Helper: toggle colour for a given key + value
  const toggleColour = (key: string, on: boolean) => {
    const isPush = key.includes("firebase_push");
    const sysOff = !systemChannel[key];
    const fbOff = isPush && !firebaseActive;
    if (sysOff || fbOff) return on ? "bg-orange-400" : "bg-gray-200 dark:bg-gray-700";
    return on ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700";
  };

  const toggleTitle = (key: string): string | undefined => {
    const isPush = key.includes("firebase_push");
    if (!systemChannel[key])   return "This channel is globally disabled in System Settings";
    if (isPush && !firebaseActive) return "Firebase is inactive — push won't be sent";
    return undefined;
  };

  // Column-level warning: system off OR (push and firebase off)
  const colWarning = (_label: string, i: number): boolean => {
    if (i === 0)  return !sysOn.order_email;
    if (i === 1)  return !sysOn.order_sms;
    if (i === 2)  return !sysOn.order_push || !firebaseActive;
    if (i === 3)  return !sysOn.personal_email;
    if (i === 4)  return !sysOn.personal_sms;
    if (i === 5)  return !sysOn.personal_push || !firebaseActive;
    if (i === 6)  return !sysOn.contact_email;
    if (i === 7)  return !sysOn.contact_sms;
    if (i === 8)  return !sysOn.contact_push || !firebaseActive;
    if (i === 9)  return !sysOn.report_email;
    if (i === 10) return !sysOn.report_sms;
    if (i === 11) return !sysOn.report_push || !firebaseActive;
    return false;
  };

  // Global channel status card rows
  type ChanStatus = { label: string; orderOn: boolean; personalOn: boolean; contactOn: boolean; reportOn: boolean; isPush?: boolean };
  const channelRows: ChanStatus[] = [
    { label: "Email",        orderOn: sysOn.order_email,  personalOn: sysOn.personal_email, contactOn: sysOn.contact_email,  reportOn: sysOn.report_email },
    { label: "SMS",          orderOn: sysOn.order_sms,    personalOn: sysOn.personal_sms,   contactOn: sysOn.contact_sms,    reportOn: sysOn.report_sms },
    { label: "Firebase Push",orderOn: sysOn.order_push,   personalOn: sysOn.personal_push,  contactOn: sysOn.contact_push,   reportOn: sysOn.report_push,  isPush: true },
  ];

  return (
    <div className="space-y-3">
      {/* Global Channel Settings editor — the 4 admin notification sections */}
      <GlobalChannelSettingsBlock />

      {/* Global channel status card */}
      {sysData && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-start gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-3 dark:border-gray-800 dark:bg-gray-800/40">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Bell size={14} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Global Channel Status</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                System-level channel on/off from{" "}
                <button type="button" className="underline hover:no-underline"
                  onClick={() => {/* could switch to system tab */}}>
                  System Settings
                </button>
                . Per-admin toggles only apply when the global channel is active.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-2 text-left font-medium text-gray-500 dark:text-gray-400 w-32">Channel</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Order Notifications</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Personal Notifications</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Contact Us Notifications</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-500 dark:text-gray-400">Report Notifications</th>
                </tr>
              </thead>
              <tbody>
                {channelRows.map(({ label, orderOn, personalOn, contactOn, reportOn, isPush }) => {
                  const effectiveOrderOn    = isPush ? orderOn    && firebaseActive : orderOn;
                  const effectivePersonalOn = isPush ? personalOn && firebaseActive : personalOn;
                  const effectiveContactOn  = isPush ? contactOn  && firebaseActive : contactOn;
                  const effectiveReportOn   = isPush ? reportOn   && firebaseActive : reportOn;
                  const chip = (on: boolean, fbIssue?: boolean) => (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      on
                        ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400"
                        : "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-success-500" : "bg-error-400"}`} />
                      {on ? "Active" : fbIssue ? "Firebase inactive" : "Disabled"}
                    </span>
                  );
                  return (
                    <tr key={label} className="border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {isPush ? <Bell size={11} className="text-gray-400" /> :
                           label === "Email" ? <Mail size={11} className="text-gray-400" /> :
                           <Smartphone size={11} className="text-gray-400" />}
                          <span className="font-medium text-gray-700 dark:text-gray-200">{label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {chip(effectiveOrderOn, isPush && orderOn && !firebaseActive)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {chip(effectivePersonalOn, isPush && personalOn && !firebaseActive)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {chip(effectiveContactOn, isPush && contactOn && !firebaseActive)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {chip(effectiveReportOn, isPush && reportOn && !firebaseActive)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Firebase status banner */}
      {!fbLoading && (
        !firebaseConfigured ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-500/10">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <strong>Firebase not configured.</strong> Push notification toggles below have no effect until a Firebase credential is added.
              {" "}<Link to="/firebase-credential" className="underline hover:no-underline">Configure Firebase →</Link>
            </p>
          </div>
        ) : !firebaseActive ? (
          <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-700 dark:bg-orange-500/10">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-orange-500" />
            <p className="text-sm text-orange-700 dark:text-orange-400">
              <strong>Firebase credential is inactive.</strong> Push notifications will not be sent until Firebase is activated.
              {" "}<Link to="/firebase-credential" className="underline hover:no-underline">Activate Firebase →</Link>
            </p>
          </div>
        ) : null
      )}

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-x-auto">
      <table className="min-w-[1050px] w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <th className="px-4 py-3 text-left text-xs font-semibold text-brand-500 w-56">Admin</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400" colSpan={3}>
              Order Notifications
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700" colSpan={3}>
              Personal Notifications
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700" colSpan={3}>
              Contact Notifications
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 border-l border-gray-200 dark:border-gray-700" colSpan={3}>
              Report Notifications
            </th>
          </tr>
          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <th />
            {["Email", "SMS", "Push", "Email", "SMS", "Push", "Email", "SMS", "Push", "Email", "SMS", "Push"].map((label, i) => (
              <th key={i} className={`px-2 py-2 text-center text-xs ${i === 3 || i === 6 || i === 9 ? "border-l border-gray-200 dark:border-gray-700" : ""}`}>
                <span className={`inline-flex items-center gap-1 ${colWarning(label, i) ? "text-orange-400 dark:text-orange-500" : "text-gray-400"}`}>
                  {label}
                  {colWarning(label, i) && <AlertTriangle size={10} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowsState.map((row) => (
            <tr key={row.admin_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                    {row.profile_img_path ? (
                      <img src={toPublicUrl(row.profile_img_path) ?? ""} alt={row.admin_name ?? ""} className="h-full w-full object-cover" />
                    ) : (
                      initials(row.admin_name)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{row.admin_name ?? "—"}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{row.role_name}</p>
                  </div>
                </div>
              </td>

              {(["order_notification_email", "order_notification_sms", "order_notification_firebase_push"] as const).map((key) => (
                <td key={key} className="px-2 py-3 text-center">
                  <button type="button" aria-label={key}
                    onClick={() => toggle(row.admin_id, key)}
                    title={toggleTitle(key)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${toggleColour(key, !!row[key])}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${row[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </td>
              ))}

              {(["personal_notification_email", "personal_notification_sms", "personal_notification_firebase_push"] as const).map((key, i) => (
                <td key={key} className={`px-2 py-3 text-center ${i === 0 ? "border-l border-gray-200 dark:border-gray-700" : ""}`}>
                  <button type="button" aria-label={key}
                    onClick={() => toggle(row.admin_id, key)}
                    title={toggleTitle(key)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${toggleColour(key, !!row[key])}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${row[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </td>
              ))}

              {/* V2-036: Contact Us notification toggles */}
              {(["contact_notification_email", "contact_notification_sms", "contact_notification_firebase_push"] as const).map((key, i) => (
                <td key={key} className={`px-2 py-3 text-center ${i === 0 ? "border-l border-gray-200 dark:border-gray-700" : ""}`}>
                  <button type="button" aria-label={key}
                    onClick={() => toggle(row.admin_id, key)}
                    title={toggleTitle(key)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${toggleColour(key, !!row[key])}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${row[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </td>
              ))}

              {/* V2-036: Report notification toggles */}
              {(["report_notification_email", "report_notification_sms", "report_notification_firebase_push"] as const).map((key, i) => (
                <td key={key} className={`px-2 py-3 text-center ${i === 0 ? "border-l border-gray-200 dark:border-gray-700" : ""}`}>
                  <button type="button" aria-label={key}
                    onClick={() => toggle(row.admin_id, key)}
                    title={toggleTitle(key)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${toggleColour(key, !!row[key])}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${row[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </td>
              ))}

              {/* Unsaved indicator dot */}
              {row.dirty && (
                <td className="px-1 py-3 text-center">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Single Save All button */}
      {(() => {
        const dirtyCount = rowsState.filter((r) => r.dirty).length;
        return (
          <div className="flex items-center justify-end gap-3">
            {dirtyCount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {dirtyCount} row{dirtyCount > 1 ? 's' : ''} with unsaved changes
              </p>
            )}
            <button
              type="button"
              onClick={saveAll}
              disabled={dirtyCount === 0 || saving}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow transition-colors ${
                dirtyCount > 0 && !saving
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
              }`}
            >
              {saving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save size={15} />
              )}
              {saving ? 'Saving…' : dirtyCount > 0 ? `Save Changes (${dirtyCount})` : 'Save Changes'}
            </button>
          </div>
        );
      })()}
    </div>
  );
}

// â”€â”€â”€ Unsaved Changes Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //
function UnsavedChangesModal({
  onSave, onDiscard, onCancel,
}: {
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-500/10">
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Unsaved Changes</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You have unsaved system permission changes. What would you like to do?
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={onSave}
            className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
            Save &amp; Leave
          </button>
          <button type="button" onClick={onDiscard}
            className="w-full rounded-xl border border-error-200 bg-error-50 px-4 py-2.5 text-sm font-semibold text-error-600 hover:bg-error-100 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400 transition-colors">
            Discard &amp; Leave
          </button>
          <button type="button" onClick={onCancel}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ //
type Tab = "system" | "admins";

/**
 * Works with BrowserRouter (no data router required).
 * Intercepts pushState / replaceState and popstate to catch SPA nav.
 * Returns { blocked, pendingPath, proceed, cancel }.
 */
function useNavigationGuard(isDirty: boolean) {
  const navigate = useNavigate();
  const [blocked, setBlocked] = useState(false);
  const pendingPath = useRef<string | null>(null);
  const bypassRef = useRef(false);

  useEffect(() => {
    if (!isDirty) return;

    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);

    const intercept = (fn: typeof origPush) =>
      (...args: Parameters<typeof origPush>) => {
        if (bypassRef.current) { bypassRef.current = false; return fn(...args); }
        const url = args[2];
        if (url && typeof url === "string") {
          const path = url.startsWith("http") ? new URL(url).pathname : url;
          pendingPath.current = path;
          setBlocked(true);
          return; // stop navigation
        }
        return fn(...args);
      };

    window.history.pushState = intercept(origPush) as typeof origPush;
    window.history.replaceState = intercept(origReplace) as typeof origReplace;

    const onPopState = () => {
      if (bypassRef.current) { bypassRef.current = false; return; }
      // push the state back so we stay on current page
      window.history.forward();
      pendingPath.current = null;
      setBlocked(true);
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      window.removeEventListener("popstate", onPopState);
    };
  }, [isDirty]);

  const proceed = useCallback(() => {
    bypassRef.current = true;
    setBlocked(false);
    if (pendingPath.current) {
      navigate(pendingPath.current);
      pendingPath.current = null;
    }
  }, [navigate]);

  const cancel = useCallback(() => {
    setBlocked(false);
    pendingPath.current = null;
  }, []);

  return { blocked, proceed, cancel };
}

export default function PermissionsPage() {
  const [tab, setTab] = useState<Tab>("system");
  const [systemDirty, setSystemDirty] = useState(false);
  // Ref to call SystemPermissionsPanel's save from the modal
  const panelSaveRef = useRef<((opts?: { onSuccess?: () => void }) => void) | null>(null);

  const handleDirtyChange = useCallback((dirty: boolean) => setSystemDirty(dirty), []);

  // Navigation guard (works with BrowserRouter)
  const { blocked, proceed, cancel } = useNavigationGuard(systemDirty);

  // Warn on tab close / hard refresh
  useEffect(() => {
    if (!systemDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [systemDirty]);

  const handleSaveAndLeave = useCallback(() => {
    if (panelSaveRef.current) {
      panelSaveRef.current({ onSuccess: () => proceed() });
    } else {
      proceed(); // fallback
    }
  }, [proceed]);

  return (
    <>
      <PageMeta
        title="Permissions"
        description="System permission settings and per-admin notification permissions"
      />

      {/* Unsaved changes modal */}
      {blocked && (
        <UnsavedChangesModal
          onSave={handleSaveAndLeave}
          onDiscard={() => proceed()}
          onCancel={() => cancel()}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Permissions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage system-level feature permissions and per-admin notification preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-900 mb-6 w-fit">
        {(
          [
            { id: "system" as Tab, label: "System Settings", icon: <Settings2 size={14} /> },
            { id: "admins" as Tab, label: "Admin Notifications", icon: <Bell size={14} /> },
          ] as const
        ).map(({ id, label, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {icon}
            {label}
            {id === "system" && systemDirty && (
              <span className="h-2 w-2 rounded-full bg-amber-400" title="Unsaved changes" />
            )}
          </button>
        ))}
      </div>

      {tab === "system" && (
        <SystemPermissionsPanel
          onDirtyChange={handleDirtyChange}
          saveRef={panelSaveRef}
        />
      )}
      {tab === "admins" && <AdminNotifPermissionsPanel />}
    </>
  );
}
