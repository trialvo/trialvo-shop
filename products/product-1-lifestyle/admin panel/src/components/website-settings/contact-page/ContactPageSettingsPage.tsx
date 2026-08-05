import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";

import { INITIAL_CONTACT_SETTINGS } from "./mockData";
import type {
  BusinessHourRow,
  ContactFieldKey,
  ContactPageSettings,
  SocialKey,
} from "./types";

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

const FIELD_ORDER: ContactFieldKey[] = [
  "firstName",
  "lastName",
  "mobile",
  "email",
  "subject",
  "message",
];

const SOCIAL_ICONS: Record<SocialKey, React.ReactNode> = {
  facebook: <span className="text-xs font-semibold">f</span>,
  instagram: <span className="text-xs font-semibold">IG</span>,
  whatsapp: <span className="text-xs font-semibold">WA</span>,
  tiktok: <span className="text-xs font-semibold">TT</span>,
  youtube: <span className="text-xs font-semibold">YT</span>,
  x: <span className="text-xs font-semibold">X</span>,
};

export default function ContactPageSettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<ContactPageSettings>(
    INITIAL_CONTACT_SETTINGS
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const enabledSocials = useMemo(
    () => settings.socialLinks.filter((s) => s.enabled),
    [settings.socialLinks]
  );

  const onReset = () => {
    setSettings(INITIAL_CONTACT_SETTINGS);
    setLastSavedAt(null);
  };

  const onSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 450));
    console.log("CONTACT_PAGE_SETTINGS_SAVE", settings);
    setLastSavedAt(new Date().toLocaleString());
    setSaving(false);
  };

  const updateContactInfo = (
    key: keyof ContactPageSettings["contactInfo"],
    value: string
  ) => {
    setSettings((p) => ({
      ...p,
      contactInfo: { ...p.contactInfo, [key]: value },
    }));
  };

  const updateContactFormTop = (
    key: keyof ContactPageSettings["contactForm"],
    value: string
  ) => {
    setSettings((p) => ({
      ...p,
      contactForm: { ...p.contactForm, [key]: value },
    }));
  };

  const updateField = (
    field: ContactFieldKey,
    patch: Partial<ContactPageSettings["contactForm"]["fields"][ContactFieldKey]>
  ) => {
    setSettings((p) => ({
      ...p,
      contactForm: {
        ...p.contactForm,
        fields: {
          ...p.contactForm.fields,
          [field]: { ...p.contactForm.fields[field], ...patch },
        },
      },
    }));
  };

  // Phones
  const addPhone = () => {
    setSettings((p) => ({
      ...p,
      contactInfo: {
        ...p.contactInfo,
        phones: [...p.contactInfo.phones, ""],
      },
    }));
  };

  const updatePhone = (idx: number, value: string) => {
    setSettings((p) => ({
      ...p,
      contactInfo: {
        ...p.contactInfo,
        phones: p.contactInfo.phones.map((x, i) => (i === idx ? value : x)),
      },
    }));
  };

  const removePhone = (idx: number) => {
    setSettings((p) => ({
      ...p,
      contactInfo: {
        ...p.contactInfo,
        phones: p.contactInfo.phones.filter((_, i) => i !== idx),
      },
    }));
  };

  // Emails
  const addEmail = () => {
    setSettings((p) => ({
      ...p,
      contactInfo: {
        ...p.contactInfo,
        emails: [...p.contactInfo.emails, ""],
      },
    }));
  };

  const updateEmail = (idx: number, value: string) => {
    setSettings((p) => ({
      ...p,
      contactInfo: {
        ...p.contactInfo,
        emails: p.contactInfo.emails.map((x, i) => (i === idx ? value : x)),
      },
    }));
  };

  const removeEmail = (idx: number) => {
    setSettings((p) => ({
      ...p,
      contactInfo: {
        ...p.contactInfo,
        emails: p.contactInfo.emails.filter((_, i) => i !== idx),
      },
    }));
  };

  // Recipients
  const addRecipient = () => {
    setSettings((p) => ({
      ...p,
      contactForm: {
        ...p.contactForm,
        recipientEmails: [...p.contactForm.recipientEmails, ""],
      },
    }));
  };

  const updateRecipient = (idx: number, value: string) => {
    setSettings((p) => ({
      ...p,
      contactForm: {
        ...p.contactForm,
        recipientEmails: p.contactForm.recipientEmails.map((x, i) =>
          i === idx ? value : x
        ),
      },
    }));
  };

  const removeRecipient = (idx: number) => {
    setSettings((p) => ({
      ...p,
      contactForm: {
        ...p.contactForm,
        recipientEmails: p.contactForm.recipientEmails.filter((_, i) => i !== idx),
      },
    }));
  };

  // Business Hours
  const addBusinessRow = () => {
    const row: BusinessHourRow = {
      id: uid("bh"),
      label: "New Row",
      time: "10:00 AM - 10:00 PM",
      enabled: true,
    };
    setSettings((p) => ({
      ...p,
      contactInfo: {
        ...p.contactInfo,
        businessRows: [row, ...p.contactInfo.businessRows],
      },
    }));
  };

  const updateBusinessRow = (id: string, patch: Partial<BusinessHourRow>) => {
    setSettings((p) => ({
      ...p,
      contactInfo: {
        ...p.contactInfo,
        businessRows: p.contactInfo.businessRows.map((r) =>
          r.id === id ? { ...r, ...patch } : r
        ),
      },
    }));
  };

  const removeBusinessRow = (id: string) => {
    setSettings((p) => ({
      ...p,
      contactInfo: {
        ...p.contactInfo,
        businessRows: p.contactInfo.businessRows.filter((r) => r.id !== id),
      },
    }));
  };

  // Social
  const updateSocial = (
    key: SocialKey,
    patch: { url?: string; enabled?: boolean; label?: string }
  ) => {
    setSettings((p) => ({
      ...p,
      socialLinks: p.socialLinks.map((s) =>
        s.key === key ? { ...s, ...patch } : s
      ),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t("contactPageSettings.title")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("contactPageSettings.subtitle")}
          </p>
          {lastSavedAt ? (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t("contactPageSettings.lastSaved", { time: lastSavedAt })}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            startIcon={<RefreshCw size={16} />}
            onClick={onReset}
          >
            {t("contactPageSettings.reset")}
          </Button>

          <Button
            startIcon={<Save size={16} />}
            onClick={onSave}
            disabled={saving}
          >
            {saving ? t("contactPageSettings.saving") : t("contactPageSettings.saveChanges")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* LEFT: SETTINGS */}
        <div className="space-y-6">
          {/* Page Intro */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("contactPageSettings.pageIntro.title")}
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("contactPageSettings.pageIntro.heading")}
                </p>
                <Input
                  value={settings.contactInfo.heading}
                  onChange={(e) => updateContactInfo("heading", e.target.value)}
                  placeholder={t("contactPageSettings.pageIntro.headingPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("contactPageSettings.pageIntro.subHeading")}
                </p>
                <TextArea
                  value={settings.contactInfo.subHeading}
                  onChange={(v) => updateContactInfo("subHeading", v)}
                  placeholder={t("contactPageSettings.pageIntro.subHeadingPlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("contactPageSettings.contactInfo.title")}
            </h2>

            <div className="mt-5 space-y-5">
              {/* Address */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-brand-500" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("contactPageSettings.contactInfo.address")}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t("contactPageSettings.contactInfo.addressTitle")}
                    </p>
                    <Input
                      value={settings.contactInfo.addressTitle}
                      onChange={(e) =>
                        updateContactInfo("addressTitle", e.target.value)
                      }
                      placeholder={t("contactPageSettings.contactInfo.addressTitlePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t("contactPageSettings.contactInfo.addressText")}
                    </p>
                    <TextArea
                      value={settings.contactInfo.addressText}
                      onChange={(v) => updateContactInfo("addressText", v)}
                      placeholder={t("contactPageSettings.contactInfo.addressTextPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t("contactPageSettings.contactInfo.note")}
                    </p>
                    <Input
                      value={settings.contactInfo.addressNote}
                      onChange={(e) =>
                        updateContactInfo("addressNote", e.target.value)
                      }
                      placeholder={t("contactPageSettings.contactInfo.notePlaceholder")}
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-brand-500" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("contactPageSettings.contactInfo.phone")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    startIcon={<Plus size={16} />}
                    onClick={addPhone}
                  >
                    {t("contactPageSettings.add")}
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t("contactPageSettings.contactInfo.phoneTitle")}
                    </p>
                    <Input
                      value={settings.contactInfo.callTitle}
                      onChange={(e) =>
                        updateContactInfo("callTitle", e.target.value)
                      }
                      placeholder={t("contactPageSettings.contactInfo.callTitlePlaceholder")}
                    />
                  </div>

                  {settings.contactInfo.phones.map((p, idx) => (
                    <div key={`phone-${idx}`} className="flex items-center gap-2">
                      <Input
                        value={p}
                        onChange={(e) => updatePhone(idx, e.target.value)}
                        placeholder="+8801XXXXXXXXX"
                      />
                      <Button
                        variant="danger"
                        size="icon"
                        onClick={() => removePhone(idx)}
                        ariaLabel="Remove phone"
                        startIcon={<Trash2 size={16} />}
                      />
                    </div>
                  ))}

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t("contactPageSettings.contactInfo.note")}
                    </p>
                    <Input
                      value={settings.contactInfo.callNote}
                      onChange={(e) => updateContactInfo("callNote", e.target.value)}
                      placeholder={t("contactPageSettings.contactInfo.notePlaceholder")}
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-brand-500" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("contactPageSettings.contactInfo.email")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    startIcon={<Plus size={16} />}
                    onClick={addEmail}
                  >
                    {t("contactPageSettings.add")}
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t("contactPageSettings.contactInfo.emailTitle")}
                    </p>
                    <Input
                      value={settings.contactInfo.mailTitle}
                      onChange={(e) => updateContactInfo("mailTitle", e.target.value)}
                      placeholder={t("contactPageSettings.contactInfo.mailTitlePlaceholder")}
                    />
                  </div>

                  {settings.contactInfo.emails.map((m, idx) => (
                    <div key={`email-${idx}`} className="flex items-center gap-2">
                      <Input
                        value={m}
                        onChange={(e) => updateEmail(idx, e.target.value)}
                        placeholder="support@yourshop.com"
                      />
                      <Button
                        variant="danger"
                        size="icon"
                        onClick={() => removeEmail(idx)}
                        ariaLabel="Remove email"
                        startIcon={<Trash2 size={16} />}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Business hours */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("contactPageSettings.businessHours.title")}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t("contactPageSettings.businessHours.subtitle")}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    startIcon={<Plus size={16} />}
                    onClick={addBusinessRow}
                  >
                    {t("contactPageSettings.businessHours.addRow")}
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t("contactPageSettings.businessHours.fieldTitle")}
                    </p>
                    <Input
                      value={settings.contactInfo.businessTitle}
                      onChange={(e) =>
                        updateContactInfo("businessTitle", e.target.value)
                      }
                      placeholder={t("contactPageSettings.businessHours.titlePlaceholder")}
                    />
                  </div>

                  {settings.contactInfo.businessRows.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {t("contactPageSettings.businessHours.row")}
                        </p>
                        <div className="flex items-center gap-2">
                          <Switch
                            label=""
                            defaultChecked={r.enabled}
                            onChange={(checked) =>
                              updateBusinessRow(r.id, { enabled: checked })
                            }
                          />
                          <Button
                            variant="danger"
                            size="icon"
                            onClick={() => removeBusinessRow(r.id)}
                            ariaLabel="Remove row"
                            startIcon={<Trash2 size={16} />}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {t("contactPageSettings.businessHours.label")}
                          </p>
                          <Input
                            value={r.label}
                            onChange={(e) =>
                              updateBusinessRow(r.id, { label: e.target.value })
                            }
                            placeholder={t("contactPageSettings.businessHours.labelPlaceholder")}
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {t("contactPageSettings.businessHours.time")}
                          </p>
                          <Input
                            value={r.time}
                            onChange={(e) =>
                              updateBusinessRow(r.id, { time: e.target.value })
                            }
                            placeholder={t("contactPageSettings.businessHours.timePlaceholder")}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t("contactPageSettings.businessHours.footerNote")}
                    </p>
                    <Input
                      value={settings.contactInfo.businessFooterNote}
                      onChange={(e) =>
                        updateContactInfo("businessFooterNote", e.target.value)
                      }
                      placeholder={t("contactPageSettings.businessHours.footerNotePlaceholder")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("contactPageSettings.socialLinks.title")}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("contactPageSettings.socialLinks.subtitle")}
            </p>

            <div className="mt-5 space-y-3">
              {settings.socialLinks.map((s) => (
                <div
                  key={s.key}
                  className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200">
                        {SOCIAL_ICONS[s.key]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {s.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {s.key}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <Switch
                        label=""
                        defaultChecked={s.enabled}
                        onChange={(checked) =>
                          updateSocial(s.key, { enabled: checked })
                        }
                      />

                      <Button
                        variant="outline"
                        startIcon={<ExternalLink size={16} />}
                        onClick={() => {
                          if (s.url) window.open(s.url, "_blank", "noreferrer");
                        }}
                        disabled={!s.url}
                      >
                        {t("contactPageSettings.socialLinks.open")}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t("contactPageSettings.socialLinks.label")}
                      </p>
                      <Input
                        value={s.label}
                        onChange={(e) =>
                          updateSocial(s.key, { label: e.target.value })
                        }
                        placeholder={t("contactPageSettings.socialLinks.labelPlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {t("contactPageSettings.socialLinks.url")}
                      </p>
                      <Input
                        value={s.url}
                        onChange={(e) =>
                          updateSocial(s.key, { url: e.target.value })
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("contactPageSettings.map.title")}
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("contactPageSettings.map.mapTitle")}
                </p>
                <Input
                  value={settings.contactInfo.mapTitle}
                  onChange={(e) => updateContactInfo("mapTitle", e.target.value)}
                  placeholder={t("contactPageSettings.map.mapTitlePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("contactPageSettings.map.mapSubtitle")}
                </p>
                <Input
                  value={settings.contactInfo.mapSubTitle}
                  onChange={(e) =>
                    updateContactInfo("mapSubTitle", e.target.value)
                  }
                  placeholder={t("contactPageSettings.map.mapSubtitlePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("contactPageSettings.map.embedUrl")}
                  </p>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => safeCopy(settings.contactInfo.mapEmbedUrl)}
                    startIcon={<Copy size={14} />}
                  >
                    {t("contactPageSettings.map.copy")}
                  </Button>
                </div>
                <Input
                  value={settings.contactInfo.mapEmbedUrl}
                  onChange={(e) => updateContactInfo("mapEmbedUrl", e.target.value)}
                  placeholder={t("contactPageSettings.map.embedUrlPlaceholder")}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("contactPageSettings.map.embedTip")}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("contactPageSettings.contactForm.title")}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("contactPageSettings.contactForm.subtitle")}
            </p>

            <div className="mt-5 grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("contactPageSettings.contactForm.formTitle")}
                </p>
                <Input
                  value={settings.contactForm.title}
                  onChange={(e) => updateContactFormTop("title", e.target.value)}
                  placeholder={t("contactPageSettings.contactForm.formTitlePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("contactPageSettings.contactForm.successMessage")}
                </p>
                <TextArea
                  value={settings.contactForm.successMessage}
                  onChange={(v) => updateContactFormTop("successMessage", v)}
                  placeholder={t("contactPageSettings.contactForm.successPlaceholder")}
                />
              </div>

              {/* Fields */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {t("contactPageSettings.contactForm.fields")}
                </p>

                <div className="mt-4 space-y-3">
                  {FIELD_ORDER.map((key) => {
                    const f = settings.contactForm.fields[key];
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {f.label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {key}
                            </p>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {t("contactPageSettings.contactForm.enabled")}
                              </p>
                              <Switch
                                label=""
                                defaultChecked={f.enabled}
                                onChange={(checked) =>
                                  updateField(key, { enabled: checked })
                                }
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {t("contactPageSettings.contactForm.required")}
                              </p>
                              <Switch
                                label=""
                                defaultChecked={f.required}
                                onChange={(checked) =>
                                  updateField(key, { required: checked })
                                }
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {t("contactPageSettings.contactForm.label")}
                            </p>
                            <Input
                              value={f.label}
                              onChange={(e) =>
                                updateField(key, { label: e.target.value })
                              }
                              placeholder={t("contactPageSettings.contactForm.labelPlaceholder")}
                            />
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {t("contactPageSettings.contactForm.placeholder")}
                            </p>
                            <Input
                              value={f.placeholder}
                              onChange={(e) =>
                                updateField(key, { placeholder: e.target.value })
                              }
                              placeholder={t("contactPageSettings.contactForm.placeholderDefault")}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Emails */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {t("contactPageSettings.contactForm.recipientEmails")}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t("contactPageSettings.contactForm.recipientHint")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    startIcon={<Plus size={16} />}
                    onClick={addRecipient}
                  >
                    {t("contactPageSettings.add")}
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {settings.contactForm.recipientEmails.map((r, idx) => (
                    <div key={`rcpt-${idx}`} className="flex items-center gap-2">
                      <Input
                        value={r}
                        onChange={(e) => updateRecipient(idx, e.target.value)}
                        placeholder="support@yourshop.com"
                      />
                      <Button
                        variant="danger"
                        size="icon"
                        onClick={() => removeRecipient(idx)}
                        ariaLabel="Remove recipient"
                        startIcon={<Trash2 size={16} />}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: LIVE PREVIEW */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("contactPageSettings.preview.title")}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("contactPageSettings.preview.subtitle")}
                </p>
              </div>

              <Button
                variant="outline"
                startIcon={<ExternalLink size={16} />}
                onClick={() => console.log("Open storefront preview")}
              >
                {t("contactPageSettings.preview.previewBtn")}
              </Button>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {settings.contactInfo.heading}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {settings.contactInfo.subHeading}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Contact form preview */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <p className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                    <Mail size={18} className="text-brand-500" /> {settings.contactForm.title}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {FIELD_ORDER.filter(
                      (k) =>
                        settings.contactForm.fields[k].enabled &&
                        (k === "firstName" ||
                          k === "lastName" ||
                          k === "mobile" ||
                          k === "email")
                    ).map((k) => {
                      const f = settings.contactForm.fields[k];
                      return (
                        <div key={k} className="space-y-2">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {f.label}{" "}
                            {f.required ? (
                              <span className="text-error-500">*</span>
                            ) : null}
                          </p>
                          <Input value="" onChange={() => { }} placeholder={f.placeholder} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 space-y-2">
                    {(["subject", "message"] as ContactFieldKey[]).map((key) => {
                      const f = settings.contactForm.fields[key];
                      if (!f.enabled) return null;

                      return (
                        <div key={key} className="space-y-2">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {f.label}{" "}
                            {f.required ? (
                              <span className="text-error-500">*</span>
                            ) : null}
                          </p>
                          {key === "message" ? (
                            <TextArea value="" onChange={() => { }} placeholder={f.placeholder} />
                          ) : (
                            <Input value="" onChange={() => { }} placeholder={f.placeholder} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Button variant="outline">{t("contactPageSettings.preview.cancel")}</Button>
                    <Button>{t("contactPageSettings.preview.sendMessage")}</Button>
                  </div>
                </div>

                {/* Contact info preview */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                  <p className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                    <MapPin size={18} className="text-brand-500" /> {t("contactPageSettings.preview.contactInformation")}
                  </p>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {settings.contactInfo.addressTitle}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {settings.contactInfo.addressText}
                      </p>
                      {settings.contactInfo.addressNote ? (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {settings.contactInfo.addressNote}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {settings.contactInfo.callTitle}
                      </p>
                      <div className="mt-2 space-y-1">
                        {settings.contactInfo.phones.filter(Boolean).map((p) => (
                          <p key={p} className="text-sm text-gray-500 dark:text-gray-400">
                            {p}
                          </p>
                        ))}
                      </div>
                      {settings.contactInfo.callNote ? (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {settings.contactInfo.callNote}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {settings.contactInfo.mailTitle}
                      </p>
                      <div className="mt-2 space-y-1">
                        {settings.contactInfo.emails.filter(Boolean).map((m) => (
                          <p key={m} className="text-sm text-gray-500 dark:text-gray-400">
                            {m}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {settings.contactInfo.businessTitle}
                      </p>
                      <div className="mt-2 space-y-1">
                        {settings.contactInfo.businessRows
                          .filter((r) => r.enabled)
                          .map((r) => (
                            <p
                              key={r.id}
                              className="text-sm text-gray-500 dark:text-gray-400"
                            >
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {r.label}
                              </span>
                              {r.time ? `: ${r.time}` : ""}
                            </p>
                          ))}
                      </div>
                      {settings.contactInfo.businessFooterNote ? (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {settings.contactInfo.businessFooterNote}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Preview */}
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("contactPageSettings.preview.followUs")}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {enabledSocials.length ? (
                    enabledSocials.map((s) => (
                      <a
                        key={s.key}
                        href={s.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-white/[0.03]"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800">
                          {SOCIAL_ICONS[s.key]}
                        </span>
                        {s.label}
                      </a>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("contactPageSettings.preview.noSocialLinks")}
                    </p>
                  )}
                </div>
              </div>

              {/* Map Preview */}
              <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {settings.contactInfo.mapTitle}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {settings.contactInfo.mapSubTitle}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    startIcon={<ExternalLink size={16} />}
                    onClick={() => {
                      if (settings.contactInfo.mapEmbedUrl) {
                        window.open(settings.contactInfo.mapEmbedUrl, "_blank", "noreferrer");
                      }
                    }}
                    disabled={!settings.contactInfo.mapEmbedUrl}
                  >
                    {t("contactPageSettings.socialLinks.open")}
                  </Button>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                  <iframe
                    title="map"
                    src={settings.contactInfo.mapEmbedUrl}
                    className="h-[340px] w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Helper */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("contactPageSettings.helperText")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
