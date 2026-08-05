// src/components/business-settings/currier-settings/CurrierSettingsPage.tsx

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCcw, Search, Settings } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";

import { COURIER_PROVIDER_DEFS } from "./providerDefs";
import CurrierModal from "./CurrierModal";
import type { CourierProvider, CourierProviderConfigCard } from "./types";

import {
  getCourierSystemConfig,
  setDefaultCourier,
  updateCourierProviderConfig,
} from "@/api/courier-config.api";
import { cn } from "@/lib/utils";
import { toPublicUrl } from "@/config/env";

function formatHeaderTime(d: Date): string {
  const month = d.toLocaleString("en-US", { month: "long" });
  const day = d.getDate();
  const year = d.getFullYear();
  const time = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${month} ${day}, ${year} at ${time}`;
}

function safeStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

function isCourierProvider(v: string): v is CourierProvider {
  return COURIER_PROVIDER_DEFS.some((d) => d.provider === v);
}

export default function CurrierSettingsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [refreshedAt, setRefreshedAt] = useState<Date>(new Date());
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<CourierProvider | null>(null);
  const [editingInitial, setEditingInitial] =
    useState<CourierProviderConfigCard | null>(null);

  const courierQuery = useQuery({
    queryKey: ["systemConfig", "courier"],
    queryFn: () => getCourierSystemConfig(),
    retry: 1,
  });

  const invalidate = () =>
    qc
      .invalidateQueries({ queryKey: ["systemConfig", "courier"] })
      .catch(() => undefined);

  const cards: CourierProviderConfigCard[] = useMemo(() => {
    const courier = courierQuery.data?.courier ?? {};

    const rawDefault = safeStr(
      (courier as any)?.default?.config?.COURIER_DEFAULT_PROVIDER
    ).trim();
    const defaultProvider: CourierProvider | null =
      rawDefault && isCourierProvider(rawDefault) ? rawDefault : null;

    return COURIER_PROVIDER_DEFS.map((def) => {
      const node = (courier as any)?.[def.provider] ?? {};
      const cfg = (node?.config ?? {}) as Record<string, any>;
      const common = def.common;

      const base_url = safeStr(cfg?.[common.base_url] ?? "");
      const description = safeStr(cfg?.[common.description] ?? "");
      const note = safeStr(cfg?.[common.note] ?? "");
      const imagePath = safeStr(cfg?.[common.image] ?? "");

      return {
        provider: def.provider,
        is_active: Boolean(node?.is_active),
        config: cfg,
        defaultProvider,
        isDefault: defaultProvider === def.provider,
        base_url,
        description,
        note,
        imagePath,
      };
    });
  }, [courierQuery.data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;

    return cards.filter((c) => {
      const meta = COURIER_PROVIDER_DEFS.find((d) => d.provider === c.provider);
      return (
        safeStr(c.provider).toLowerCase().includes(q) ||
        safeStr(meta?.title).toLowerCase().includes(q) ||
        safeStr(c.base_url).toLowerCase().includes(q) ||
        safeStr(c.description).toLowerCase().includes(q) ||
        safeStr(c.note).toLowerCase().includes(q)
      );
    });
  }, [cards, search]);

  const toggleMutation = useMutation({
    mutationFn: (payload: { provider: CourierProvider; status: boolean }) => {
      const fd = new FormData();
      fd.append("status", String(Boolean(payload.status)));
      // fd.append("setdefault", "false");
      // fd.append("setnull", "false");
      return updateCourierProviderConfig(payload.provider, fd);
    },
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success(t("businessSettings.currier.statusUpdated"));
        invalidate();
        return;
      }
      toast.error(res?.error ?? res?.message ?? t("businessSettings.currier.failedUpdate"));
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to update";
      toast.error(msg);
    },
  });

  const defaultMutation = useMutation({
    mutationFn: (p: CourierProvider) => setDefaultCourier(p),
    onSuccess: (res: any) => {
      if (res?.success === true) {
        toast.success(t("businessSettings.currier.defaultUpdated"));
        invalidate();
        return;
      }
      toast.error(res?.error ?? res?.message ?? t("businessSettings.currier.failedDefault"));
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ??
        err?.response?.data?.message ??
        "Failed to update default";
      toast.error(msg);
    },
  });

  const openEdit = (row: CourierProviderConfigCard) => {
    setEditingProvider(row.provider);
    setEditingInitial(row);
    setModalOpen(true);
  };

  const doRefresh = async () => {
    setRefreshedAt(new Date());
    try {
      await courierQuery.refetch();
    } catch {
      toast.error(t("businessSettings.currier.failedRefresh"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Input
            startIcon={<Search size={16} className="text-gray-400" />}
            className="pl-9"
            placeholder={t("common.search")}
            value={search}
            onChange={(e) => setSearch(String(e.target.value))}
          />
        </div>
      </div>

      {courierQuery.isError ? (
        <div className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700 dark:border-error-900/40 dark:bg-error-500/10 dark:text-error-300">
          {t("businessSettings.currier.failedLoad")}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {courierQuery.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[180px] animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
            />
          ))
          : filtered.map((g) => {
            const meta = COURIER_PROVIDER_DEFS.find(
              (d) => d.provider === g.provider
            );

            return (
              <div
                key={g.provider}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white text-sm font-extrabold text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
                        {g.imagePath ? (
                          <img
                            src={toPublicUrl(g.imagePath) ?? undefined}
                            alt={meta?.title ?? g.provider}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          meta?.logoText ?? "CR"
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                          {meta?.title ?? g.provider}
                        </p>
                        {g.base_url ? (
                          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                            {g.base_url}
                          </p>
                        ) : (
                          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                            {t("businessSettings.payment.provider")}:{" "}
                            <span className="font-semibold">
                              {g.provider}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <Switch
                      key={`courier-st-${g.provider}-${g.is_active}`}
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
                    <div className="flex flex-wrap items-center gap-2">
                      {g.isDefault ? (
                        <span className="inline-flex items-center rounded-lg bg-success-100 px-2.5 py-1 text-xs font-semibold text-success-700 dark:bg-success-500/10 dark:text-success-300">
                          {t("businessSettings.payment.default")}
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => defaultMutation.mutate(g.provider)}
                          disabled={defaultMutation.isPending}
                        >
                          {t("businessSettings.currier.makeDefault")}
                        </Button>
                      )}

                      <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {t("orders.orderEditor.courier")}
                      </span>
                    </div>

                    {g.description ? (
                      <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {g.description}
                      </p>
                    ) : null}

                    {g.note ? (
                      <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                        {g.note}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-800">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:text-brand-600"
                    onClick={() => openEdit(g)}
                  >
                    <Settings size={16} />
                    {t("businessSettings.payment.viewSettings")}
                  </button>
                </div>
              </div>
            );
          })}

        {!courierQuery.isLoading && filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            {t("businessSettings.currier.noCurriers")}
          </div>
        ) : null}
      </div>

      <CurrierModal
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
          setRefreshedAt(new Date());
          setModalOpen(false);
          setEditingProvider(null);
          setEditingInitial(null);
        }}
      />
    </div>
  );
}
