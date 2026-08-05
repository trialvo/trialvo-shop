// src/components/business-settings/service-settings/ServiceSettingsPage.tsx
"use client";

import React, { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  KeyRound,
  KeySquare,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  RotateCcw,
  Settings,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Button from "@/components/ui/button/Button";
import Radio from "@/components/form/input/Radio";
import Switch from "@/components/form/switch/Switch";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/utils/toPublicUrl";

import { getAdmins, type AdminListResponse } from "@/api/admin.api";
import {
  getEmailSystemConfig,
  getSmsSystemConfig,
  getSmsBalance,
  setActiveSmsProvider,
} from "@/api/service-config.api";

import type { EmailCard, SmsProviderCard, SmsProvider } from "./types";
import { smsProviderTitle } from "./types";

import SmsConfigModal from "./SmsConfigModal";
import EmailConfigModal from "./EmailConfigModal";
import TestSmsModal from "./TestSmsModal";

type AuthChannel = "email_sms" | "none";
type ResetChannel = "email" | "sms" | "both";
type OrderVerifyPolicy = "sms_required" | "allow";
type OrderNotifyChannel = { email: boolean; sms: boolean };

type PermissionOption = {
  value: string;
  label: string;
  hint: string;
};

function safeString(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function formatBalance(data: any) {
  if (!data?.success) return "—";
  const bal = typeof data.balance === "number" ? data.balance : Number(data.balance);
  if (!Number.isFinite(bal)) return "—";
  const unit = safeString(data.unit) || "BDT";
  return `${bal} ${unit}`;
}

// Compact inline error with retry, shown when a settings query fails instead
// of silently rendering an empty/placeholder card.
function InlineError({ label, onRetry, retryLabel }: { label: string; onRetry: () => void; retryLabel: string }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-error-200 bg-error-50 p-6 text-center dark:border-error-900/40 dark:bg-error-500/10"
    >
      <AlertTriangle size={20} className="text-error-600 dark:text-error-300" />
      <p className="text-sm font-medium text-error-700 dark:text-error-200">{label}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-lg border border-error-300 bg-white px-3 py-1.5 text-xs font-semibold text-error-700 hover:bg-error-50 dark:border-error-900/40 dark:bg-gray-900 dark:text-error-200"
      >
        <RotateCcw size={13} />
        {retryLabel}
      </button>
    </div>
  );
}

// Status pill that pairs colour with an icon + text so status is never conveyed
// by colour alone (accessibility).
function StatusPill({ active, activeLabel, inactiveLabel }: { active: boolean; activeLabel: string; inactiveLabel: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold",
        active
          ? "bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-300"
          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      )}
    >
      {active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

function buildSmsCard(provider: SmsProvider, node: any): SmsProviderCard {
  const cfg = node?.config ?? {};
  const is_active = Boolean(node?.is_active);

  const upper = provider === "alphasms" ? "ALPHA_SMS" : "BULK_SMS";

  const apiKey = safeString(cfg?.[`${upper}_API_KEY`]);
  const senderId = safeString(cfg?.[`${upper}_SENDER_ID`]);
  const url = safeString(cfg?.[`${upper}_URL`]);

  return {
    provider,
    is_active,
    config: cfg,
    gateway_name: smsProviderTitle(provider),
    apiKey,
    senderId,
    url,
  };
}

export default function ServiceSettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"services" | "permissions">(
    "services",
  );

  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsEditing, setSmsEditing] = useState<SmsProviderCard | null>(null);

  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [testSmsOpen, setTestSmsOpen] = useState(false);

  const [authMethod, setAuthMethod] = useState<AuthChannel>("email_sms");
  const [resetMethod, setResetMethod] = useState<ResetChannel>("both");
  const [orderVerifyPolicy, setOrderVerifyPolicy] =
    useState<OrderVerifyPolicy>("sms_required");
  const [orderNotifyChannel, setOrderNotifyChannel] =
    useState<OrderNotifyChannel>({ email: true, sms: false });

  // Admin order notification — per-admin toggles
  const [adminNotifyPrefs, setAdminNotifyPrefs] = useState<
    Record<number, { sms: boolean; email: boolean }>
  >({});

  const adminsQuery = useQuery({
    queryKey: ["admins", "notifyList"],
    queryFn: () => getAdmins({ limit: 100 }),
    retry: 1,
  });

  const adminList = adminsQuery.data?.data ?? [];

  const toggleAdminPref = useCallback(
    (id: number, channel: "sms" | "email", checked: boolean) => {
      setAdminNotifyPrefs((prev) => ({
        ...prev,
        [id]: { ...prev[id], [channel]: checked },
      }));
    },
    [],
  );

  const adminNotifySummary = useMemo(() => {
    let smsCount = 0;
    let emailCount = 0;
    for (const prefs of Object.values(adminNotifyPrefs)) {
      if (prefs.sms) smsCount++;
      if (prefs.email) emailCount++;
    }
    return { smsCount, emailCount };
  }, [adminNotifyPrefs]);

  const permissionTabs = [
    { id: "services", label: t("businessSettings.service.tabServices"), icon: MessageSquareText },
    { id: "permissions", label: t("businessSettings.service.tabPermissions"), icon: ShieldCheck },
  ] as const;

  const authOptions: PermissionOption[] = [
    {
      value: "email_sms",
      label: t("businessSettings.service.authEmailSms"),
      hint: t("businessSettings.service.authEmailSmsHint"),
    },
    {
      value: "none",
      label: t("businessSettings.service.authNone"),
      hint: t("businessSettings.service.authNoneHint"),
    },
  ];

  const resetOptions: PermissionOption[] = [
    {
      value: "email",
      label: t("businessSettings.service.resetEmail"),
      hint: t("businessSettings.service.resetEmailHint"),
    },
    {
      value: "sms",
      label: t("businessSettings.service.resetSms"),
      hint: t("businessSettings.service.resetSmsHint"),
    },
    {
      value: "both",
      label: t("businessSettings.service.resetBoth"),
      hint: t("businessSettings.service.resetBothHint"),
    },
  ];

  const verifyOptions: PermissionOption[] = [
    {
      value: "sms_required",
      label: t("businessSettings.service.smsRequired"),
      hint: t("businessSettings.service.smsRequiredHint"),
    },
    {
      value: "allow",
      label: t("businessSettings.service.allowWithout"),
      hint: t("businessSettings.service.allowWithoutHint"),
    },
  ];

  const resetPermissionDefaults = () => {
    setAuthMethod("email_sms");
    setResetMethod("both");
    setOrderVerifyPolicy("sms_required");
    setOrderNotifyChannel({ email: true, sms: false });
    setAdminNotifyPrefs({});
    toast.success(t("businessSettings.service.permissionReset"));
  };

  const smsQuery = useQuery({
    queryKey: ["systemConfig", "sms"],
    queryFn: () => getSmsSystemConfig(),
    retry: 1,
  });

  const emailQuery = useQuery({
    queryKey: ["systemConfig", "email"],
    queryFn: () => getEmailSystemConfig(),
    retry: 1,
  });

  const alphaBalanceQuery = useQuery({
    queryKey: ["smsBalance", "alphasms"],
    queryFn: () => getSmsBalance("alphasms"),
    retry: 1,
  });

  const bulkBalanceQuery = useQuery({
    queryKey: ["smsBalance", "bulksms"],
    queryFn: () => getSmsBalance("bulksms"),
    retry: 1,
  });

  const smsCards = useMemo(() => {
    const sms = smsQuery.data?.sms ?? {};
    const providers: SmsProvider[] = ["alphasms", "bulksms"];
    return providers.map((p) => buildSmsCard(p, sms?.[p] ?? {}));
  }, [smsQuery.data]);

  const smsDefaultProvider = useMemo(() => {
    const sms = smsQuery.data?.sms ?? {};
    const p = safeString(sms?.default?.config?.SMS_ACTIVE_PROVIDER) as SmsProvider | "";
    return p || null;
  }, [smsQuery.data]);

  const emailCard: EmailCard | null = useMemo(() => {
    const email = emailQuery.data?.email ?? {};
    const node = email?.custom_smtp ?? null;
    if (!node) return null;

    const cfg = node?.config ?? {};
    return {
      is_active: Boolean(node?.is_active),
      config: cfg,
      host: safeString(cfg?.MAIL_HOST),
      port: safeString(cfg?.MAIL_PORT),
      user: safeString(cfg?.MAIL_USER),
      pass: safeString(cfg?.MAIL_PASS),
    };
  }, [emailQuery.data]);

  const invalidateAll = () =>
    Promise.allSettled([
      qc.invalidateQueries({ queryKey: ["systemConfig", "sms"] }),
      qc.invalidateQueries({ queryKey: ["systemConfig", "email"] }),
      qc.invalidateQueries({ queryKey: ["smsBalance", "alphasms"] }),
      qc.invalidateQueries({ queryKey: ["smsBalance", "bulksms"] }),
    ]).then(() => undefined);

  const activeProviderMutation = useMutation({
    mutationFn: (provider: SmsProvider) => setActiveSmsProvider({ provider }),
    onSuccess: (res: any) => {
      if (res?.success === true || res?.status === true) {
        toast.success(t("businessSettings.service.activeProviderUpdated"));
        invalidateAll().catch(() => undefined);
        return;
      }
      toast.error(
        res?.error ?? res?.message ?? t("businessSettings.service.failedActiveUpdate"),
      );
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        t("businessSettings.service.failedActiveUpdate");
      toast.error(msg);
    },
  });

  const openSmsEdit = (card: SmsProviderCard) => {
    setSmsEditing(card);
    setSmsModalOpen(true);
  };

  const balanceFor = (provider: SmsProvider) => {
    return provider === "alphasms"
      ? formatBalance(alphaBalanceQuery.data)
      : formatBalance(bulkBalanceQuery.data);
  };

  const isRefreshing =
    smsQuery.isFetching ||
    emailQuery.isFetching ||
    alphaBalanceQuery.isFetching ||
    bulkBalanceQuery.isFetching ||
    activeProviderMutation.isPending;

  const renderOptions = (
    name: string,
    value: string,
    options: PermissionOption[],
    onChange: (v: string) => void,
  ) => {
    const grid = options.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

    return (
      <div className={cn("grid grid-cols-1 gap-3", grid)}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <div
              key={`${name}-${opt.value}`}
              className={cn(
                "rounded-xl border p-3 transition",
                active
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200"
                  : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
              )}
            >
              <Radio
                id={`${name}-${opt.value}`}
                name={name}
                value={opt.value}
                checked={active}
                label={opt.label}
                onChange={onChange}
                className="w-full"
              />
              <p className="mt-1 pl-8 text-xs text-gray-500 dark:text-gray-400">
                {opt.hint}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="rounded-[6px] border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {permissionTabs.map((t) => {
            const active = activeTab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-[6px] px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm",
                  active
                    ? "bg-brand-500 text-white shadow-theme-xs"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
                )}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "services" ? (
        <>
          {/* SMS Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                  <MessageSquareText size={18} />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("businessSettings.service.smsService")}</h3>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {t("businessSettings.service.smsServiceDesc")}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {t("businessSettings.service.activeProvider")}:{" "}
                      <span className="ml-1 font-bold">
                        {smsDefaultProvider ? smsProviderTitle(smsDefaultProvider) : "—"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setTestSmsOpen(true)}
                  disabled={smsQuery.isLoading}
                >
                  {t("businessSettings.service.testSmsBtn")}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    invalidateAll().catch(() => undefined);
                    toast.success(t("businessSettings.service.refreshed"));
                  }}
                  disabled={isRefreshing}
                >
                  {t("businessSettings.service.refresh")}
                </Button>
              </div>
            </div>

            {smsQuery.isError ? (
              <div className="mt-5">
                <InlineError
                  label={t("businessSettings.service.loadFailed")}
                  retryLabel={t("businessSettings.service.retry")}
                  onRetry={() => smsQuery.refetch()}
                />
              </div>
            ) : (
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {smsQuery.isLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[180px] animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                  />
                ))
                : smsCards.map((c) => {
                  const isDefault = smsDefaultProvider === c.provider;

                  return (
                    <div
                      key={c.provider}
                      className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                            {c.gateway_name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                            Provider: <span className="font-semibold">{c.provider}</span>
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <StatusPill
                            active={c.is_active}
                            activeLabel={t("businessSettings.service.enabled")}
                            inactiveLabel={t("businessSettings.service.disabled")}
                          />

                          {isDefault ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-300">
                              <CheckCircle2 size={12} />
                              {t("businessSettings.service.active")}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("businessSettings.service.balance")}:{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {balanceFor(c.provider)}
                          </span>
                        </p>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("businessSettings.service.senderId")}:{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {c.senderId || "—"}
                          </span>
                        </p>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t("businessSettings.service.baseUrl")}:{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {c.url || "—"}
                          </span>
                        </p>
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-600",
                          )}
                          onClick={() => openSmsEdit(c)}
                        >
                          <Settings size={16} />
                          {t("businessSettings.service.viewSettings")}
                        </button>

                        {/* ✅ Set Active Provider toggle */}
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900 sm:w-[240px]">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              {t("businessSettings.service.setActiveProvider")}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                              {isDefault ? t("businessSettings.service.currentlyActive") : t("businessSettings.service.makeActive")}
                            </p>
                          </div>

                          <Switch
                            key={`sms-active-${c.provider}-${String(isDefault)}`}
                            label=""
                            defaultChecked={isDefault}
                            disabled={activeProviderMutation.isPending || smsQuery.isLoading}
                            onChange={(checked) => {
                              if (!checked) {
                                toast(t("businessSettings.service.deactivateHint"));
                                return;
                              }
                              activeProviderMutation.mutate(c.provider);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            )}
          </div>

          {/* Email Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                  <Mail size={18} />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t("businessSettings.service.emailService")}</h3>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                    {t("businessSettings.service.emailServiceDesc")}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusPill
                      active={Boolean(emailCard?.is_active)}
                      activeLabel={t("businessSettings.service.active")}
                      inactiveLabel={t("businessSettings.service.inactive")}
                    />

                    <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {t("businessSettings.service.providerCustomSmtp")}
                    </span>
                  </div>
                </div>
              </div>

              <Button onClick={() => setEmailModalOpen(true)} disabled={emailQuery.isLoading || !emailCard}>
                {t("businessSettings.service.viewSettings")}
              </Button>
            </div>

            {emailQuery.isError ? (
              <div className="mt-5">
                <InlineError
                  label={t("businessSettings.service.loadFailed")}
                  retryLabel={t("businessSettings.service.retry")}
                  onRetry={() => emailQuery.refetch()}
                />
              </div>
            ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {emailQuery.isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[84px] animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                  />
                ))
              ) : emailCard ? (
                <>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">MAIL_HOST</p>
                    <p className="mt-1 break-all text-sm font-semibold text-gray-900 dark:text-white">
                      {emailCard.host || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">MAIL_USER</p>
                    <p className="mt-1 break-all text-sm font-semibold text-gray-900 dark:text-white">
                      {emailCard.user || "—"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="col-span-full rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                  {t("businessSettings.service.emailNotFound")}
                </div>
              )}
            </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                <ShieldCheck size={18} />
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("businessSettings.service.permissionRules")}
                </h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {t("businessSettings.service.permissionRulesDesc")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-5">
            <div className="col-span-12 lg:col-span-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-brand-500 dark:border-gray-800 dark:bg-gray-900">
                    <KeyRound size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("businessSettings.service.authMethod")}
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {t("businessSettings.service.authMethodDesc")}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {renderOptions("auth-method", authMethod, authOptions, (v) =>
                    setAuthMethod(v as AuthChannel),
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-brand-500 dark:border-gray-800 dark:bg-gray-900">
                    <KeySquare size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("businessSettings.service.forgotPassword")}
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {t("businessSettings.service.forgotPasswordDesc")}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {renderOptions("reset-method", resetMethod, resetOptions, (v) =>
                    setResetMethod(v as ResetChannel),
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-brand-500 dark:border-gray-800 dark:bg-gray-900">
                    <Phone size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("businessSettings.service.orderVerification")}
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {t("businessSettings.service.orderVerificationDesc")}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  {renderOptions(
                    "order-verify",
                    orderVerifyPolicy,
                    verifyOptions,
                    (v) => setOrderVerifyPolicy(v as OrderVerifyPolicy),
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-brand-500 dark:border-gray-800 dark:bg-gray-900">
                    <Bell size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("businessSettings.service.orderNotifications")}
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {t("businessSettings.service.orderNotificationsDesc")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {t("businessSettings.service.emailNotification")}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {t("businessSettings.service.emailNotificationHint")}
                        </p>
                      </div>
                      <Switch
                        label=""
                        checked={orderNotifyChannel.email}
                        onChange={(checked) =>
                          setOrderNotifyChannel((prev) => ({
                            ...prev,
                            email: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {t("businessSettings.service.smsNotification")}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {t("businessSettings.service.smsNotificationHint")}
                        </p>
                      </div>
                      <Switch
                        label=""
                        checked={orderNotifyChannel.sms}
                        onChange={(checked) =>
                          setOrderNotifyChannel((prev) => ({
                            ...prev,
                            sms: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Order Notification */}
            <div className="col-span-12">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-brand-500 dark:border-gray-800 dark:bg-gray-900">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("businessSettings.service.adminOrderNotify")}
                    </h4>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {t("businessSettings.service.adminOrderNotifyDesc")}
                    </p>
                  </div>
                </div>

                {/* Admin list */}
                <div className="mt-5">
                  {adminsQuery.isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                      <Loader2 size={16} className="animate-spin" />
                      {t("businessSettings.service.adminListLoading")}
                    </div>
                  ) : adminsQuery.isError ? (
                    <InlineError
                      label={t("businessSettings.service.loadFailed")}
                      retryLabel={t("businessSettings.service.retry")}
                      onRetry={() => adminsQuery.refetch()}
                    />
                  ) : adminList.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-500">
                      {t("businessSettings.service.adminListEmpty")}
                    </p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                      {/* Table header */}
                      <div className="grid grid-cols-12 gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                        <div className="col-span-4">{t("businessSettings.service.adminColName")}</div>
                        <div className="col-span-3">{t("businessSettings.service.adminColEmail")}</div>
                        <div className="col-span-3">{t("businessSettings.service.adminColPhone")}</div>
                        <div className="col-span-1 text-center">{t("businessSettings.service.adminColSms")}</div>
                        <div className="col-span-1 text-center">{t("businessSettings.service.adminColEmail2")}</div>
                      </div>

                      {/* Admin rows */}
                      {adminList.map((admin) => {
                        const prefs = adminNotifyPrefs[admin.id] ?? { sms: false, email: false };
                        const hasPhone = !!admin.phone;
                        const hasEmail = !!admin.email;
                        const fullName = [admin.first_name, admin.last_name].filter(Boolean).join(" ") || admin.email;
                        const initials = (
                          (admin.first_name?.[0] ?? "") + (admin.last_name?.[0] ?? "")
                        ).toUpperCase() || "?";

                        return (
                          <div
                            key={admin.id}
                            className="grid grid-cols-12 items-center gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02]"
                          >
                            {/* Name + Avatar */}
                            <div className="col-span-4 flex items-center gap-3 min-w-0">
                              {admin.profile_img_path ? (
                                <img
                                  src={toPublicUrl(admin.profile_img_path)}
                                  alt={fullName}
                                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/20 dark:text-brand-300">
                                  {initials}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                  {fullName}
                                </p>
                                {admin.roles?.[0] && (
                                  <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                                    {admin.roles[0]}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Email */}
                            <div className="col-span-3 min-w-0">
                              {hasEmail ? (
                                <p className="flex items-center gap-1.5 truncate text-sm text-gray-700 dark:text-gray-300">
                                  <Mail size={12} className="shrink-0 text-gray-400" />
                                  {admin.email}
                                </p>
                              ) : (
                                <p className="text-xs italic text-gray-400 dark:text-gray-600">
                                  {t("businessSettings.service.adminNoEmail")}
                                </p>
                              )}
                            </div>

                            {/* Phone */}
                            <div className="col-span-3 min-w-0">
                              {hasPhone ? (
                                <p className="flex items-center gap-1.5 truncate text-sm text-gray-700 dark:text-gray-300">
                                  <Phone size={12} className="shrink-0 text-gray-400" />
                                  {admin.phone}
                                </p>
                              ) : (
                                <p className="text-xs italic text-gray-400 dark:text-gray-600">
                                  {t("businessSettings.service.adminNoPhone")}
                                </p>
                              )}
                            </div>

                            {/* SMS toggle */}
                            <div className="col-span-1 flex justify-center">
                              <Switch
                                label=""
                                checked={prefs.sms}
                                onChange={(checked) => toggleAdminPref(admin.id, "sms", checked)}
                                disabled={!hasPhone}
                              />
                            </div>

                            {/* Email toggle */}
                            <div className="col-span-1 flex justify-center">
                              <Switch
                                label=""
                                checked={prefs.email}
                                onChange={(checked) => toggleAdminPref(admin.id, "email", checked)}
                                disabled={!hasEmail}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Summary */}
                {adminList.length > 0 && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                    {adminNotifySummary.smsCount > 0 && adminNotifySummary.emailCount > 0
                      ? t("businessSettings.service.adminNotifyBoth", {
                        sms: adminNotifySummary.smsCount,
                        email: adminNotifySummary.emailCount,
                      })
                      : adminNotifySummary.smsCount > 0
                        ? t("businessSettings.service.adminNotifySmsOnly", { count: adminNotifySummary.smsCount })
                        : adminNotifySummary.emailCount > 0
                          ? t("businessSettings.service.adminNotifyEmailOnly", { count: adminNotifySummary.emailCount })
                          : t("businessSettings.service.adminNotifyDisabled")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Honest note: these rules are UI preview only until a backend
              persistence endpoint exists. Avoids falsely claiming a save. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <AlertTriangle size={13} className="shrink-0 text-warning-500" />
              {t("businessSettings.service.permissionPreviewNote")}
            </p>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={resetPermissionDefaults}>
                {t("businessSettings.service.resetDefaults")}
              </Button>
              <Button
                onClick={() =>
                  toast(t("businessSettings.service.permissionNotPersisted"), { icon: "ℹ️" })
                }
                className="min-w-[160px]"
              >
                {t("businessSettings.service.saveChanges")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SmsConfigModal
        open={smsModalOpen}
        initial={smsEditing}
        defaultProvider={smsDefaultProvider}
        onClose={() => {
          setSmsModalOpen(false);
          setSmsEditing(null);
        }}
        onSaved={() => {
          invalidateAll().catch(() => undefined);
          setSmsModalOpen(false);
          setSmsEditing(null);
        }}
      />

      <EmailConfigModal
        open={emailModalOpen}
        initial={emailCard}
        onClose={() => setEmailModalOpen(false)}
        onSaved={() => {
          invalidateAll().catch(() => undefined);
          setEmailModalOpen(false);
        }}
      />

      <TestSmsModal
        open={testSmsOpen}
        activeProviderLabel={
          smsDefaultProvider ? smsProviderTitle(smsDefaultProvider) : "Unknown"
        }
        onClose={() => setTestSmsOpen(false)}
      />
    </div>
  );
}
