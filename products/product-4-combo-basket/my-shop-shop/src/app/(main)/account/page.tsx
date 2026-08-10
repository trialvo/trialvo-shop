"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Shield,
  Star,
  ShoppingBag,
  MapPin,
  Edit3,
} from "lucide-react";

const stats = [
  {
    label: "Total Orders",
    value: "12",
    icon: ShoppingBag,
    color: "text-[#e91e63]",
    bg: "bg-[#e91e63]/10",
  },
  {
    label: "Saved Addresses",
    value: "2",
    icon: MapPin,
    color: "text-violet-500",
    bg: "bg-violet-100",
  },
  {
    label: "Wishlist Items",
    value: "5",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-100",
  },
  {
    label: "Account Points",
    value: "240",
    icon: Shield,
    color: "text-emerald-500",
    bg: "bg-emerald-100",
  },
];

export default function AccountProfilePage() {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "Guest User",
    email: "guest@myshop.com",
    phone: "+880 1234-567890",
    gender: "prefer_not",
    dob: "",
  });

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="shadow-card animate-fade-in-up rounded-2xl bg-white p-5 text-center"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div
              className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-[#0f172a]">{stat.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Profile Edit Card */}
      <div
        className="shadow-card animate-fade-in-up rounded-2xl bg-white"
        style={{ animationDelay: "120ms" }}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e91e63]/10">
              <User className="h-4 w-4 text-[#e91e63]" />
            </div>
            <h2 className="text-base font-semibold text-[#0f172a]">
              Personal Information
            </h2>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              editing
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-[#e91e63]/10 text-[#e91e63] hover:bg-[#e91e63]/20"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        <div className="p-6">
          {/* Avatar Upload */}
          <div className="mb-8 flex items-center gap-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e91e63] to-[#ff4081] shadow-lg">
                <User className="h-9 w-9 text-white" />
              </div>
              {editing && (
                <button className="absolute -right-1.5 -bottom-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#0f172a] text-white shadow-md transition-transform hover:scale-110">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-[#0f172a]">
                {form.name}
              </p>
              <p className="text-sm text-slate-400">{form.email}</p>
              {editing && (
                <p className="mt-1.5 text-[11px] text-slate-400">
                  JPG, PNG or GIF — max 2MB
                </p>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Full Name
              </label>
              {editing ? (
                <div className="relative">
                  <User className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field pl-10"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-[#0f172a]">
                  <User className="h-4 w-4 text-slate-400" />
                  {form.name}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Email Address
              </label>
              {editing ? (
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="input-field pl-10"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-[#0f172a]">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {form.email}
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Phone Number
              </label>
              {editing ? (
                <div className="relative">
                  <Phone className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="input-field pl-10"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-[#0f172a]">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {form.phone}
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Gender
              </label>
              {editing ? (
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="input-field"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="prefer_not">Prefer not to say</option>
                </select>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-[#0f172a]">
                  Prefer not to say
                </div>
              )}
            </div>
          </div>

          {editing && (
            <div className="mt-6 flex justify-end">
              <button className="btn-pink px-6 py-2.5 text-sm">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account Security */}
      <div
        className="shadow-card animate-fade-in-up rounded-2xl bg-white"
        style={{ animationDelay: "180ms" }}
      >
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
            <Shield className="h-4 w-4 text-emerald-600" />
          </div>
          <h2 className="text-base font-semibold text-[#0f172a]">
            Account Security
          </h2>
        </div>
        <div className="divide-y divide-slate-50 px-6">
          {[
            {
              label: "Password",
              value: "Last changed 3 months ago",
              action: "Change",
            },
            {
              label: "Two-Factor Auth",
              value: "Not enabled",
              action: "Enable",
            },
            {
              label: "Login Sessions",
              value: "1 active session",
              action: "Manage",
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
                <p className="text-xs text-slate-400">{item.value}</p>
              </div>
              <button className="btn-outline px-4 py-2 text-xs">
                {item.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
