"use client";

import { useState } from "react";
import { useShopConfig } from "@/context/ShopConfigContext";
import { DEFAULT_SHOP_CONFIG, ModeConfig } from "@/config/shopConfig";
import {
  Lock,
  Settings,
  Gift,
  ShoppingBag,
  Save,
  RotateCcw,
  CheckCircle2,
  Truck,
  Tag,
  ChevronRight,
} from "lucide-react";

const PIN = "1234";

function ConfigSection({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  cfg,
  onChange,
}: {
  title: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  cfg: ModeConfig;
  onChange: (patch: Partial<ModeConfig>) => void;
}) {
  return (
    <div className="shadow-card rounded-2xl bg-white p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-4.5 w-4.5 ${iconColor}`} />
        </div>
        <h2 className="text-sm font-bold text-[#0f172a]">{title}</h2>
      </div>

      <div className="space-y-5">
        {/* Discount */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Tag className="h-3 w-3 text-[#e91e63]" />
            ডিসকাউন্ট ({cfg.discountType === 'percent' ? '%' : '৳'})
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={50}
              value={cfg.discountAmount}
              onChange={(e) => onChange({ discountAmount: Number(e.target.value) })}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#e91e63]"
            />
            <span className="w-14 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-center text-sm font-bold text-[#e91e63]">
              {cfg.discountAmount}{cfg.discountType === 'percent' ? '%' : '৳'}
            </span>
          </div>
        </div>

        {/* Minimum order for discount & free delivery */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <Truck className="h-3 w-3 text-blue-500" />
            মিনিমাম অর্ডার ভ্যালু (BDT)
          </label>
          <div className="relative">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-bold text-slate-400">
              BDT
            </span>
            <input
              type="number"
              min={0}
              step={50}
              value={cfg.minAmountForDiscount}
              onChange={(e) => onChange({ minAmountForDiscount: Number(e.target.value) })}
              className="input-field w-full pl-12"
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            ডিসকাউন্ট ও ফ্রি ডেলিভারি পাওয়ার মিনিমাম অর্ডার
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          প্রিভিউ
        </p>
        <div className="space-y-1.5 text-xs text-slate-600">
          <p>
            • স্ট্যাটাস:{" "}
            <span className={`font-semibold ${cfg.isActive ? "text-emerald-600" : "text-rose-500"}`}>
              {cfg.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
            </span>
          </p>
          <p>
            • BDT 500 অর্ডারে:{" "}
            <span className="font-semibold text-[#e91e63]">
              {cfg.discountType === 'percent'
                ? `-${Math.round(500 * cfg.discountAmount / 100)}BDT ডিসকাউন্ট`
                : `-${cfg.discountAmount}BDT ডিসকাউন্ট`}
            </span>
          </p>
          <p>
            • মিনিমাম অর্ডার:{" "}
            <span className="font-semibold">
              {cfg.minAmountForDiscount > 0 ? `BDT ${cfg.minAmountForDiscount}` : "কোনো সীমা নেই"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { config, updateConfig, resetConfig } = useShopConfig();
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [saved, setSaved] = useState(false);

  // Local draft state (only saved when clicking Save)
  const [draft, setDraft] = useState(config);

  const handleUnlock = () => {
    if (pin === PIN) {
      setUnlocked(true);
      setPinError(false);
      setDraft(config); // refresh draft from current config
    } else {
      setPinError(true);
    }
  };

  const handleSave = () => {
    updateConfig(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setDraft(DEFAULT_SHOP_CONFIG);
    resetConfig();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] px-4">
        <div className="shadow-card w-full max-w-sm rounded-2xl bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0f172a]">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-lg font-bold text-[#0f172a]">Admin Panel</h1>
          <p className="mt-1 text-xs text-slate-400">PIN দিয়ে প্রবেশ করুন</p>

          <input
            type="password"
            maxLength={4}
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setPinError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            className={`input-field mt-6 w-full text-center text-2xl tracking-[0.5em] ${pinError ? "border-red-400 ring-1 ring-red-400" : ""
              }`}
          />
          {pinError && (
            <p className="mt-2 text-xs text-red-500">ভুল PIN। আবার চেষ্টা করুন।</p>
          )}
          <button
            onClick={handleUnlock}
            className="btn-pink mt-4 flex w-full items-center justify-center gap-2 py-3 text-sm"
          >
            <ChevronRight className="h-4 w-4" />
            প্রবেশ করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] px-4 py-8">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e91e63]/20">
              <Settings className="h-5 w-5 text-[#e91e63]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Shop Admin Panel</h1>
              <p className="text-xs text-slate-400">ডিসকাউন্ট ও ডেলিভারি রুলস পরিবর্তন করুন</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-slate-600 px-3 py-2 text-xs text-slate-300 transition-all hover:border-slate-400 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              রিসেট
            </button>
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${saved
                ? "bg-emerald-500 text-white"
                : "bg-[#e91e63] text-white hover:bg-[#c2185b]"
                }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  সেভ হয়েছে!
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  সেভ করুন
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Combo Rules */}
          <ConfigSection
            title="কম্বো অর্ডার সেটিংস"
            icon={Gift}
            iconBg="bg-[#e91e63]/10"
            iconColor="text-[#e91e63]"
            cfg={draft.combo}
            onChange={(patch) => setDraft((d) => ({ ...d, combo: { ...d.combo, ...patch } }))}
          />

          {/* Single Rules */}
          <ConfigSection
            title="সিঙ্গেল অর্ডার সেটিংস"
            icon={ShoppingBag}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            cfg={draft.single}
            onChange={(patch) => setDraft((d) => ({ ...d, single: { ...d.single, ...patch } }))}
          />
        </div>

        {/* Save reminder */}
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-xs text-amber-700">
          পরিবর্তন করার পরে উপরের{" "}
          <strong>"সেভ করুন"</strong> বাটনে ক্লিক করুন। সেটিংস browser-এ সংরক্ষিত থাকবে।
        </div>
      </div>
    </div>
  );
}
