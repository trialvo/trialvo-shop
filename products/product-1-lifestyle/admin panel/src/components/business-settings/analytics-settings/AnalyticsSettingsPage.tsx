// src/components/business-settings/analytics-settings/AnalyticsSettingsPage.tsx
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
      Activity,
      BarChart3,
      CheckCircle2,
      ChevronDown,
      ChevronUp,
      CreditCard,
      Eye,
      Facebook,
      Fingerprint,
      FlaskConical,
      Globe,
      Key,
      Loader2,
      Mail,
      Monitor,
      MousePointer,
      MousePointerClick,
      Phone,
      RefreshCw,
      Save,
      Scroll,
      Search,
      Settings2,
      ShoppingCart,
      Tag,
      UserPlus,
      Users,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import {
      getAnalyticsConfig,
      updateAnalyticsConfig,
      type AnalyticsConfigResponse,
} from "@/api/analytics-config.api";
import Switch from "@/components/form/switch/Switch";

type ConfigData = AnalyticsConfigResponse["data"];

const DEFAULT_CONFIG: ConfigData = {
      meta: { currency: "BDT", site_name: "", environment: "production" },
      tracking: {
            auto_page_view: true,
            track_scroll: false,
            track_button_clicks: false,
            track_search: true,
      },
      analytics: {
            google_analytics: {
                  enabled: false,
                  measurement_id: "",
                  config: { anonymize_ip: true, send_page_view: true, debug_mode: false },
            },
            google_tag_manager: {
                  enabled: false,
                  gtm_id: "",
                  auth: "",
                  preview: "",
            },
            microsoft_clarity: {
                  enabled: false,
                  project_id: "",
            },
            facebook_pixel: {
                  enabled: false,
                  pixel_id: "",
                  advanced_matching: {
                        enabled: false,
                        email: true,
                        phone: true,
                        first_name: false,
                        last_name: false,
                        external_id: false,
                  },
                  track_events: {
                        page_view: true,
                        view_content: true,
                        add_to_cart: true,
                        initiate_checkout: true,
                        purchase: true,
                        search: false,
                        lead: false,
                        complete_registration: false,
                  },
                  conversion_api: {
                        enabled: false,
                        access_token: "",
                        test_event_code: "",
                  },
            },
      },
};

/* ─────────── helpers ─────────── */
function deepClone<T>(obj: T): T {
      return JSON.parse(JSON.stringify(obj));
}

function deepEqual(a: any, b: any): boolean {
      return JSON.stringify(a) === JSON.stringify(b);
}

function StatusDot({ on }: { on: boolean }) {
      return (
            <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${on
                        ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,.5)]"
                        : "bg-gray-300 dark:bg-gray-600"
                        }`}
            />
      );
}

/* ─────────── section card ─────────── */
function SectionCard({
      icon,
      title,
      subtitle,
      enabled,
      onToggle,
      toggleLoading,
      children,
      defaultOpen = true,
      dirty,
      onUpdate,
      updating,
      updateLabel,
      updatingLabel,
}: {
      icon: React.ReactNode;
      title: string;
      subtitle?: string;
      enabled?: boolean;
      onToggle?: (v: boolean) => void;
      toggleLoading?: boolean;
      children: React.ReactNode;
      defaultOpen?: boolean;
      dirty?: boolean;
      onUpdate?: () => void;
      updating?: boolean;
      updateLabel?: string;
      updatingLabel?: string;
}) {
      const [open, setOpen] = useState(defaultOpen);

      return (
            <div className="rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900 overflow-hidden transition-shadow hover:shadow-md">
                  {/* header */}
                  <button
                        type="button"
                        onClick={() => setOpen((p) => !p)}
                        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                              {icon}
                        </div>
                        <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                          {title}
                                    </h3>
                                    {enabled !== undefined && <StatusDot on={enabled} />}
                              </div>
                              {subtitle && (
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                                          {subtitle}
                                    </p>
                              )}
                        </div>

                        {onToggle && (
                              <div onClick={(e) => e.stopPropagation()}>
                                    <Switch
                                          label=""
                                          checked={enabled}
                                          onChange={onToggle}
                                          disabled={toggleLoading}
                                    />
                              </div>
                        )}

                        <span className="text-gray-400">
                              {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </span>
                  </button>

                  {/* body */}
                  <div
                        className={`transition-all duration-300 ease-in-out ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                              } overflow-hidden`}
                  >
                        <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
                              {children}

                              {/* per-section update button */}
                              {onUpdate && (
                                    <div className="mt-5 flex justify-end border-t border-gray-100 pt-4 dark:border-gray-800">
                                          <button
                                                type="button"
                                                onClick={onUpdate}
                                                disabled={!dirty || updating}
                                                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-theme-xs transition-all hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                          >
                                                {updating ? (
                                                      <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                      <Save size={16} />
                                                )}
                                                {updating ? (updatingLabel || "Updating...") : (updateLabel || "Update")}
                                          </button>
                                    </div>
                              )}
                        </div>
                  </div>
            </div>
      );
}

/* ─────────── input ─────────── */
function SettingInput({
      label,
      value,
      onChange,
      placeholder,
      type = "text",
      icon,
      disabled,
}: {
      label: string;
      value: string;
      onChange: (v: string) => void;
      placeholder?: string;
      type?: string;
      icon?: React.ReactNode;
      disabled?: boolean;
}) {
      return (
            <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        {label}
                  </label>
                  <div className="relative">
                        {icon && (
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                    {icon}
                              </div>
                        )}
                        <input
                              type={type}
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              placeholder={placeholder}
                              disabled={disabled}
                              className={`block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-brand-400 dark:focus:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${icon ? "pl-10" : ""
                                    }`}
                        />
                  </div>
            </div>
      );
}

/* ─────────── toggle row ─────────── */
function ToggleRow({
      label,
      checked,
      onChange,
      icon,
      description,
      loading,
}: {
      label: string;
      checked: boolean;
      onChange: (v: boolean) => void;
      icon?: React.ReactNode;
      description?: string;
      loading?: boolean;
}) {
      return (
            <div className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                        {icon && (
                              <span className="text-gray-400 dark:text-gray-500 shrink-0">
                                    {icon}
                              </span>
                        )}
                        <div className="min-w-0">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {label}
                              </span>
                              {description && (
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                                          {description}
                                    </p>
                              )}
                        </div>
                  </div>
                  <div className="flex items-center gap-2">
                        {loading && <Loader2 size={14} className="animate-spin text-brand-500" />}
                        <Switch label="" checked={checked} onChange={onChange} disabled={loading} />
                  </div>
            </div>
      );
}

/* ─────────── sub-section ─────────── */
function SubSection({
      title,
      children,
}: {
      title: string;
      children: React.ReactNode;
}) {
      return (
            <div className="mt-4 first:mt-0">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        {title}
                  </h4>
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50 divide-y divide-gray-100 dark:divide-gray-700/50">
                        {children}
                  </div>
            </div>
      );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════ */
export default function AnalyticsSettingsPage() {
      const { t } = useTranslation();
      const qc = useQueryClient();

      // shorthand
      const T = (key: string) => t(`analyticsSettings.${key}`);

      // ── server state ──
      const query = useQuery({
            queryKey: ["analyticsConfig"],
            queryFn: () => getAnalyticsConfig(),
            retry: 1,
      });

      const serverData: ConfigData = query.data?.data ?? deepClone(DEFAULT_CONFIG);

      // ── local editable states (per section) ──
      const [gaLocal, setGaLocal] = useState(deepClone(DEFAULT_CONFIG.analytics.google_analytics));
      const [gtmLocal, setGtmLocal] = useState(deepClone(DEFAULT_CONFIG.analytics.google_tag_manager));
      const [fbLocal, setFbLocal] = useState(deepClone(DEFAULT_CONFIG.analytics.facebook_pixel));
      const [clarityLocal, setClarityLocal] = useState(deepClone(DEFAULT_CONFIG.analytics.microsoft_clarity));
      const [trackingLocal, setTrackingLocal] = useState(deepClone(DEFAULT_CONFIG.tracking));
      const [metaLocal, setMetaLocal] = useState(deepClone(DEFAULT_CONFIG.meta));

      // ── sync server → local on fetch ──
      useEffect(() => {
            if (query.data?.data) {
                  const d = query.data.data;
                  setGaLocal(deepClone(d.analytics.google_analytics));
                  setGtmLocal(deepClone(d.analytics.google_tag_manager));
                  setFbLocal(deepClone(d.analytics.facebook_pixel));
                  setClarityLocal(deepClone(d.analytics.microsoft_clarity ?? DEFAULT_CONFIG.analytics.microsoft_clarity));
                  setTrackingLocal(deepClone(d.tracking));
                  setMetaLocal(deepClone(d.meta));
            }
      }, [query.data]);

      // ── dirty checks ──
      const gaDirty = useMemo(() => !deepEqual(gaLocal, serverData.analytics.google_analytics), [gaLocal, serverData]);
      const gtmDirty = useMemo(() => !deepEqual(gtmLocal, serverData.analytics.google_tag_manager), [gtmLocal, serverData]);
      const fbDirty = useMemo(() => !deepEqual(fbLocal, serverData.analytics.facebook_pixel), [fbLocal, serverData]);
      const clarityDirty = useMemo(() => !deepEqual(clarityLocal, serverData.analytics.microsoft_clarity ?? DEFAULT_CONFIG.analytics.microsoft_clarity), [clarityLocal, serverData]);
      const trackingDirty = useMemo(() => !deepEqual(trackingLocal, serverData.tracking), [trackingLocal, serverData]);
      const metaDirty = useMemo(() => !deepEqual(metaLocal, serverData.meta), [metaLocal, serverData]);

      // ── generic partial update helper ──
      const buildPayload = (overrides: Partial<{
            analytics: Partial<ConfigData["analytics"]>;
            tracking: ConfigData["tracking"];
            meta: ConfigData["meta"];
      }>) => {
            return {
                  config: {
                        analytics: {
                              google_analytics: overrides.analytics?.google_analytics ?? serverData.analytics.google_analytics,
                              google_tag_manager: overrides.analytics?.google_tag_manager ?? serverData.analytics.google_tag_manager,
                              facebook_pixel: overrides.analytics?.facebook_pixel ?? serverData.analytics.facebook_pixel,
                              microsoft_clarity: overrides.analytics?.microsoft_clarity ?? (serverData.analytics.microsoft_clarity ?? DEFAULT_CONFIG.analytics.microsoft_clarity),
                        },
                        tracking: overrides.tracking ?? serverData.tracking,
                        meta: overrides.meta ?? serverData.meta,
                  },
            };
      };

      const invalidate = () => qc.invalidateQueries({ queryKey: ["analyticsConfig"] });

      // ── instant toggle mutation (for enable/disable toggles) ──
      const [toggleKey, setToggleKey] = useState<string | null>(null);

      const instantToggleMutation = useMutation({
            mutationFn: (payload: ReturnType<typeof buildPayload>) =>
                  updateAnalyticsConfig(payload),
            onSuccess: (res: any) => {
                  if (res?.success === true || res?.status === true) {
                        toast.success(T("updated"));
                        invalidate();
                  } else {
                        toast.error(res?.error ?? res?.message ?? T("updateFailed"));
                  }
                  setToggleKey(null);
            },
            onError: (err: any) => {
                  toast.error(
                        err?.response?.data?.error ??
                        err?.response?.data?.message ??
                        T("updateFailed")
                  );
                  setToggleKey(null);
            },
      });

      // Instant toggle handlers — immediately update server
      const toggleGA = (v: boolean) => {
            setToggleKey("ga");
            const updated = { ...deepClone(serverData.analytics.google_analytics), enabled: v };
            setGaLocal((prev) => ({ ...prev, enabled: v }));
            instantToggleMutation.mutate(buildPayload({ analytics: { google_analytics: updated } }));
      };

      const toggleGTM = (v: boolean) => {
            setToggleKey("gtm");
            const updated = { ...deepClone(serverData.analytics.google_tag_manager), enabled: v };
            setGtmLocal((prev) => ({ ...prev, enabled: v }));
            instantToggleMutation.mutate(buildPayload({ analytics: { google_tag_manager: updated } }));
      };

      const toggleFB = (v: boolean) => {
            setToggleKey("fb");
            const updated = { ...deepClone(serverData.analytics.facebook_pixel), enabled: v };
            setFbLocal((prev) => ({ ...prev, enabled: v }));
            instantToggleMutation.mutate(buildPayload({ analytics: { facebook_pixel: updated } }));
      };

      const toggleClarity = (v: boolean) => {
            setToggleKey("clarity");
            const updated = { ...(deepClone(serverData.analytics.microsoft_clarity) ?? DEFAULT_CONFIG.analytics.microsoft_clarity), enabled: v };
            setClarityLocal((prev) => ({ ...prev, enabled: v }));
            instantToggleMutation.mutate(buildPayload({ analytics: { microsoft_clarity: updated } }));
      };

      // ── per-section update mutations ──
      const gaMutation = useMutation({
            mutationFn: () => updateAnalyticsConfig(buildPayload({ analytics: { google_analytics: gaLocal } })),
            onSuccess: (res: any) => {
                  if (res?.success || res?.status) {
                        toast.success(T("ga.updateSuccess"));
                        invalidate();
                  } else toast.error(res?.error ?? T("updateFailed"));
            },
            onError: (err: any) => toast.error(err?.response?.data?.error ?? T("updateFailed")),
      });

      const gtmMutation = useMutation({
            mutationFn: () => updateAnalyticsConfig(buildPayload({ analytics: { google_tag_manager: gtmLocal } })),
            onSuccess: (res: any) => {
                  if (res?.success || res?.status) {
                        toast.success(T("gtm.updateSuccess"));
                        invalidate();
                  } else toast.error(res?.error ?? T("updateFailed"));
            },
            onError: (err: any) => toast.error(err?.response?.data?.error ?? T("updateFailed")),
      });

      const fbMutation = useMutation({
            mutationFn: () => updateAnalyticsConfig(buildPayload({ analytics: { facebook_pixel: fbLocal } })),
            onSuccess: (res: any) => {
                  if (res?.success || res?.status) {
                        toast.success(T("fb.updateSuccess"));
                        invalidate();
                  } else toast.error(res?.error ?? T("updateFailed"));
            },
            onError: (err: any) => toast.error(err?.response?.data?.error ?? T("updateFailed")),
      });

      const clarityMutation = useMutation({
            mutationFn: () => updateAnalyticsConfig(buildPayload({ analytics: { microsoft_clarity: clarityLocal } })),
            onSuccess: (res: any) => {
                  if (res?.success || res?.status) {
                        toast.success("Clarity settings updated.");
                        invalidate();
                  } else toast.error(res?.error ?? T("updateFailed"));
            },
            onError: (err: any) => toast.error(err?.response?.data?.error ?? T("updateFailed")),
      });

      const trackingMutation = useMutation({
            mutationFn: () => updateAnalyticsConfig(buildPayload({ tracking: trackingLocal })),
            onSuccess: (res: any) => {
                  if (res?.success || res?.status) {
                        toast.success(T("tracking.updateSuccess"));
                        invalidate();
                  } else toast.error(res?.error ?? T("updateFailed"));
            },
            onError: (err: any) => toast.error(err?.response?.data?.error ?? T("updateFailed")),
      });

      const metaMutation = useMutation({
            mutationFn: () => updateAnalyticsConfig(buildPayload({ meta: metaLocal })),
            onSuccess: (res: any) => {
                  if (res?.success || res?.status) {
                        toast.success(T("meta.updateSuccess"));
                        invalidate();
                  } else toast.error(res?.error ?? T("updateFailed"));
            },
            onError: (err: any) => toast.error(err?.response?.data?.error ?? T("updateFailed")),
      });

      /* ── loading ── */
      if (query.isLoading) {
            return (
                  <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                    key={i}
                                    className="h-20 animate-pulse rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                              />
                        ))}
                  </div>
            );
      }

      return (
            <div className="space-y-6">
                  {/* ── page header ── */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {T("pageTitle")}
                              </h2>
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {T("pageSubtitle")}
                              </p>
                        </div>
                        <button
                              type="button"
                              onClick={() => query.refetch()}
                              disabled={query.isFetching}
                              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                              <RefreshCw
                                    size={16}
                                    className={query.isFetching ? "animate-spin" : ""}
                              />
                              {T("refresh")}
                        </button>
                  </div>

                  {/* ── overview strip ── */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                              { label: T("overview.googleAnalytics"), on: gaLocal.enabled, icon: <BarChart3 size={18} /> },
                              { label: T("overview.tagManager"), on: gtmLocal.enabled, icon: <Tag size={18} /> },
                              { label: T("overview.facebookPixel"), on: fbLocal.enabled, icon: <Facebook size={18} /> },
                              { label: "Microsoft Clarity", on: clarityLocal.enabled, icon: <Monitor size={18} /> },
                        ].map((item) => (
                              <div
                                    key={item.label}
                                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
                              >
                                    <div
                                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.on
                                                ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                                                : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                                                }`}
                                    >
                                          {item.icon}
                                    </div>
                                    <div>
                                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                {item.label}
                                          </p>
                                          <p
                                                className={`text-sm font-semibold ${item.on
                                                      ? "text-green-600 dark:text-green-400"
                                                      : "text-gray-400 dark:text-gray-500"
                                                      }`}
                                          >
                                                {item.on ? T("active") : T("inactive")}
                                          </p>
                                    </div>
                              </div>
                        ))}
                  </div>

                  {/* ══════════════════════════
         GOOGLE ANALYTICS
         ══════════════════════════ */}
                  <SectionCard
                        icon={<BarChart3 size={20} />}
                        title={T("ga.title")}
                        subtitle={gaLocal.measurement_id || T("notConfigured")}
                        enabled={gaLocal.enabled}
                        onToggle={toggleGA}
                        toggleLoading={toggleKey === "ga" && instantToggleMutation.isPending}
                        dirty={gaDirty}
                        onUpdate={() => gaMutation.mutate()}
                        updating={gaMutation.isPending}
                        updateLabel={T("update")}
                        updatingLabel={T("updating")}
                  >
                        <div className="grid gap-4 sm:grid-cols-2">
                              <SettingInput
                                    label={T("ga.measurementId")}
                                    value={gaLocal.measurement_id}
                                    onChange={(v) => setGaLocal((p) => ({ ...p, measurement_id: v }))}
                                    placeholder={T("ga.measurementIdPlaceholder")}
                                    icon={<BarChart3 size={16} />}
                              />
                        </div>

                        <SubSection title={T("ga.configuration")}>
                              <ToggleRow
                                    label={T("ga.anonymizeIp")}
                                    description={T("ga.anonymizeIpDesc")}
                                    checked={gaLocal.config.anonymize_ip}
                                    onChange={(v) =>
                                          setGaLocal((p) => ({ ...p, config: { ...p.config, anonymize_ip: v } }))
                                    }
                                    icon={<Fingerprint size={16} />}
                              />
                              <ToggleRow
                                    label={T("ga.sendPageView")}
                                    description={T("ga.sendPageViewDesc")}
                                    checked={gaLocal.config.send_page_view}
                                    onChange={(v) =>
                                          setGaLocal((p) => ({ ...p, config: { ...p.config, send_page_view: v } }))
                                    }
                                    icon={<Eye size={16} />}
                              />
                              <ToggleRow
                                    label={T("ga.debugMode")}
                                    description={T("ga.debugModeDesc")}
                                    checked={gaLocal.config.debug_mode}
                                    onChange={(v) =>
                                          setGaLocal((p) => ({ ...p, config: { ...p.config, debug_mode: v } }))
                                    }
                                    icon={<FlaskConical size={16} />}
                              />
                        </SubSection>
                  </SectionCard>

                  {/* ══════════════════════════
         GOOGLE TAG MANAGER
         ══════════════════════════ */}
                  <SectionCard
                        icon={<Tag size={20} />}
                        title={T("gtm.title")}
                        subtitle={gtmLocal.gtm_id || T("notConfigured")}
                        enabled={gtmLocal.enabled}
                        onToggle={toggleGTM}
                        toggleLoading={toggleKey === "gtm" && instantToggleMutation.isPending}
                        dirty={gtmDirty}
                        onUpdate={() => gtmMutation.mutate()}
                        updating={gtmMutation.isPending}
                        updateLabel={T("update")}
                        updatingLabel={T("updating")}
                  >
                        <div className="grid gap-4 sm:grid-cols-2">
                              <SettingInput
                                    label={T("gtm.gtmId")}
                                    value={gtmLocal.gtm_id}
                                    onChange={(v) => setGtmLocal((p) => ({ ...p, gtm_id: v }))}
                                    placeholder={T("gtm.gtmIdPlaceholder")}
                                    icon={<Tag size={16} />}
                              />
                              <SettingInput
                                    label={T("gtm.authToken")}
                                    value={gtmLocal.auth}
                                    onChange={(v) => setGtmLocal((p) => ({ ...p, auth: v }))}
                                    placeholder={T("gtm.authTokenPlaceholder")}
                                    icon={<Key size={16} />}
                              />
                              <SettingInput
                                    label={T("gtm.previewEnv")}
                                    value={gtmLocal.preview}
                                    onChange={(v) => setGtmLocal((p) => ({ ...p, preview: v }))}
                                    placeholder={T("gtm.previewEnvPlaceholder")}
                                    icon={<Eye size={16} />}
                              />
                        </div>
                  </SectionCard>

                  {/* ══════════════════════════
         FACEBOOK PIXEL
         ══════════════════════════ */}
                  <SectionCard
                        icon={<Facebook size={20} />}
                        title={T("fb.title")}
                        subtitle={fbLocal.pixel_id || T("notConfigured")}
                        enabled={fbLocal.enabled}
                        onToggle={toggleFB}
                        toggleLoading={toggleKey === "fb" && instantToggleMutation.isPending}
                        dirty={fbDirty}
                        onUpdate={() => fbMutation.mutate()}
                        updating={fbMutation.isPending}
                        updateLabel={T("update")}
                        updatingLabel={T("updating")}
                  >
                        <div className="grid gap-4 sm:grid-cols-2">
                              <SettingInput
                                    label={T("fb.pixelId")}
                                    value={fbLocal.pixel_id}
                                    onChange={(v) => setFbLocal((p) => ({ ...p, pixel_id: v }))}
                                    placeholder={T("fb.pixelIdPlaceholder")}
                                    icon={<Facebook size={16} />}
                              />
                        </div>

                        {/* Advanced Matching */}
                        <SubSection title={T("fb.advancedMatching")}>
                              <ToggleRow
                                    label={T("fb.enableAdvancedMatching")}
                                    description={T("fb.enableAdvancedMatchingDesc")}
                                    checked={fbLocal.advanced_matching.enabled}
                                    onChange={(v) =>
                                          setFbLocal((p) => ({
                                                ...p,
                                                advanced_matching: { ...p.advanced_matching, enabled: v },
                                          }))
                                    }
                                    icon={<Users size={16} />}
                              />
                              {(
                                    [
                                          { key: "email", tKey: "fb.email", icon: <Mail size={16} /> },
                                          { key: "phone", tKey: "fb.phone", icon: <Phone size={16} /> },
                                          { key: "first_name", tKey: "fb.firstName", icon: <Users size={16} /> },
                                          { key: "last_name", tKey: "fb.lastName", icon: <Users size={16} /> },
                                          { key: "external_id", tKey: "fb.externalId", icon: <Fingerprint size={16} /> },
                                    ] as const
                              ).map((item) => (
                                    <ToggleRow
                                          key={item.key}
                                          label={T(item.tKey)}
                                          checked={fbLocal.advanced_matching[item.key as keyof typeof fbLocal.advanced_matching] as boolean}
                                          onChange={(v) =>
                                                setFbLocal((p) => ({
                                                      ...p,
                                                      advanced_matching: { ...p.advanced_matching, [item.key]: v },
                                                }))
                                          }
                                          icon={item.icon}
                                    />
                              ))}
                        </SubSection>

                        {/* Track Events */}
                        <SubSection title={T("fb.trackEvents")}>
                              {(
                                    [
                                          { key: "page_view", tKey: "fb.pageView", icon: <Eye size={16} /> },
                                          { key: "view_content", tKey: "fb.viewContent", icon: <Globe size={16} /> },
                                          { key: "add_to_cart", tKey: "fb.addToCart", icon: <ShoppingCart size={16} /> },
                                          { key: "initiate_checkout", tKey: "fb.initiateCheckout", icon: <CreditCard size={16} /> },
                                          { key: "purchase", tKey: "fb.purchase", icon: <CheckCircle2 size={16} /> },
                                          { key: "search", tKey: "fb.search", icon: <Search size={16} /> },
                                          { key: "lead", tKey: "fb.lead", icon: <MousePointerClick size={16} /> },
                                          { key: "complete_registration", tKey: "fb.completeRegistration", icon: <UserPlus size={16} /> },
                                    ] as const
                              ).map((ev) => (
                                    <ToggleRow
                                          key={ev.key}
                                          label={T(ev.tKey)}
                                          checked={fbLocal.track_events[ev.key as keyof typeof fbLocal.track_events]}
                                          onChange={(v) =>
                                                setFbLocal((p) => ({
                                                      ...p,
                                                      track_events: { ...p.track_events, [ev.key]: v },
                                                }))
                                          }
                                          icon={ev.icon}
                                    />
                              ))}
                        </SubSection>

                        {/* Conversion API */}
                        <SubSection title={T("fb.conversionApi")}>
                              <ToggleRow
                                    label={T("fb.enableConversionApi")}
                                    description={T("fb.enableConversionApiDesc")}
                                    checked={fbLocal.conversion_api.enabled}
                                    onChange={(v) =>
                                          setFbLocal((p) => ({
                                                ...p,
                                                conversion_api: { ...p.conversion_api, enabled: v },
                                          }))
                                    }
                                    icon={<Activity size={16} />}
                              />
                              <div className="grid gap-4 pt-3 sm:grid-cols-2">
                                    <SettingInput
                                          label={T("fb.accessToken")}
                                          value={fbLocal.conversion_api.access_token}
                                          onChange={(v) =>
                                                setFbLocal((p) => ({
                                                      ...p,
                                                      conversion_api: { ...p.conversion_api, access_token: v },
                                                }))
                                          }
                                          placeholder={T("fb.accessTokenPlaceholder")}
                                          type="password"
                                          icon={<Key size={16} />}
                                    />
                                    <SettingInput
                                          label={T("fb.testEventCode")}
                                          value={fbLocal.conversion_api.test_event_code}
                                          onChange={(v) =>
                                                setFbLocal((p) => ({
                                                      ...p,
                                                      conversion_api: { ...p.conversion_api, test_event_code: v },
                                                }))
                                          }
                                          placeholder={T("fb.testEventCodePlaceholder")}
                                          icon={<FlaskConical size={16} />}
                                    />
                              </div>
                        </SubSection>
                  </SectionCard>

                  {/* ══════════════════════════
         MICROSOFT CLARITY
         ══════════════════════════ */}
                  <SectionCard
                        icon={<Monitor size={20} />}
                        title="Microsoft Clarity"
                        subtitle={clarityLocal.project_id || T("notConfigured")}
                        enabled={clarityLocal.enabled}
                        onToggle={toggleClarity}
                        toggleLoading={toggleKey === "clarity" && instantToggleMutation.isPending}
                        dirty={clarityDirty}
                        onUpdate={() => clarityMutation.mutate()}
                        updating={clarityMutation.isPending}
                        updateLabel={T("update")}
                        updatingLabel={T("updating")}
                  >
                        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                              Microsoft Clarity is a free behavioural analytics tool that records session replays and heatmaps.
                              Your Project ID can be found in the Clarity dashboard under Settings → Overview.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                              <SettingInput
                                    label="Project ID"
                                    value={clarityLocal.project_id}
                                    onChange={(v) => setClarityLocal((p) => ({ ...p, project_id: v }))}
                                    placeholder="e.g. abcde12345"
                                    icon={<Monitor size={16} />}
                              />
                        </div>
                  </SectionCard>

                  {/* ══════════════════════════
         TRACKING BEHAVIOR
         ══════════════════════════ */}
                  <SectionCard
                        icon={<MousePointerClick size={20} />}
                        title={T("tracking.title")}
                        subtitle={T("tracking.subtitle")}
                        dirty={trackingDirty}
                        onUpdate={() => trackingMutation.mutate()}
                        updating={trackingMutation.isPending}
                        updateLabel={T("update")}
                        updatingLabel={T("updating")}
                  >
                        <ToggleRow
                              label={T("tracking.autoPageView")}
                              description={T("tracking.autoPageViewDesc")}
                              checked={trackingLocal.auto_page_view}
                              onChange={(v) => setTrackingLocal((p) => ({ ...p, auto_page_view: v }))}
                              icon={<Eye size={16} />}
                        />
                        <ToggleRow
                              label={T("tracking.trackScroll")}
                              description={T("tracking.trackScrollDesc")}
                              checked={trackingLocal.track_scroll}
                              onChange={(v) => setTrackingLocal((p) => ({ ...p, track_scroll: v }))}
                              icon={<Scroll size={16} />}
                        />
                        <ToggleRow
                              label={T("tracking.trackButtonClicks")}
                              description={T("tracking.trackButtonClicksDesc")}
                              checked={trackingLocal.track_button_clicks}
                              onChange={(v) => setTrackingLocal((p) => ({ ...p, track_button_clicks: v }))}
                              icon={<MousePointer size={16} />}
                        />
                        <ToggleRow
                              label={T("tracking.trackSearch")}
                              description={T("tracking.trackSearchDesc")}
                              checked={trackingLocal.track_search}
                              onChange={(v) => setTrackingLocal((p) => ({ ...p, track_search: v }))}
                              icon={<Search size={16} />}
                        />
                  </SectionCard>

                  {/* ══════════════════════════
         SITE META
         ══════════════════════════ */}
                  <SectionCard
                        icon={<Settings2 size={20} />}
                        title={T("meta.title")}
                        subtitle={T("meta.subtitle")}
                        dirty={metaDirty}
                        onUpdate={() => metaMutation.mutate()}
                        updating={metaMutation.isPending}
                        updateLabel={T("update")}
                        updatingLabel={T("updating")}
                  >
                        <div className="grid gap-4 sm:grid-cols-3">
                              <SettingInput
                                    label={T("meta.siteName")}
                                    value={metaLocal.site_name}
                                    onChange={(v) => setMetaLocal((p) => ({ ...p, site_name: v }))}
                                    placeholder={T("meta.siteNamePlaceholder")}
                                    icon={<Globe size={16} />}
                              />
                              <SettingInput
                                    label={T("meta.currency")}
                                    value={metaLocal.currency}
                                    onChange={(v) => setMetaLocal((p) => ({ ...p, currency: v }))}
                                    placeholder={T("meta.currencyPlaceholder")}
                              />
                              <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                          {T("meta.environment")}
                                    </label>
                                    <select
                                          value={metaLocal.environment}
                                          onChange={(e) => setMetaLocal((p) => ({ ...p, environment: e.target.value }))}
                                          className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400 dark:focus:bg-gray-800 transition-colors"
                                    >
                                          <option value="production">{T("meta.production")}</option>
                                          <option value="staging">{T("meta.staging")}</option>
                                          <option value="development">{T("meta.development")}</option>
                                    </select>
                              </div>
                        </div>
                  </SectionCard>
            </div>
      );
}
