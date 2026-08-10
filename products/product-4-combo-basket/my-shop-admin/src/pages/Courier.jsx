import { useState } from "react";
import {
  Bike,
  Key,
  CheckCircle2,
  ExternalLink,
  Info,
  ToggleLeft,
} from "lucide-react";

const COURIERS = [
  {
    id: "steadfast",
    name: "Steadfast",
    logo: "SF",
    color: "blue",
    website: "https://steadfast.com.bd",
    desc: "বাংলাদেশের শীর্ষ কুরিয়ার সার্ভিস",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "Steadfast API Key" },
      {
        key: "api_secret",
        label: "API Secret",
        placeholder: "Steadfast API Secret",
        type: "password",
      },
    ],
  },
  {
    id: "pathao",
    name: "Pathao",
    logo: "PT",
    color: "red",
    website: "https://pathao.com",
    desc: "দ্রুত ও নির্ভরযোগ্য ডেলিভারি",
    fields: [
      { key: "client_id", label: "Client ID", placeholder: "Pathao Client ID" },
      {
        key: "client_secret",
        label: "Client Secret",
        placeholder: "Pathao Secret",
        type: "password",
      },
      { key: "username", label: "Username", placeholder: "Pathao Username" },
      {
        key: "password",
        label: "Password",
        placeholder: "Pathao Password",
        type: "password",
      },
    ],
  },
  {
    id: "paperfly",
    name: "Paperfly",
    logo: "PF",
    color: "yellow",
    website: "https://paperfly.com.bd",
    desc: "সারাদেশে কভারেজ",
    fields: [
      {
        key: "token",
        label: "API Token",
        placeholder: "Paperfly Token",
        type: "password",
      },
      { key: "store_id", label: "Store ID", placeholder: "Paperfly Store ID" },
    ],
  },
  {
    id: "redx",
    name: "RedX",
    logo: "RX",
    color: "red",
    website: "https://redx.com.bd",
    desc: "রিটার্ন ও ফরওয়ার্ড লজিস্টিক্স",
    fields: [
      {
        key: "api_key",
        label: "API Key",
        placeholder: "RedX API Key",
        type: "password",
      },
    ],
  },
];

const colorMap = {
  blue: { bg: "bg-blue-100", text: "text-blue-700" },
  red: { bg: "bg-red-100", text: "text-red-700" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-700" },
};

export default function Courier() {
  const [active, setActive] = useState("steadfast");
  const [enabled, setEnabled] = useState({ steadfast: true });
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState({});

  const handleSave = (id) => {
    setSaved((p) => ({ ...p, [id]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [id]: false })), 2000);
  };

  const activeCourier = COURIERS.find((c) => c.id === active);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0f172a]">কুরিয়ার সেটিংস</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          কুরিয়ার পার্টনার সংযোগ ও ম্যানেজমেন্ট
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Courier list */}
        <div className="space-y-2">
          {COURIERS.map((c) => {
            const cl = colorMap[c.color] || colorMap.blue;
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  isActive
                    ? "border-[#e91e63]/30 bg-pink-50/50 shadow-sm"
                    : "border-slate-100 bg-white hover:border-slate-200"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cl.bg} text-sm font-bold ${cl.text}`}
                >
                  {c.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${isActive ? "text-[#e91e63]" : "text-[#0f172a]"}`}
                  >
                    {c.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{c.desc}</p>
                </div>
                <div
                  className={`h-2 w-2 rounded-full shrink-0 ${enabled[c.id] ? "bg-emerald-400" : "bg-slate-200"}`}
                />
              </button>
            );
          })}
        </div>

        {/* Config panel */}
        {activeCourier && (
          <div className="lg:col-span-2 card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-[#0f172a]">
                  {activeCourier.name} Integration
                </h3>
                <a
                  href={activeCourier.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-[#e91e63] hover:underline mt-0.5"
                >
                  <ExternalLink className="h-3 w-3" />
                  {activeCourier.website}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {enabled[activeCourier.id] ? "সক্রিয়" : "নিষ্ক্রিয়"}
                </span>
                <button
                  onClick={() =>
                    setEnabled((p) => ({
                      ...p,
                      [activeCourier.id]: !p[activeCourier.id],
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled[activeCourier.id] ? "bg-emerald-500" : "bg-slate-200"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled[activeCourier.id] ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <Key className="h-3.5 w-3.5 shrink-0" />
              API keys নিরাপদে এনক্রিপ্ট করে সংরক্ষণ করা হয়
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {activeCourier.fields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    {f.label}
                  </label>
                  <input
                    type={f.type || "text"}
                    placeholder={f.placeholder}
                    className="input"
                    value={form[`${activeCourier.id}_${f.key}`] || ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        [`${activeCourier.id}_${f.key}`]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleSave(activeCourier.id)}
                className={`btn-primary ${saved[activeCourier.id] ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
              >
                {saved[activeCourier.id] ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    সংরক্ষিত!
                  </>
                ) : (
                  "সংরক্ষণ করুন"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
