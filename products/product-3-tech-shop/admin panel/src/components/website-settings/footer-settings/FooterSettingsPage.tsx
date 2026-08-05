import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Copy,
  ExternalLink,
  Eye,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Select from "@/components/form/Select";
import Switch from "@/components/form/switch/Switch";

import { INITIAL_FOOTER_SETTINGS } from "./mockData";
import type {
  FooterColumn,
  FooterColumnType,
  FooterLink,
  FooterSettings,
  FooterTheme,
  Option,
  Priority,
  SocialKey,
} from "./types";

// Moved inside component to use t()

// Moved inside component to use t()

// Moved inside component to use t()

// Moved inside component to use t()

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function safeCopy(text: string) {
  try {
    void navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

function normalizeCopyright(text: string) {
  const year = new Date().getFullYear();
  return text.replace(/\{year\}/g, String(year));
}

function sortByPriority<T extends { priority: Priority }>(items: T[]) {
  const rank: Record<Priority, number> = {
    High: 4,
    Medium: 3,
    Normal: 2,
    Low: 1,
  };
  return [...items].sort((a, b) => rank[b.priority] - rank[a.priority]);
}

const SOCIAL_LABELS: Record<SocialKey, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  linkedin: "LinkedIn",
};

export default function FooterSettingsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<FooterSettings>(INITIAL_FOOTER_SETTINGS);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const THEME_OPTIONS: Option[] = [
    { value: "auto", label: t("footerSettings.themeOptions.auto") },
    { value: "light", label: t("footerSettings.themeOptions.light") },
    { value: "dark", label: t("footerSettings.themeOptions.dark") },
  ];

  const WIDTH_OPTIONS: Option[] = [
    { value: "xl", label: t("footerSettings.widthOptions.xl") },
    { value: "2xl", label: t("footerSettings.widthOptions.2xl") },
    { value: "full", label: t("footerSettings.widthOptions.full") },
  ];

  const PRIORITY_OPTIONS: Option[] = [
    { value: "Low", label: t("footerSettings.priority.low") },
    { value: "Normal", label: t("footerSettings.priority.normal") },
    { value: "Medium", label: t("footerSettings.priority.medium") },
    { value: "High", label: t("footerSettings.priority.high") },
  ];

  const COLUMN_TYPE_OPTIONS: Option[] = [
    { value: "links", label: t("footerSettings.columns.typeLinks") },
    { value: "text", label: t("footerSettings.columns.typeText") },
    { value: "contact", label: t("footerSettings.columns.typeContact") },
  ];

  // UI helpers
  const enabledColumns = useMemo(
    () => sortByPriority(data.columns.filter((c) => c.enabled)),
    [data.columns]
  );

  const enabledSocials = useMemo(
    () => sortByPriority(data.socials.filter((s) => s.enabled)),
    [data.socials]
  );

  const enabledPaymentIcons = useMemo(
    () => data.payments.icons.filter((p) => p.enabled),
    [data.payments.icons]
  );

  const reset = () => {
    setData(INITIAL_FOOTER_SETTINGS);
    setLastSavedAt(null);
  };

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 450));
    console.log("FOOTER_SETTINGS_SAVE", data);
    setLastSavedAt(new Date().toLocaleString());
    setSaving(false);
  };

  // Layout
  const updateTheme = (v: string) => {
    setData((p) => ({ ...p, theme: v as FooterTheme }));
  };

  const updateMaxWidth = (v: string) => {
    setData((p) => ({
      ...p,
      layout: { ...p.layout, maxWidth: v as FooterSettings["layout"]["maxWidth"] },
    }));
  };

  const toggleDivider = (checked: boolean) => {
    setData((p) => ({ ...p, layout: { ...p.layout, showDivider: checked } }));
  };

  // Branding
  const updateBranding = (
    key: keyof FooterSettings["branding"],
    value: string | boolean
  ) => {
    setData((p) => ({ ...p, branding: { ...p.branding, [key]: value } }));
  };

  // Newsletter
  const updateNewsletter = (
    key: keyof FooterSettings["newsletter"],
    value: string | boolean
  ) => {
    setData((p) => ({ ...p, newsletter: { ...p.newsletter, [key]: value } }));
  };

  // Payments
  const updatePayments = (
    key: keyof FooterSettings["payments"],
    value: FooterSettings["payments"][keyof FooterSettings["payments"]]
  ) => {
    setData((p) => ({ ...p, payments: { ...p.payments, [key]: value } }));
  };

  const togglePaymentIcon = (id: string, enabled: boolean) => {
    setData((p) => ({
      ...p,
      payments: {
        ...p.payments,
        icons: p.payments.icons.map((x) => (x.id === id ? { ...x, enabled } : x)),
      },
    }));
  };

  // Legal
  const updateLegal = (
    key: keyof FooterSettings["legal"],
    value: FooterSettings["legal"][keyof FooterSettings["legal"]]
  ) => {
    setData((p) => ({ ...p, legal: { ...p.legal, [key]: value } }));
  };

  const updatePolicy = (id: string, patch: Partial<FooterLink>) => {
    setData((p) => ({
      ...p,
      legal: {
        ...p.legal,
        policies: p.legal.policies.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      },
    }));
  };

  const addPolicy = () => {
    const next: FooterLink = {
      id: uid("policy"),
      label: "New Policy",
      href: "/",
      isExternal: false,
      enabled: true,
      priority: "Normal",
    };
    setData((p) => ({ ...p, legal: { ...p.legal, policies: [next, ...p.legal.policies] } }));
  };

  const removePolicy = (id: string) => {
    setData((p) => ({
      ...p,
      legal: { ...p.legal, policies: p.legal.policies.filter((x) => x.id !== id) },
    }));
  };

  // Social
  const updateSocial = (key: SocialKey, patch: { url?: string; enabled?: boolean; priority?: Priority }) => {
    setData((p) => ({
      ...p,
      socials: p.socials.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    }));
  };

  // Columns
  const addColumn = () => {
    const next: FooterColumn = {
      id: uid("col"),
      title: "New Column",
      type: "links",
      enabled: true,
      priority: "Normal",
      links: [],
    };
    setData((p) => ({ ...p, columns: [next, ...p.columns] }));
  };

  const removeColumn = (id: string) => {
    setData((p) => ({ ...p, columns: p.columns.filter((c) => c.id !== id) }));
  };

  const updateColumn = (id: string, patch: Partial<FooterColumn>) => {
    setData((p) => ({
      ...p,
      columns: p.columns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const onChangeColumnType = (id: string, type: FooterColumnType) => {
    setData((p) => ({
      ...p,
      columns: p.columns.map((c) => {
        if (c.id !== id) return c;

        if (type === "links") {
          return { ...c, type, text: undefined, contactAddress: undefined, contactPhones: undefined, contactEmails: undefined, links: c.links ?? [] };
        }
        if (type === "text") {
          return { ...c, type, text: c.text ?? "", links: undefined, contactAddress: undefined, contactPhones: undefined, contactEmails: undefined };
        }
        return {
          ...c,
          type,
          contactAddress: c.contactAddress ?? "",
          contactPhones: c.contactPhones ?? [],
          contactEmails: c.contactEmails ?? [],
          links: undefined,
          text: undefined,
        };
      }),
    }));
  };

  // Links inside column
  const addLink = (columnId: string) => {
    const next: FooterLink = {
      id: uid("link"),
      label: "New Link",
      href: "/",
      isExternal: false,
      enabled: true,
      priority: "Normal",
    };

    setData((p) => ({
      ...p,
      columns: p.columns.map((c) =>
        c.id === columnId
          ? { ...c, links: [next, ...(c.links ?? [])] }
          : c
      ),
    }));
  };

  const updateLink = (columnId: string, linkId: string, patch: Partial<FooterLink>) => {
    setData((p) => ({
      ...p,
      columns: p.columns.map((c) => {
        if (c.id !== columnId) return c;
        const links = (c.links ?? []).map((l) => (l.id === linkId ? { ...l, ...patch } : l));
        return { ...c, links };
      }),
    }));
  };

  const removeLink = (columnId: string, linkId: string) => {
    setData((p) => ({
      ...p,
      columns: p.columns.map((c) => {
        if (c.id !== columnId) return c;
        const links = (c.links ?? []).filter((l) => l.id !== linkId);
        return { ...c, links };
      }),
    }));
  };

  const containerWidthClass =
    data.layout.maxWidth === "xl"
      ? "max-w-6xl"
      : data.layout.maxWidth === "2xl"
        ? "max-w-7xl"
        : "max-w-none";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t("footerSettings.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("footerSettings.subtitle")}
          </p>
          {lastSavedAt ? (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t("footerSettings.lastSaved", { time: lastSavedAt })}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            startIcon={<RefreshCw size={16} />}
            onClick={reset}
          >
            {t("footerSettings.reset")}
          </Button>
          <Button startIcon={<Save size={16} />} onClick={save} disabled={saving}>
            {saving ? t("footerSettings.saving") : t("footerSettings.saveChanges")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* LEFT CONFIG */}
        <div className="space-y-6">
          {/* Layout */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("footerSettings.layout.title")}
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("footerSettings.layout.themeMode")}
                </p>
                <Select
                  options={THEME_OPTIONS}
                  placeholder={t("footerSettings.select")}
                  defaultValue={data.theme}
                  onChange={updateTheme}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("footerSettings.layout.containerWidth")}
                </p>
                <Select
                  options={WIDTH_OPTIONS}
                  placeholder={t("footerSettings.select")}
                  defaultValue={data.layout.maxWidth}
                  onChange={updateMaxWidth}
                />
              </div>

              <div className="space-y-2 md:col-span-3">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("footerSettings.layout.dividerTitle")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("footerSettings.layout.dividerHint")}
                    </p>
                  </div>
                  <Switch
                    label=""
                    defaultChecked={data.layout.showDivider}
                    onChange={toggleDivider}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("footerSettings.branding.title")}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("footerSettings.branding.subtitle")}
                </p>
              </div>
              <Switch
                label=""
                defaultChecked={data.branding.enabled}
                onChange={(checked) => updateBranding("enabled", checked)}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("footerSettings.branding.logoUrl")}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    value={data.branding.logoUrl}
                    onChange={(e) => updateBranding("logoUrl", e.target.value)}
                    placeholder={t("footerSettings.branding.logoPlaceholder")}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => safeCopy(data.branding.logoUrl)}
                    ariaLabel="Copy"
                    startIcon={<Copy size={16} />}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("footerSettings.branding.brandName")}
                </p>
                <Input
                  value={data.branding.brandName}
                  onChange={(e) => updateBranding("brandName", e.target.value)}
                  placeholder={t("footerSettings.branding.brandPlaceholder")}
                />
              </div>

              <div className="space-y-2 md:col-span-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("footerSettings.branding.tagline")}
                </p>
                <Input
                  value={data.branding.tagline}
                  onChange={(e) => updateBranding("tagline", e.target.value)}
                  placeholder={t("footerSettings.branding.taglinePlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Footer Columns */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("footerSettings.columns.title")}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("footerSettings.columns.subtitle")}
                </p>
              </div>

              <Button
                variant="outline"
                startIcon={<Plus size={16} />}
                onClick={addColumn}
              >
                {t("footerSettings.columns.addColumn")}
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              {data.columns.map((col) => (
                <div
                  key={col.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2 md:col-span-1">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {t("footerSettings.columns.columnTitle")}
                          </p>
                          <Input
                            value={col.title}
                            onChange={(e) =>
                              updateColumn(col.id, { title: e.target.value })
                            }
                            placeholder={t("footerSettings.columns.columnTitlePlaceholder")}
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {t("footerSettings.columns.type")}
                          </p>
                          <Select
                            options={COLUMN_TYPE_OPTIONS}
                            placeholder={t("footerSettings.select")}
                            defaultValue={col.type}
                            onChange={(v) =>
                              onChangeColumnType(col.id, v as FooterColumnType)
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {t("footerSettings.columns.priority")}
                          </p>
                          <Select
                            options={PRIORITY_OPTIONS}
                            placeholder={t("footerSettings.select")}
                            defaultValue={col.priority}
                            onChange={(v) =>
                              updateColumn(col.id, { priority: v as Priority })
                            }
                          />
                        </div>
                      </div>

                      {/* Type specific */}
                      <div className="mt-4">
                        {col.type === "text" ? (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {t("footerSettings.columns.text")}
                            </p>
                            <TextArea
                              value={col.text ?? ""}
                              onChange={(v) => updateColumn(col.id, { text: v })}
                              placeholder={t("footerSettings.columns.textPlaceholder")}
                            />
                          </div>
                        ) : null}

                        {col.type === "contact" ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {t("footerSettings.columns.address")}
                              </p>
                              <TextArea
                                value={col.contactAddress ?? ""}
                                onChange={(v) =>
                                  updateColumn(col.id, { contactAddress: v })
                                }
                                placeholder={t("footerSettings.columns.addressPlaceholder")}
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {t("footerSettings.columns.phones")}
                                </p>
                                <Input
                                  value={(col.contactPhones ?? []).join(", ")}
                                  onChange={(e) =>
                                    updateColumn(col.id, {
                                      contactPhones: e.target.value
                                        .split(",")
                                        .map((x) => x.trim())
                                        .filter(Boolean),
                                    })
                                  }
                                  placeholder={t("footerSettings.columns.phonesPlaceholder")}
                                />
                              </div>

                              <div className="space-y-2">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {t("footerSettings.columns.emails")}
                                </p>
                                <Input
                                  value={(col.contactEmails ?? []).join(", ")}
                                  onChange={(e) =>
                                    updateColumn(col.id, {
                                      contactEmails: e.target.value
                                        .split(",")
                                        .map((x) => x.trim())
                                        .filter(Boolean),
                                    })
                                  }
                                  placeholder={t("footerSettings.columns.emailsPlaceholder")}
                                />
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {col.type === "links" ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {t("footerSettings.columns.links")}
                              </p>
                              <Button
                                variant="outline"
                                startIcon={<Plus size={16} />}
                                onClick={() => addLink(col.id)}
                              >
                                {t("footerSettings.columns.addLink")}
                              </Button>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="min-w-[980px] w-full border-collapse">
                                <thead>
                                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                                    {[t("footerSettings.table.label"), t("footerSettings.table.url"), t("footerSettings.table.external"), t("footerSettings.table.enabled"), t("footerSettings.table.priority"), t("footerSettings.table.action")].map(
                                      (h) => (
                                        <th
                                          key={h}
                                          className="px-4 py-3 text-left text-xs font-semibold text-brand-500"
                                        >
                                          {h}
                                        </th>
                                      )
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {(col.links ?? []).map((l) => (
                                    <tr
                                      key={l.id}
                                      className="border-b border-gray-100 dark:border-gray-800"
                                    >
                                      <td className="px-4 py-3">
                                        <Input
                                          value={l.label}
                                          onChange={(e) =>
                                            updateLink(col.id, l.id, {
                                              label: e.target.value,
                                            })
                                          }
                                          placeholder={t("footerSettings.table.labelPlaceholder")}
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                          <Input
                                            value={l.href}
                                            onChange={(e) =>
                                              updateLink(col.id, l.id, {
                                                href: e.target.value,
                                              })
                                            }
                                            placeholder={t("footerSettings.table.urlPlaceholder")}
                                          />
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                              if (!l.href) return;
                                              window.open(
                                                l.href,
                                                "_blank",
                                                "noreferrer"
                                              );
                                            }}
                                            ariaLabel="Open"
                                            startIcon={<ExternalLink size={16} />}
                                          />
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <Switch
                                          label=""
                                          defaultChecked={l.isExternal}
                                          onChange={(checked) =>
                                            updateLink(col.id, l.id, {
                                              isExternal: checked,
                                            })
                                          }
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <Switch
                                          label=""
                                          defaultChecked={l.enabled}
                                          onChange={(checked) =>
                                            updateLink(col.id, l.id, {
                                              enabled: checked,
                                            })
                                          }
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="max-w-[180px]">
                                          <Select
                                            options={PRIORITY_OPTIONS}
                                            placeholder={t("footerSettings.select")}
                                            defaultValue={l.priority}
                                            onChange={(v) =>
                                              updateLink(col.id, l.id, {
                                                priority: v as Priority,
                                              })
                                            }
                                          />
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <Button
                                          variant="danger"
                                          size="sm"
                                          onClick={() => removeLink(col.id, l.id)}
                                          startIcon={<Trash2 size={14} />}
                                        >
                                          {t("footerSettings.table.delete")}
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}

                                  {(col.links ?? []).length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                                      >
                                        {t("footerSettings.columns.noLinks")}
                                      </td>
                                    </tr>
                                  ) : null}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {t("footerSettings.columns.enabled")}
                        </span>
                        <Switch
                          label=""
                          defaultChecked={col.enabled}
                          onChange={(checked) => updateColumn(col.id, { enabled: checked })}
                        />
                      </div>

                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeColumn(col.id)}
                        startIcon={<Trash2 size={14} />}
                      >
                        {t("footerSettings.columns.remove")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {data.columns.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
                  {t("footerSettings.columns.noColumns")}
                </div>
              ) : null}
            </div>
          </div>

          {/* Newsletter */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("footerSettings.newsletter.title")}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("footerSettings.newsletter.subtitle")}
                </p>
              </div>
              <Switch
                label=""
                defaultChecked={data.newsletter.enabled}
                onChange={(checked) => updateNewsletter("enabled", checked)}
              />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("footerSettings.newsletter.fieldTitle")}
                </p>
                <Input
                  value={data.newsletter.title}
                  onChange={(e) => updateNewsletter("title", e.target.value)}
                  placeholder={t("footerSettings.newsletter.titlePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("footerSettings.newsletter.buttonLabel")}
                </p>
                <Input
                  value={data.newsletter.buttonLabel}
                  onChange={(e) => updateNewsletter("buttonLabel", e.target.value)}
                  placeholder={t("footerSettings.newsletter.buttonPlaceholder")}
                />
              </div>

              {/* <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </p>
                <TextArea
                  value={data.newsletter.description}
                  onChange={(v) => updateNewsletter("description", v)}
                  placeholder="Short description..."
                />
              </div> */}

              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("footerSettings.newsletter.placeholder")}
                </p>
                <Input
                  value={data.newsletter.placeholder}
                  onChange={(e) => updateNewsletter("placeholder", e.target.value)}
                  placeholder={t("footerSettings.newsletter.placeholderDefault")}
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("footerSettings.social.title")}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("footerSettings.social.subtitle")}
            </p>

            <div className="mt-5 space-y-3">
              {data.socials.map((s) => (
                <div
                  key={s.key}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {SOCIAL_LABELS[s.key]}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("footerSettings.social.key", { key: s.key })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-[160px]">
                        <Select
                          options={PRIORITY_OPTIONS}
                          placeholder={t("footerSettings.select")}
                          defaultValue={s.priority}
                          onChange={(v) => updateSocial(s.key, { priority: v as Priority })}
                        />
                      </div>

                      <Switch
                        label=""
                        defaultChecked={s.enabled}
                        onChange={(checked) => updateSocial(s.key, { enabled: checked })}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Input
                      value={s.url}
                      onChange={(e) => updateSocial(s.key, { url: e.target.value })}
                      placeholder="https://..."
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (!s.url) return;
                        window.open(s.url, "_blank", "noreferrer");
                      }}
                      ariaLabel="Open"
                      startIcon={<ExternalLink size={16} />}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payments */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("footerSettings.payments.title")}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("footerSettings.payments.subtitle")}
                </p>
              </div>
              <Switch
                label=""
                defaultChecked={data.payments.enabled}
                onChange={(checked) => updatePayments("enabled", checked)}
              />
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("footerSettings.payments.fieldTitle")}
                </p>
                <Input
                  value={data.payments.title}
                  onChange={(e) =>
                    updatePayments("title", e.target.value)
                  }
                  placeholder={t("footerSettings.payments.titlePlaceholder")}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.payments.icons.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {p.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {p.imageUrl}
                        </p>
                      </div>
                      <Switch
                        label=""
                        defaultChecked={p.enabled}
                        onChange={(checked) => togglePaymentIcon(p.id, checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("footerSettings.legal.title")}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("footerSettings.legal.subtitle")}
                </p>
              </div>
              <Switch
                label=""
                defaultChecked={data.legal.enabled}
                onChange={(checked) => updateLegal("enabled", checked)}
              />
            </div>

            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("footerSettings.legal.copyrightText")}
                  </p>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => safeCopy(data.legal.copyrightText)}
                    startIcon={<Copy size={14} />}
                  >
                    {t("footerSettings.legal.copy")}
                  </Button>
                </div>

                <Input
                  value={data.legal.copyrightText}
                  onChange={(e) => updateLegal("copyrightText", e.target.value)}
                  placeholder={t("footerSettings.legal.copyrightPlaceholder")}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("footerSettings.legal.copyrightTip")}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("footerSettings.legal.showPolicies")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("footerSettings.legal.policiesHint")}
                  </p>
                </div>
                <Switch
                  label=""
                  defaultChecked={data.legal.showPolicies}
                  onChange={(checked) => updateLegal("showPolicies", checked)}
                />
              </div>

              {data.legal.showPolicies ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("footerSettings.legal.policyLinks")}
                    </p>
                    <Button
                      variant="outline"
                      startIcon={<Plus size={16} />}
                      onClick={addPolicy}
                    >
                      {t("footerSettings.legal.addPolicy")}
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-[980px] w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                          {[t("footerSettings.table.label"), t("footerSettings.table.url"), t("footerSettings.table.external"), t("footerSettings.table.enabled"), t("footerSettings.table.priority"), t("footerSettings.table.action")].map(
                            (h) => (
                              <th
                                key={h}
                                className="px-4 py-3 text-left text-xs font-semibold text-brand-500"
                              >
                                {h}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {data.legal.policies.map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-gray-100 dark:border-gray-800"
                          >
                            <td className="px-4 py-3">
                              <Input
                                value={p.label}
                                onChange={(e) =>
                                  updatePolicy(p.id, { label: e.target.value })
                                }
                                placeholder={t("footerSettings.legal.policyPlaceholder")}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={p.href}
                                  onChange={(e) =>
                                    updatePolicy(p.id, { href: e.target.value })
                                  }
                                  placeholder={t("footerSettings.legal.policyUrlPlaceholder")}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => {
                                    if (!p.href) return;
                                    window.open(p.href, "_blank", "noreferrer");
                                  }}
                                  ariaLabel="Open"
                                  startIcon={<ExternalLink size={16} />}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Switch
                                label=""
                                defaultChecked={p.isExternal}
                                onChange={(checked) =>
                                  updatePolicy(p.id, { isExternal: checked })
                                }
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Switch
                                label=""
                                defaultChecked={p.enabled}
                                onChange={(checked) =>
                                  updatePolicy(p.id, { enabled: checked })
                                }
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="max-w-[180px]">
                                <Select
                                  options={PRIORITY_OPTIONS}
                                  placeholder={t("footerSettings.select")}
                                  defaultValue={p.priority}
                                  onChange={(v) =>
                                    updatePolicy(p.id, { priority: v as Priority })
                                  }
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => removePolicy(p.id)}
                                startIcon={<Trash2 size={14} />}
                              >
                                {t("footerSettings.table.delete")}
                              </Button>
                            </td>
                          </tr>
                        ))}

                        {data.legal.policies.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                            >
                              {t("footerSettings.legal.noPolicies")}
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* RIGHT PREVIEW */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("footerSettings.preview.title")}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("footerSettings.preview.subtitle")}
                </p>
              </div>

              <Button
                variant="outline"
                startIcon={<Eye size={16} />}
                onClick={() => console.log("Open storefront preview")}
              >
                {t("footerSettings.preview.previewButton")}
              </Button>
            </div>

            <div
              className={[
                "mt-6 rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden",
              ].join(" ")}
            >
              <div className={["mx-auto w-full px-6 py-8", containerWidthClass].join(" ")}>
                {data.layout.showDivider ? (
                  <div className="mb-6 h-px w-full bg-gray-200 dark:bg-gray-800" />
                ) : null}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Branding + newsletter */}
                  <div className="lg:col-span-4 space-y-5">
                    {data.branding.enabled ? (
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold text-gray-700 dark:text-gray-200">
                            {t("footerSettings.preview.logo")}
                          </div>
                          <div>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                              {data.branding.brandName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {data.branding.tagline}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {data.newsletter.enabled ? (
                      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {data.newsletter.title}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {data.newsletter.description}
                        </p>

                        <div className="mt-3 flex gap-2">
                          <Input value="" onChange={() => { }} placeholder={data.newsletter.placeholder} />
                          <Button>{data.newsletter.buttonLabel}</Button>
                        </div>
                      </div>
                    ) : null}

                    {enabledSocials.length ? (
                      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {t("footerSettings.social.followUs")}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {enabledSocials.map((s) => (
                            <a
                              key={s.key}
                              href={s.url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.03]"
                            >
                              {SOCIAL_LABELS[s.key]}
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Columns */}
                  <div className="lg:col-span-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {enabledColumns.map((c) => (
                      <div key={c.id}>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {c.title}
                        </p>

                        {c.type === "text" ? (
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {c.text}
                          </p>
                        ) : null}

                        {c.type === "contact" ? (
                          <div className="mt-2 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                            {c.contactAddress ? <p>{c.contactAddress}</p> : null}
                            {(c.contactPhones ?? []).filter(Boolean).map((p) => (
                              <p key={p}>{p}</p>
                            ))}
                            {(c.contactEmails ?? []).filter(Boolean).map((m) => (
                              <p key={m}>{m}</p>
                            ))}
                          </div>
                        ) : null}

                        {c.type === "links" ? (
                          <div className="mt-2 space-y-2">
                            {sortByPriority((c.links ?? []).filter((l) => l.enabled)).map((l) => (
                              <a
                                key={l.id}
                                href={l.href}
                                target={l.isExternal ? "_blank" : undefined}
                                rel={l.isExternal ? "noreferrer" : undefined}
                                className="block text-sm text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
                              >
                                {l.label}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payments + legal */}
                <div className="mt-8 flex flex-col gap-4 border-t border-gray-200 pt-6 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    {data.payments.enabled ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {data.payments.title}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {enabledPaymentIcons.map((p) => (
                            <span
                              key={p.id}
                              className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                            >
                              {p.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {data.legal.enabled ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>{normalizeCopyright(data.legal.copyrightText)}</p>

                      {data.legal.showPolicies ? (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                          {sortByPriority(data.legal.policies.filter((x) => x.enabled)).map((p) => (
                            <a
                              key={p.id}
                              href={p.href}
                              target={p.isExternal ? "_blank" : undefined}
                              rel={p.isExternal ? "noreferrer" : undefined}
                              className="text-sm text-gray-600 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
                            >
                              {p.label}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("footerSettings.preview.backendNote")}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("footerSettings.export.title")}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("footerSettings.export.subtitle")}
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => safeCopy(JSON.stringify(data, null, 2))}
                startIcon={<Copy size={16} />}
              >
                {t("footerSettings.export.copyJson")}
              </Button>

              <Button
                variant="outline"
                onClick={() => console.log("Deploy footer settings")}
              >
                {t("footerSettings.export.deploy")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
