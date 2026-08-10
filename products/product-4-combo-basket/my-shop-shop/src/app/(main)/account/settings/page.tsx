"use client";

import { useState } from "react";
import {
  Settings,
  Bell,
  Globe,
  Moon,
  Lock,
  Trash2,
  ChevronRight,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
        checked ? "bg-[#e91e63]" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SectionHeader({
  icon: Icon,
  label,
  bg,
  color,
}: {
  icon: React.ElementType;
  label: string;
  bg: string;
  color: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 border-b border-slate-100 px-6 py-4`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl ${bg}`}
      >
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <h3 className="text-sm font-semibold text-[#0f172a]">{label}</h3>
    </div>
  );
}

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    sms: false,
  });
  const [preferences, setPreferences] = useState({
    darkMode: false,
    language: "english",
    currency: "BDT",
  });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="shadow-card animate-fade-in-up rounded-2xl bg-white px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e91e63]/10">
            <Settings className="h-5 w-5 text-[#e91e63]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">Settings</h2>
            <p className="text-xs text-slate-400">
              Manage your account preferences
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div
        className="shadow-card animate-fade-in-up rounded-2xl bg-white"
        style={{ animationDelay: "60ms" }}
      >
        <SectionHeader
          icon={Bell}
          label="Notifications"
          bg="bg-amber-100"
          color="text-amber-600"
        />
        <div className="divide-y divide-slate-50 px-6">
          {[
            {
              key: "orderUpdates",
              label: "Order Updates",
              desc: "Get notified about your order status",
            },
            {
              key: "promotions",
              label: "Promotions & Deals",
              desc: "Receive discount and special offer alerts",
            },
            {
              key: "newsletter",
              label: "Newsletter",
              desc: "Weekly curated product recommendations",
            },
            {
              key: "sms",
              label: "SMS Alerts",
              desc: "Text message notifications for orders",
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-4"
            >
              <div>
                <p className="text-sm font-medium text-[#0f172a]">
                  {item.label}
                </p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <ToggleSwitch
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={(v) =>
                  setNotifications((prev) => ({ ...prev, [item.key]: v }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div
        className="shadow-card animate-fade-in-up rounded-2xl bg-white"
        style={{ animationDelay: "120ms" }}
      >
        <SectionHeader
          icon={Globe}
          label="Preferences"
          bg="bg-blue-100"
          color="text-blue-600"
        />
        <div className="divide-y divide-slate-50 px-6">
          {/* Dark Mode */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Moon className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-[#0f172a]">Dark Mode</p>
                <p className="text-xs text-slate-400">Switch to dark theme</p>
              </div>
            </div>
            <ToggleSwitch
              checked={preferences.darkMode}
              onChange={(v) =>
                setPreferences((prev) => ({ ...prev, darkMode: v }))
              }
            />
          </div>

          {/* Language */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-[#0f172a]">Language</p>
              <p className="text-xs text-slate-400">
                Choose your preferred language
              </p>
            </div>
            <select
              value={preferences.language}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  language: e.target.value,
                }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-[#0f172a] outline-none focus:border-[#e91e63]"
            >
              <option value="english">English</option>
              <option value="bengali">বাংলা</option>
            </select>
          </div>

          {/* Currency */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-[#0f172a]">Currency</p>
              <p className="text-xs text-slate-400">
                Display prices in your currency
              </p>
            </div>
            <select
              value={preferences.currency}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  currency: e.target.value,
                }))
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-[#0f172a] outline-none focus:border-[#e91e63]"
            >
              <option value="BDT">BDT (BDT )</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div
        className="shadow-card animate-fade-in-up rounded-2xl bg-white"
        style={{ animationDelay: "180ms" }}
      >
        <SectionHeader
          icon={Lock}
          label="Change Password"
          bg="bg-violet-100"
          color="text-violet-600"
        />
        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="input-field pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
              New Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field"
            />
          </div>
          <div className="flex justify-end">
            <button className="btn-pink px-5 py-2.5 text-sm">
              <Shield className="h-4 w-4" />
              Update Password
            </button>
          </div>
        </div>
      </div>

      {/* Privacy & Data */}
      <div
        className="shadow-card animate-fade-in-up rounded-2xl bg-white"
        style={{ animationDelay: "240ms" }}
      >
        <SectionHeader
          icon={Shield}
          label="Privacy & Data"
          bg="bg-emerald-100"
          color="text-emerald-600"
        />
        <div className="divide-y divide-slate-50 px-6">
          {[
            {
              label: "Download My Data",
              desc: "Get a copy of all your data",
              action: "Download",
            },
            {
              label: "Cookie Preferences",
              desc: "Manage how we use cookies",
              action: "Manage",
            },
            {
              label: "Privacy Policy",
              desc: "Read our full privacy policy",
              action: "View",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-4"
            >
              <div>
                <p className="text-sm font-medium text-[#0f172a]">
                  {item.label}
                </p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <button className="flex items-center gap-1 text-xs font-medium text-[#e91e63] hover:underline">
                {item.action}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div
        className="animate-fade-in-up rounded-2xl border border-red-100 bg-red-50 p-5"
        style={{ animationDelay: "300ms" }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100">
            <Trash2 className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Delete Account</p>
            <p className="mt-0.5 text-xs text-red-500">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
          </div>
          <button className="shrink-0 rounded-xl bg-red-100 px-4 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-200">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
