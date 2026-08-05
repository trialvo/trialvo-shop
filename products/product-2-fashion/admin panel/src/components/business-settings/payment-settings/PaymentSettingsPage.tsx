// src/components/settings/payment/PaymentSettingsPage.tsx
"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Settings } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Switch from "@/components/form/switch/Switch";

import PaymentGatewayModal from "./PaymentGatewayModal";
import { PAYMENT_PROVIDER_DEFS } from "./providerDefs";
import type { PaymentProvider, PaymentProviderConfigCard } from "./types";

import {
  getPaymentSystemConfig,
  updatePaymentProviderConfig,
} from "@/api/payment-config.api";
import { cn } from "@/lib/utils";

function stampNow(): string {
  const d = new Date();
  return d.toLocaleString();
}

function providerMeta(provider: PaymentProvider) {
  return PAYMENT_PROVIDER_DEFS.find((d) => d.provider === provider);
}

function safeString(v: any) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export default function PaymentSettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(stampNow());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<PaymentProvider | null>(null);
  const [editingInitial, setEditingInitial] =
    useState<PaymentProviderConfigCard | null>(null);

  const paymentQuery = useQuery({
    queryKey: ["systemConfig", "payment"],
    queryFn: () => getPaymentSystemConfig(),
    retry: 1,
  });

  const cards: PaymentProviderConfigCard[] = useMemo(() => {
    const payment = paymentQuery.data?.payment ?? {};
    const defaultProvider = safeString(
      payment?.default?.config?.PAYMENT_DEFAULT_PROVIDER,
    ) as PaymentProvider | "";

    const providers: PaymentProvider[] = [
      "bkash",
      "sslcommerz",
      "shurjopay",
      "nagad",
      "rocket",
      "cod",
    ];

    return providers
      .map((p) => {
        const def = providerMeta(p);
        const node = payment?.[p] ?? {};
        const cfg = node?.config ?? {};
        const is_active = Boolean(node?.is_active);

        const gatewayKey = def?.common.gateway_name ?? "";
        const gateway_name = safeString(cfg?.[gatewayKey] ?? "");

        const type = safeString(cfg?.[def?.common.type ?? ""] ?? "");
        const note = safeString(cfg?.[def?.common.note ?? ""] ?? "");

        const envRaw =
          def?.common.env && def.common.env.trim()
            ? safeString(cfg?.[def.common.env] ?? "sandbox")
            : "";
        const env = envRaw || "sandbox";

        return {
          provider: p,
          is_active,
          config: cfg,
          defaultProvider: (defaultProvider || null) as any,
          isDefault: defaultProvider === p,
          gateway_name: gateway_name || def?.title || p,
          type,
          note,
          env,
        };
      })
      .filter(Boolean);
  }, [paymentQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;

    return cards.filter((c) => {
      const meta = providerMeta(c.provider);
      return (
        safeString(c.provider).toLowerCase().includes(q) ||
        safeString(meta?.title).toLowerCase().includes(q) ||
        safeString(c.gateway_name).toLowerCase().includes(q) ||
        safeString(c.type).toLowerCase().includes(q) ||
        safeString(c.env).toLowerCase().includes(q)
      );
    });
  }, [cards, search]);

  const invalidate = () =>
    qc
      .invalidateQueries({ queryKey: ["systemConfig", "payment"] })
      .catch(() => undefined);

  const toggleMutation = useMutation({
    mutationFn: (payload: { provider: PaymentProvider; status: boolean }) =>
      updatePaymentProviderConfig(payload.provider, { status: payload.status }),
    onSuccess: (res: any) => {
      // ✅ supports both {success:true} and {status:true}
      if (res?.success === true || res?.status === true) {
        toast.success(t("businessSettings.payment.statusUpdated"));
        invalidate();
        return;
      }
      toast.error(res?.error ?? res?.message ?? t("businessSettings.payment.failedUpdate"));
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to update";
      toast.error(msg);
    },
  });

  const openEdit = (row: PaymentProviderConfigCard) => {
    setEditingProvider(row.provider);
    setEditingInitial(row);
    setModalOpen(true);
  };

  const doRefresh = () => {
    setRefreshedAt(stampNow());
    paymentQuery.refetch().catch(() => undefined);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {paymentQuery.isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[180px] animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))
          : filtered.map((g) => {
            const meta = providerMeta(g.provider);
            const logo = meta?.logoText ?? "PG";

            return (
              <div
                key={g.provider}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-extrabold text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                      {logo}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                        {g.gateway_name || meta?.title || g.provider}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {t("businessSettings.payment.provider")}:{" "}
                        <span className="font-semibold">
                          {meta?.title ?? g.provider}
                        </span>
                      </p>
                    </div>
                  </div>

                  <Switch
                    key={`pay-st-${g.provider}-${g.is_active}`}
                    label=""
                    defaultChecked={g.is_active}
                    disabled={toggleMutation.isPending}
                    onChange={(checked) =>
                      toggleMutation.mutate({
                        provider: g.provider,
                        status: checked,
                      })
                    }
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("businessSettings.payment.environment")}:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {g.provider === "cod" ? "—" : g.env || "sandbox"}
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {meta?.category ?? "Payment"}
                    </span>

                    {g.isDefault ? (
                      <span className="inline-flex items-center rounded-lg bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-300">
                        {t("businessSettings.payment.default")}
                      </span>
                    ) : null}
                  </div>

                  {g.note && g.provider !== "cod" ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {g.note}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-600",
                    )}
                    onClick={() => openEdit(g)}
                  >
                    <Settings size={16} />
                    {t("businessSettings.payment.viewSettings")}
                  </button>
                </div>
              </div>
            );
          })}

        {!paymentQuery.isLoading && filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            {t("businessSettings.payment.noGateway")}
          </div>
        ) : null}
      </div>

      <PaymentGatewayModal
        open={modalOpen}
        provider={editingProvider}
        initial={editingInitial}
        onClose={() => {
          setModalOpen(false);
          setEditingProvider(null);
          setEditingInitial(null);
        }}
        onSaved={() => {
          invalidate();
          setRefreshedAt(stampNow());
          setModalOpen(false);
          setEditingProvider(null);
          setEditingInitial(null);
        }}
      />
    </div>
  );
}
