"use client";

import { useState } from "react";
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  Edit3,
  Trash2,
  CheckCircle2,
  Phone,
} from "lucide-react";

type AddressType = "home" | "office" | "other";

const initialAddresses = [
  {
    id: 1,
    label: "Home",
    type: "home" as AddressType,
    name: "Guest User",
    phone: "+880 1234-567890",
    address: "123 Dhanmondi Road, House #45",
    area: "Dhanmondi",
    city: "Dhaka",
    zip: "1205",
    isDefault: true,
  },
  {
    id: 2,
    label: "Office",
    type: "office" as AddressType,
    name: "Guest User",
    phone: "+880 9876-543210",
    address: "Tech Tower, Floor 5, Room 12",
    area: "Gulshan",
    city: "Dhaka",
    zip: "1212",
    isDefault: false,
  },
];

const typeConfig: Record<
  AddressType,
  { icon: React.ElementType; bg: string; color: string }
> = {
  home: { icon: Home, bg: "bg-[#e91e63]/10", color: "text-[#e91e63]" },
  office: { icon: Briefcase, bg: "bg-blue-100", color: "text-blue-600" },
  other: { icon: MapPin, bg: "bg-amber-100", color: "text-amber-600" },
};

export default function AddressPage() {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showForm, setShowForm] = useState(false);

  const setDefault = (id: number) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const deleteAddress = (id: number) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="shadow-card animate-fade-in-up rounded-2xl bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e91e63]/10">
              <MapPin className="h-5 w-5 text-[#e91e63]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0f172a]">
                My Addresses
              </h2>
              <p className="text-xs text-slate-400">
                {addresses.length} saved addresses
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-pink px-4 py-2.5 text-xs"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="shadow-card animate-scale-in rounded-2xl bg-white p-6">
          <h3 className="mb-5 text-sm font-semibold text-[#0f172a]">
            New Address
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Phone
              </label>
              <input type="tel" placeholder="+880..." className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Full Address
              </label>
              <input
                type="text"
                placeholder="House no, road, area..."
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                City
              </label>
              <input type="text" placeholder="Dhaka" className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Postal Code
              </label>
              <input type="text" placeholder="1205" className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Address Type
              </label>
              <div className="flex gap-2">
                {(["home", "office", "other"] as AddressType[]).map((type) => {
                  const cfg = typeConfig[type];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={type}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 capitalize transition-all hover:border-[#e91e63] hover:text-[#e91e63]"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="btn-outline px-5 py-2.5 text-xs"
            >
              Cancel
            </button>
            <button className="btn-pink px-5 py-2.5 text-xs">
              Save Address
            </button>
          </div>
        </div>
      )}

      {/* Address Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {addresses.map((addr, i) => {
          const cfg = typeConfig[addr.type];
          const Icon = cfg.icon;
          return (
            <div
              key={addr.id}
              className={`shadow-card animate-fade-in-up rounded-2xl bg-white p-5 transition-all duration-200 ${
                addr.isDefault
                  ? "ring-2 ring-[#e91e63]/30"
                  : "hover:shadow-card-hover"
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Card Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${cfg.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <span className="text-sm font-semibold text-[#0f172a]">
                    {addr.label}
                  </span>
                </div>
                {addr.isDefault && (
                  <span className="flex items-center gap-1 rounded-full bg-[#e91e63]/10 px-2.5 py-1 text-[10px] font-semibold text-[#e91e63]">
                    <CheckCircle2 className="h-3 w-3" />
                    Default
                  </span>
                )}
              </div>

              {/* Address Details */}
              <p className="text-sm font-medium text-[#0f172a]">{addr.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {addr.address}, {addr.area}
                <br />
                {addr.city} - {addr.zip}, Bangladesh
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <Phone className="h-3 w-3" />
                {addr.phone}
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-slate-50 pt-4">
                {!addr.isDefault && (
                  <button
                    onClick={() => setDefault(addr.id)}
                    className="flex-1 rounded-xl bg-[#e91e63]/10 py-2 text-xs font-semibold text-[#e91e63] transition-all hover:bg-[#e91e63]/20"
                  >
                    Set as Default
                  </button>
                )}
                <button className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-blue-100 hover:text-blue-600">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteAddress(addr.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-red-100 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty add card */}
        <button
          onClick={() => setShowForm(true)}
          className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400 transition-all duration-200 hover:border-[#e91e63]/50 hover:text-[#e91e63]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-[#e91e63]/10">
            <Plus className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium">Add New Address</span>
        </button>
      </div>
    </div>
  );
}
