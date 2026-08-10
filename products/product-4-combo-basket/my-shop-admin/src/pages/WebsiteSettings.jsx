import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  CheckCircle2,
  Globe,
  Phone,
  Share2,
  BookOpen,
  Layout,
  AlignLeft,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../lib/api";

// ─── API Hooks ─────────────────────────────────────────────────────────────────
function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await api.get("/site-settings");
      return data.settings;
    },
    staleTime: 30_000,
  });
}

function useUpdateSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put("/site-settings", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-settings"] }),
  });
}

// ─── Tab metadata ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "general", label: "সাধারণ তথ্য", icon: Globe },
  { id: "contact", label: "যোগাযোগ", icon: Phone },
  { id: "social", label: "সোশ্যাল মিডিয়া", icon: Share2 },
  { id: "about", label: "আমাদের সম্পর্কে", icon: BookOpen },
  { id: "home", label: "হোম পেজ", icon: Layout },
  { id: "footer", label: "ফুটার", icon: AlignLeft },
];

// ─── Small reusable components ────────────────────────────────────────────────
function Field({ label, helpText, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      {children}
      {helpText && (
        <p className="mt-1 text-[10px] text-slate-400">{helpText}</p>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, ...rest }) {
  return (
    <input
      className="input"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  );
}

function TextareaInput({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      className="input resize-none"
      rows={rows}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Toggle({ label, helpText, checked, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[#0f172a]">{label}</p>
        {helpText && <p className="text-xs text-slate-400">{helpText}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          checked ? "bg-[#e91e63]" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// ─── JSON Array Editor (for links / stats / team) ─────────────────────────────
function ArrayEditor({ items = [], onChange, fields, addLabel }) {
  const [collapsed, setCollapsed] = useState({});

  const add = () => {
    const blank = Object.fromEntries(fields.map((f) => [f.key, ""]));
    onChange([...items, blank]);
  };

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  const update = (i, key, val) => {
    const next = items.map((item, idx) =>
      idx === i ? { ...item, [key]: val } : item,
    );
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOpen = !collapsed[i];
        const preview = item[fields[0].key] || `আইটেম ${i + 1}`;
        return (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden"
          >
            {/* Row header */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [i]: isOpen }))}
                className="flex flex-1 items-center gap-2 text-left text-sm font-medium text-[#0f172a]"
              >
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                )}
                {preview}
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-2 text-red-400 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {/* Fields */}
            {isOpen && (
              <div className="grid gap-3 border-t border-slate-100 px-4 py-3 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-[10px] font-semibold text-slate-500">
                      {f.label}
                    </label>
                    <input
                      className="input text-xs"
                      value={item[f.key] ?? ""}
                      onChange={(e) => update(i, f.key, e.target.value)}
                      placeholder={f.placeholder || f.label}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 rounded-xl border border-dashed border-[#e91e63]/50 px-4 py-2 text-xs font-medium text-[#e91e63] hover:bg-[#e91e63]/5 transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        {addLabel || "যোগ করুন"}
      </button>
    </div>
  );
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────
function GeneralTab({ form, setField }) {
  return (
    <div className="space-y-4">
      <Field label="সাইটের নাম">
        <TextInput
          value={form.site_name}
          onChange={(v) => setField("site_name", v)}
          placeholder="ComboBasket"
        />
      </Field>
      <Field
        label="ট্যাগলাইন"
        helpText="ছোট বর্ণনা — ব্রাউজার ট্যাব ও SEO তে ব্যবহৃত হয়"
      >
        <TextInput
          value={form.site_tagline}
          onChange={(v) => setField("site_tagline", v)}
          placeholder="বাংলাদেশের সেরা কম্বো ও গিফট শপ"
        />
      </Field>
      <Field
        label="সাইটের বিবরণ"
        helpText="Footer ও meta description-এ দেখা যাবে"
      >
        <TextareaInput
          value={form.site_description}
          onChange={(v) => setField("site_description", v)}
          rows={4}
        />
      </Field>
    </div>
  );
}

function ContactTab({ form, setField }) {
  return (
    <div className="space-y-4">
      <Field label="ঠিকানা">
        <TextInput
          value={form.contact_address}
          onChange={(v) => setField("contact_address", v)}
          placeholder="১২৩ মেইন স্ট্রিট, ঢাকা"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ফোন নম্বর">
          <TextInput
            value={form.contact_phone}
            onChange={(v) => setField("contact_phone", v)}
            placeholder="+৮৮০ ১৭XXXXXXXX"
          />
        </Field>
        <Field label="ইমেইল">
          <TextInput
            type="email"
            value={form.contact_email}
            onChange={(v) => setField("contact_email", v)}
            placeholder="support@example.com"
          />
        </Field>
      </div>
      <Field label="অফিস সময়">
        <TextInput
          value={form.contact_hours}
          onChange={(v) => setField("contact_hours", v)}
          placeholder="শনি–বৃহস্পতি: সকাল ১০টা – রাত ৮টা"
        />
      </Field>
      <Field
        label="WhatsApp নম্বর"
        helpText="শুধু সংখ্যা — যেমন: 8801712345678"
      >
        <TextInput
          value={form.whatsapp_number}
          onChange={(v) => setField("whatsapp_number", v)}
          placeholder="8801712345678"
        />
      </Field>
    </div>
  );
}

function SocialTab({ form, setField }) {
  const socials = [
    { key: "social_facebook", label: "Facebook URL" },
    { key: "social_instagram", label: "Instagram URL" },
    { key: "social_twitter", label: "Twitter / X URL" },
    { key: "social_whatsapp", label: "WhatsApp URL" },
  ];
  return (
    <div className="space-y-4">
      {socials.map(({ key, label }) => (
        <Field key={key} label={label}>
          <TextInput
            value={form[key]}
            onChange={(v) => setField(key, v)}
            placeholder="https://..."
          />
        </Field>
      ))}
    </div>
  );
}

function AboutTab({ form, setField }) {
  const statsFields = [
    { key: "value", label: "মান", placeholder: "১০হা+" },
    { key: "label", label: "লেবেল", placeholder: "সন্তুষ্ট গ্রাহক" },
  ];
  const valueFields = [
    { key: "icon", label: "Icon নাম", placeholder: "Gem" },
    { key: "title", label: "শিরোনাম", placeholder: "মানের প্রতি অঙ্গীকার" },
    { key: "desc", label: "বিবরণ", placeholder: "বর্ণনা লিখুন..." },
  ];
  const teamFields = [
    { key: "name", label: "নাম", placeholder: "Sarah Ahmed" },
    { key: "role", label: "পদবী", placeholder: "প্রধান নির্বাহী" },
    { key: "icon", label: "Icon", placeholder: "Briefcase" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#0f172a] border-b pb-2">
          হিরো সেকশন
        </h3>
        <Field label="প্রধান শিরোনাম">
          <TextInput
            value={form.about_hero_title}
            onChange={(v) => setField("about_hero_title", v)}
          />
        </Field>
        <Field label="উপশিরোনাম">
          <TextareaInput
            value={form.about_hero_subtitle}
            onChange={(v) => setField("about_hero_subtitle", v)}
            rows={2}
          />
        </Field>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#0f172a] border-b pb-2">
          আমাদের গল্প
        </h3>
        <Field label="গল্পের বিবরণ">
          <TextareaInput
            value={form.about_story}
            onChange={(v) => setField("about_story", v)}
            rows={5}
          />
        </Field>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#0f172a] border-b pb-2">
          পরিসংখ্যান (Stats)
        </h3>
        <ArrayEditor
          items={form.about_stats}
          onChange={(v) => setField("about_stats", v)}
          fields={statsFields}
          addLabel="নতুন Stat যোগ করুন"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#0f172a] border-b pb-2">
          মূল্যবোধ (Values)
        </h3>
        <p className="text-xs text-slate-400">
          Icon নাম: Gem, Rocket, Heart, Lock, Shield, Star ইত্যাদি (Lucide
          icons)
        </p>
        <ArrayEditor
          items={form.about_values}
          onChange={(v) => setField("about_values", v)}
          fields={valueFields}
          addLabel="নতুন Value যোগ করুন"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#0f172a] border-b pb-2">
          আমাদের দল (Team)
        </h3>
        <p className="text-xs text-slate-400">
          Icon নাম: Briefcase, Code, Palette, Users ইত্যাদি (Lucide icons)
        </p>
        <ArrayEditor
          items={form.about_team}
          onChange={(v) => setField("about_team", v)}
          fields={teamFields}
          addLabel="নতুন সদস্য যোগ করুন"
        />
      </div>
    </div>
  );
}

function HomeTab({ form, setField }) {
  const sections = [
    {
      key: "home_show_categories",
      label: "ক্যাটাগরি সেকশন",
      helpText: "ক্যাটাগরি স্লাইডার",
    },
    {
      key: "home_show_featured",
      label: "বিশেষ পণ্য সমূহ",
      helpText: "Featured products grid",
    },
    {
      key: "home_show_category_sections",
      label: "ক্যাটাগরি পণ্য সেকশন",
      helpText: "Dynamic category product sections",
    },
    {
      key: "home_show_process_steps",
      label: "অর্ডার প্রক্রিয়া",
      helpText: "How to order — step কার্ড",
    },
    {
      key: "home_show_testimonials",
      label: "গ্রাহক পর্যালোচনা",
      helpText: "Testimonials slider",
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        হোম পেজের প্রতিটি সেকশন চালু বা বন্ধ করুন।
      </p>
      {sections.map(({ key, label, helpText }) => (
        <Toggle
          key={key}
          label={label}
          helpText={helpText}
          checked={!!form[key]}
          onChange={(v) => setField(key, v)}
        />
      ))}
    </div>
  );
}

function FooterTab({ form, setField }) {
  const linkFields = [
    { key: "label", label: "লেবেল", placeholder: "সকল পণ্য" },
    { key: "href", label: "লিংক", placeholder: "/products" },
  ];

  return (
    <div className="space-y-6">
      <Field label="ফুটার ট্যাগলাইন">
        <TextareaInput
          value={form.footer_tagline}
          onChange={(v) => setField("footer_tagline", v)}
          rows={3}
        />
      </Field>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#0f172a] border-b pb-2">
          দ্রুত লিংক
        </h3>
        <ArrayEditor
          items={form.footer_quick_links}
          onChange={(v) => setField("footer_quick_links", v)}
          fields={linkFields}
          addLabel="লিংক যোগ করুন"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#0f172a] border-b pb-2">
          কোম্পানি লিংক
        </h3>
        <ArrayEditor
          items={form.footer_company_links}
          onChange={(v) => setField("footer_company_links", v)}
          fields={linkFields}
          addLabel="লিংক যোগ করুন"
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#0f172a] border-b pb-2">
          সাপোর্ট লিংক
        </h3>
        <ArrayEditor
          items={form.footer_support_links}
          onChange={(v) => setField("footer_support_links", v)}
          fields={linkFields}
          addLabel="লিংক যোগ করুন"
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WebsiteSettingsPage() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateMut = useUpdateSiteSettings();
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  // Sync form when data loads (only once)
  if (settings && form === null) {
    setForm({ ...settings });
  }

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form) return;
    updateMut.mutate(form, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      },
    });
  };

  if (isLoading || form === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#e91e63]" />
      </div>
    );
  }

  const tabContent = {
    general: <GeneralTab form={form} setField={setField} />,
    contact: <ContactTab form={form} setField={setField} />,
    social: <SocialTab form={form} setField={setField} />,
    about: <AboutTab form={form} setField={setField} />,
    home: <HomeTab form={form} setField={setField} />,
    footer: <FooterTab form={form} setField={setField} />,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">ওয়েবসাইট সেটিংস</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            সাইটের সব dynamic content এখান থেকে পরিবর্তন করুন
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMut.isPending}
          className={`btn-primary ${saved ? "!bg-emerald-500 hover:!bg-emerald-600" : ""}`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> সংরক্ষিত!
            </>
          ) : updateMut.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> সেভ হচ্ছে...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> সংরক্ষণ করুন
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {updateMut.isError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {updateMut.error?.response?.data?.message || "সেভ করতে সমস্যা হয়েছে"}
        </div>
      )}

      {/* Tab Bar + Panel */}
      <div className="card !p-0 overflow-hidden">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/60">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 items-center gap-2 px-5 py-3.5 text-xs font-semibold transition-all duration-200 border-b-2 ${
                activeTab === id
                  ? "border-[#e91e63] bg-white text-[#e91e63]"
                  : "border-transparent text-slate-500 hover:text-[#0f172a] hover:bg-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="p-6">{tabContent[activeTab]}</div>
      </div>
    </div>
  );
}
