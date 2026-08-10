import { useState } from "react";
import {
  CreditCard,
  Smartphone,
  Banknote,
  ChevronRight,
  CheckCircle2,
  Info,
} from "lucide-react";

const METHODS = [
  {
    id: "cod",
    name: "Cash on Delivery",
    namebn: "ক্যাশ অন ডেলিভারি",
    icon: Banknote,
    color: "emerald",
    desc: "পণ্য ডেলিভারির সময় ক্যাশ পেমেন্ট গ্রহণ",
    fields: [],
  },
  {
    id: "bkash",
    name: "bKash",
    namebn: "বিকাশ",
    icon: Smartphone,
    color: "pink",
    desc: "বিকাশ মোবাইল ব্যাংকিং পেমেন্ট গেটওয়ে",
    fields: [
      {
        key: "merchant_number",
        label: "Merchant Number",
        placeholder: "01XXXXXXXXX",
      },
      { key: "app_key", label: "App Key", placeholder: "bKash App Key" },
      {
        key: "app_secret",
        label: "App Secret",
        placeholder: "bKash App Secret",
        type: "password",
      },
      { key: "username", label: "Username", placeholder: "bKash API Username" },
      {
        key: "password",
        label: "Password",
        placeholder: "bKash API Password",
        type: "password",
      },
    ],
  },
  {
    id: "nagad",
    name: "Nagad",
    namebn: "নগদ",
    icon: Smartphone,
    color: "orange",
    desc: "নগদ মোবাইল ব্যাংকিং পেমেন্ট",
    fields: [
      {
        key: "merchant_id",
        label: "Merchant ID",
        placeholder: "Nagad Merchant ID",
      },
      {
        key: "public_key",
        label: "Public Key",
        placeholder: "Nagad Public Key",
      },
      {
        key: "private_key",
        label: "Private Key",
        placeholder: "Nagad Private Key",
        type: "password",
      },
    ],
  },
  {
    id: "card",
    name: "Card Payment",
    namebn: "কার্ড পেমেন্ট",
    icon: CreditCard,
    color: "blue",
    desc: "ক্রেডিট / ডেবিট কার্ড (SSLCommerz / SSLC)",
    fields: [
      {
        key: "store_id",
        label: "Store ID",
        placeholder: "SSLCommerz Store ID",
      },
      {
        key: "store_password",
        label: "Store Password",
        placeholder: "SSLCommerz Password",
        type: "password",
      },
    ],
  },
];

const colorMap = {
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: "text-emerald-600",
    ring: "ring-emerald-200",
  },
  pink: {
    bg: "bg-pink-50",
    border: "border-pink-200",
    text: "text-pink-700",
    icon: "text-pink-600",
    ring: "ring-pink-200",
  },
  orange: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: "text-orange-600",
    ring: "ring-orange-200",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: "text-blue-600",
    ring: "ring-blue-200",
  },
};

export default function Payment() {
  const [enabled, setEnabled] = useState({ cod: true });
  const [active, setActive] = useState(null);
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState({});

  const handleSave = (id) => {
    setSaved((p) => ({ ...p, [id]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [id]: false })), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0f172a]">পেমেন্ট সেটিংস</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          পেমেন্ট পদ্ধতি সক্রিয় করুন ও কনফিগার করুন
        </p>
      </div>

      <div className="space-y-4">
        {METHODS.map((m) => {
          const c = colorMap[m.color];
          const isEnabled = enabled[m.id];
          const isExpanded = active === m.id;

          return (
            <div
              key={m.id}
              className={`card !p-0 overflow-hidden transition-all duration-200 ${isEnabled ? `ring-2 ${c.ring}` : ""}`}
            >
              {/* Header row */}
              <div className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.bg} shrink-0`}
                >
                  <m.icon className={`h-5 w-5 ${c.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0f172a] text-sm">
                    {m.namebn}
                  </p>
                  <p className="text-xs text-slate-400">{m.desc}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Toggle */}
                  <button
                    onClick={() =>
                      setEnabled((p) => ({ ...p, [m.id]: !p[m.id] }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isEnabled ? "bg-[#e91e63]" : "bg-slate-200"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isEnabled ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                  {m.fields.length > 0 && (
                    <button
                      onClick={() => setActive(isExpanded ? null : m.id)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-all ${isExpanded ? "bg-slate-100 rotate-90" : ""}`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Fields */}
              {isExpanded && m.fields.length > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    API credentials নিরাপদভাবে এনক্রিপ্ট করে সংরক্ষিত হয়
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {m.fields.map((f) => (
                      <div key={f.key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {f.label}
                        </label>
                        <input
                          type={f.type || "text"}
                          placeholder={f.placeholder}
                          className="input"
                          value={form[`${m.id}_${f.key}`] || ""}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              [`${m.id}_${f.key}`]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleSave(m.id)}
                      className={`btn-primary ${saved[m.id] ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                    >
                      {saved[m.id] ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" /> সংরক্ষিত!
                        </>
                      ) : (
                        "সংরক্ষণ করুন"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
