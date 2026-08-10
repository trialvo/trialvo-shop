import { useState, useEffect, useCallback } from "react";
import {
  Save,
  CheckCircle2,
  Info,
  Package,
  ShoppingBag,
  Gift,
  Truck,
  Loader2,
} from "lucide-react";
import Input from "../components/ui/Input";
import { useShopConfig, useUpdateShopConfig } from "../hooks/useShopConfig";
import { toast } from "sonner";

/* ─── Helper: build default mode state from API data ─── */
const buildModeState = (apiMode) => ({
  isActive: apiMode?.isActive ?? true,
  minAmountForDiscount: Number(apiMode?.minAmountForDiscount) || 0,
  deliveryConfig: apiMode?.deliveryConfig ?? {},
});

/* ─────────────────────────────────────────────────────── */
/*  PricingPanel — one card per order mode                 */
/* ─────────────────────────────────────────────────────── */
function PricingPanel({
  title,
  icon: Icon,
  color,
  modeState,
  setModeState,
  onSave,
  onToggleActive,
  isSaving,
  isSaved,
  allDeliveryZones,
}) {
  const { isActive, minAmountForDiscount, deliveryConfig } = modeState;

  const update = (key, value) =>
    setModeState((prev) => ({ ...prev, [key]: value }));

  const toggleZone = (zoneId) => {
    const current = deliveryConfig[zoneId]?.enabled || false;
    update("deliveryConfig", {
      ...deliveryConfig,
      [zoneId]: { enabled: !current },
    });
  };

  const activeZones = allDeliveryZones.filter(
    (z) => deliveryConfig[z.id]?.enabled,
  );

  return (
    <div className={`card ${!isActive ? "opacity-60 grayscale-[0.3]" : ""}`}>
      {/* ─── Header with Toggle ─── */}
      <div className="flex items-start justify-between mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-[#0f172a]">{title}</p>
            <p className="text-xs text-slate-400">মূল্য ও ডেলিভারি নিয়ম</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold ${isActive ? "text-emerald-600" : "text-slate-400"}`}
          >
            {isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
          </span>
          <button
            onClick={() => onToggleActive(!isActive)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? "bg-emerald-500" : "bg-slate-300"}`}
            role="switch"
            aria-checked={isActive}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>

      {/* ─── Minimum Order Value ─── */}
      <div className="mb-6">
        <Input
          label="মিনিমাম অর্ডার ভ্যালু (৳)"
          type="number"
          value={minAmountForDiscount || ""}
          onChange={(e) =>
            update("minAmountForDiscount", Number(e.target.value) || 0)
          }
          hint="ডিসকাউন্ট ও ফ্রি ডেলিভারি পাওয়ার জন্য মিনিমাম অর্ডার"
        />
      </div>

      {/* ─── Delivery Zone Toggles ─── */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-[#0f172a] flex items-center gap-2">
          <Truck className="h-4 w-4 text-slate-400" />
          ডেলিভারি সেটিংস
        </h4>

        {allDeliveryZones.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            কোনো ডেলিভারি জোন সেট করা নেই। ডেলিভারি পেজ থেকে জোন যোগ করুন।
          </p>
        ) : (
          <div className="space-y-2.5">
            {allDeliveryZones.map((zone) => {
              const on = deliveryConfig[zone.id]?.enabled || false;
              return (
                <div
                  key={zone.id}
                  className={`p-3 rounded-xl border transition-colors ${on ? "border-emerald-200 bg-emerald-50/30" : "border-slate-100 bg-slate-50/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-semibold ${on ? "text-emerald-700" : "text-slate-600"}`}
                      >
                        {zone.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        চার্জ: ৳{zone.charge}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleZone(zone.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${on ? "bg-emerald-500" : "bg-slate-300"}`}
                      role="switch"
                      aria-checked={on}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${on ? "translate-x-4" : "translate-x-0"}`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Status Preview ─── */}
      <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4">
        <p className="text-xs font-semibold text-slate-500 mb-2.5 flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5" /> বর্তমান প্রিভিউ
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">স্ট্যাটাস</span>
            <span
              className={`font-medium ${isActive ? "text-emerald-600" : "text-rose-500"}`}
            >
              {isActive ? "অ্যাক্টিভ" : "ইনঅ্যাক্টিভ (ডিফল্ট নিয়ম চলবে)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">মিনিমাম অর্ডার</span>
            <span className="font-medium">
              {minAmountForDiscount > 0
                ? `৳${minAmountForDiscount}`
                : "কোনো সীমা নেই"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">ফ্রি ডেলিভারি জোন</span>
            <span className="font-medium text-blue-600">
              {activeZones.length > 0
                ? `${activeZones.length} টি জোন অ্যাক্টিভ`
                : "কোনো জোন নেই"}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Save Button ─── */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
        <button
          onClick={onSave}
          disabled={isSaving}
          className={`btn-primary w-full justify-center ${isSaved ? "bg-emerald-500 hover:bg-emerald-600 border-none" : ""}`}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              সেভ হচ্ছে...
            </>
          ) : isSaved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              সংরক্ষিত!
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              সেভ করুন
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
/*  Main Page Component                                    */
/* ─────────────────────────────────────────────────────── */
export default function ShopConfig() {
  const { data, isLoading } = useShopConfig();
  const updateMut = useUpdateShopConfig();
  const [savingMode, setSavingMode] = useState(null);
  const [savedMode, setSavedMode] = useState(null);

  const cfg = data?.config;
  const allDeliveryZones = (cfg?.delivery_zones || []).filter((z) => z.enabled);

  // ─── Local state for each mode ───
  const [combo, setCombo] = useState(() => buildModeState(null));
  const [single, setSingle] = useState(() => buildModeState(null));
  const [comboBund, setComboBund] = useState(() => buildModeState(null));

  // Sync state from API when data first loads or refreshes
  useEffect(() => {
    if (!cfg) return;
    setCombo(buildModeState(cfg.combo));
    setSingle(buildModeState(cfg.single));
    setComboBund(buildModeState(cfg.combo_bundle));
  }, [cfg]);

  const MODE_MAP = {
    combo: { state: combo, setter: setCombo },
    single: { state: single, setter: setSingle },
    combo_bundle: { state: comboBund, setter: setComboBund },
  };

  // ─── Toggle active/inactive → instant API call ───
  const handleToggleActive = useCallback(
    (modeName, newActive) => {
      // Optimistic UI update
      MODE_MAP[modeName].setter((prev) => ({ ...prev, isActive: newActive }));

      updateMut.mutate(
        { [modeName]: { isActive: newActive } },
        {
          onSuccess: () => {
            toast.success(
              newActive ? "সক্রিয় করা হয়েছে!" : "নিষ্ক্রিয় করা হয়েছে!",
            );
          },
          onError: () => {
            // Revert on error
            MODE_MAP[modeName].setter((prev) => ({
              ...prev,
              isActive: !newActive,
            }));
            toast.error("স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে।");
          },
        },
      );
    },
    [updateMut],
  );

  // ─── Save all fields for a mode ───
  const handleSave = useCallback(
    (modeName) => {
      const modeData = MODE_MAP[modeName].state;
      setSavingMode(modeName);

      updateMut.mutate(
        { [modeName]: modeData },
        {
          onSuccess: () => {
            setSavingMode(null);
            setSavedMode(modeName);
            toast.success("সফলভাবে সেভ হয়েছে!");
            setTimeout(() => setSavedMode(null), 2500);
          },
          onError: () => {
            setSavingMode(null);
            toast.error("সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
          },
        },
      );
    },
    [updateMut, combo, single, comboBund],
  );

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-64 animate-pulse bg-slate-50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">
            ব্যবসায়িক সেটিংস
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            শপের মূল্য নির্ধারণ ও ডেলিভারি নিয়ম কনফিগার করুন
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <PricingPanel
          title="🔀 কম্বো বিল্ডার"
          icon={Package}
          color="bg-[#e91e63]"
          modeState={combo}
          setModeState={setCombo}
          onSave={() => handleSave("combo")}
          onToggleActive={(v) => handleToggleActive("combo", v)}
          isSaving={savingMode === "combo"}
          isSaved={savedMode === "combo"}
          allDeliveryZones={allDeliveryZones}
        />
        <PricingPanel
          title="🎁 কম্বো বান্ডেল"
          icon={Gift}
          color="bg-purple-500"
          modeState={comboBund}
          setModeState={setComboBund}
          onSave={() => handleSave("combo_bundle")}
          onToggleActive={(v) => handleToggleActive("combo_bundle", v)}
          isSaving={savingMode === "combo_bundle"}
          isSaved={savedMode === "combo_bundle"}
          allDeliveryZones={allDeliveryZones}
        />
        <PricingPanel
          title="সিঙ্গেল অর্ডার"
          icon={ShoppingBag}
          color="bg-blue-500"
          modeState={single}
          setModeState={setSingle}
          onSave={() => handleSave("single")}
          onToggleActive={(v) => handleToggleActive("single", v)}
          isSaving={savingMode === "single"}
          isSaved={savedMode === "single"}
          allDeliveryZones={allDeliveryZones}
        />
      </div>
    </div>
  );
}
