import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useShopConfig, useUpdateShopConfig } from "../hooks/useShopConfig";

export default function Delivery() {
  const { data: configData, isLoading: isLoadingConfig } = useShopConfig();
  const updateConfig = useUpdateShopConfig();

  const [zones, setZones] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newZone, setNewZone] = useState({ name: "", charge: "", days: "" });

  // Modal for delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Sync state with API data when it arrives
  useEffect(() => {
    if (configData?.config?.delivery_zones) {
      setZones(configData.config.delivery_zones);
    }
  }, [configData]);

  // General handler to sync with API and reflect in state instantly
  const syncWithApi = (updatedZones, successMsg) => {
    const toastId = toast.loading("আপডেট করা হচ্ছে...");
    updateConfig.mutate(
      { delivery_zones: updatedZones },
      {
        onSuccess: () => {
          setZones(updatedZones); // Optimistic or synced update
          if (successMsg) {
            toast.success(successMsg, { id: toastId });
          } else {
            toast.success("সফলভাবে আপডেট করা হয়েছে!", { id: toastId });
          }
        },
        onError: () => {
          toast.error("আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", {
            id: toastId,
          });
          // If error occurs, the previous state from useEffect or cache will remain
        },
        meta: {
          successMessage: false,
          errorMessage: false,
        },
      },
    );
  };

  const handleAddZone = () => {
    if (!newZone.name || !newZone.charge) {
      toast.error("অনুগ্রহ করে জোনের নাম এবং চার্জ প্রদান করুন");
      return;
    }
    const updatedZones = [
      ...zones,
      {
        id: Date.now(),
        name: newZone.name,
        charge: Number(newZone.charge),
        days: newZone.days,
        enabled: true,
      },
    ];
    setNewZone({ name: "", charge: "", days: "" });
    setShowAdd(false);

    syncWithApi(updatedZones, "নতুন জোন যুক্ত করা হয়েছে!");
  };

  const toggleZone = (id) => {
    const updatedZones = zones.map((z) =>
      z.id === id ? { ...z, enabled: !z.enabled } : z,
    );
    syncWithApi(updatedZones, "জোনের স্ট্যাটাস পরিবর্তন করা হয়েছে!");
  };

  const confirmRemoveZone = (id) => {
    setDeleteConfirm(id);
  };

  const handleRemoveZone = () => {
    if (deleteConfirm) {
      const updatedZones = zones.filter((z) => z.id !== deleteConfirm);
      setDeleteConfirm(null);
      syncWithApi(updatedZones, "জোন মুছে ফেলা হয়েছে!");
    }
  };

  const updateZoneField = (id, field, value) => {
    // Only updates local state for input typing
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, [field]: value } : z)),
    );
  };

  const finishEditing = () => {
    // Upon clicking finish, sync the globally edited zone array
    syncWithApi(zones, "জোনের তথ্য এডিট করা হয়েছে!");
    setEditing(null);
  };

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#e91e63]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">ডেলিভারি সেটিংস</h1>
          <p className="text-sm text-slate-500 mt-1">
            অঞ্চলের উপর ভিত্তি করে ডেলিভারি চার্জ এবং সময় নির্ধারণ করুন
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="card border border-slate-100 shadow-sm rounded-2xl bg-white overflow-hidden">
        {/* Card Header text styling */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e91e63]/10">
              <MapPin className="h-5 w-5 text-[#e91e63]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">
                ডেলিভারি জোন তালিকা
              </h3>
              <p className="text-xs text-slate-500">
                ফ্রি ডেলিভারি সংক্রান্ত নিয়ম "Shop Config" পেজ থেকে ম্যানেজ
                করুন।
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="btn-outline flex items-center gap-2 py-2 px-4 shadow-sm"
          >
            <Plus className="h-4 w-4" /> নতুন জোন যোগ করুন
          </button>
        </div>

        <div className="p-6 space-y-3">
          {zones.length === 0 && !showAdd && (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">
                কোনো ডেলিভারি জোন যুক্ত করা হয়নি
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-3 text-[#e91e63] text-sm font-semibold hover:underline"
              >
                + জোন যোগ করুন
              </button>
            </div>
          )}

          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                zone.enabled
                  ? "border-slate-200 bg-white hover:border-[#e91e63]/30 hover:shadow-sm"
                  : "border-slate-100 bg-slate-50/50 opacity-70"
              }`}
            >
              {editing === zone.id ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
                  <input
                    className="input col-span-2 sm:col-span-1"
                    value={zone.name}
                    placeholder="জোনের নাম"
                    onChange={(e) =>
                      updateZoneField(zone.id, "name", e.target.value)
                    }
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      ৳
                    </span>
                    <input
                      type="number"
                      className="input pl-7"
                      value={zone.charge}
                      placeholder="চার্জ"
                      onChange={(e) =>
                        updateZoneField(
                          zone.id,
                          "charge",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <input
                    className="input"
                    value={zone.days}
                    placeholder="ডেলিভারি সময় (যেমন: ২-৩ দিন)"
                    onChange={(e) =>
                      updateZoneField(zone.id, "days", e.target.value)
                    }
                  />
                  <button
                    onClick={finishEditing}
                    className="btn-primary py-2 px-3 self-end sm:self-auto"
                  >
                    <CheckCircle2 className="h-4 w-4" /> সম্পন্ন
                  </button>
                </div>
              ) : (
                <>
                  {/* View Mode */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-base font-semibold ${zone.enabled ? "text-[#0f172a]" : "text-slate-500"}`}
                    >
                      {zone.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium text-slate-600">
                        সময়: {zone.days || "অজানা"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0">
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        চার্জ
                      </span>
                      <span
                        className={`text-lg font-bold ${zone.enabled ? "text-[#e91e63]" : "text-slate-400"}`}
                      >
                        ৳{zone.charge}
                      </span>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block mx-1"></div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleZone(zone.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                          zone.enabled ? "bg-[#e91e63]" : "bg-slate-300"
                        }`}
                        title={zone.enabled ? "ডিসেবল করুন" : "এনাবল করুন"}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                            zone.enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>

                      <button
                        onClick={() => setEditing(zone.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-[#0f172a] hover:bg-slate-100 transition-colors"
                        title="এডিট করুন"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => confirmRemoveZone(zone.id)}
                        className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="ডিলিট করুন"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add new zone form inline */}
          {showAdd && (
            <div className="rounded-xl border-2 border-dashed border-[#e91e63]/30 bg-[#e91e63]/5 p-4 animate-fade-in-up">
              <h4 className="text-sm font-bold text-[#e91e63] mb-3">
                নতুন ডেলিভারি জোন
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-start">
                <input
                  className="input col-span-2 sm:col-span-1 border-white"
                  placeholder="জোনের নাম (যেমন: ঢাকা সিটি)"
                  value={newZone.name}
                  onChange={(e) =>
                    setNewZone((p) => ({ ...p, name: e.target.value }))
                  }
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    ৳
                  </span>
                  <input
                    type="number"
                    className="input pl-7 border-white"
                    placeholder="চার্জ (যেমন: ৬০)"
                    value={newZone.charge}
                    onChange={(e) =>
                      setNewZone((p) => ({ ...p, charge: e.target.value }))
                    }
                  />
                </div>
                <input
                  className="input border-white"
                  placeholder="সময় (যেমন: ১-২ দিন)"
                  value={newZone.days}
                  onChange={(e) =>
                    setNewZone((p) => ({ ...p, days: e.target.value }))
                  }
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddZone}
                    className="btn-primary flex-1 justify-center py-2.5"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> যুক্ত করুন
                  </button>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-white border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm m-4 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0f172a] mb-2">
                জোন মুছে ফেলতে চান?
              </h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                আপনি কি নিশ্চিত যে আপনি এই ডেলিভারি জোনটি মুছে ফেলতে চান? এটি
                মুছে ফেললে তা আর ফেরত পাওয়া যাবে না।
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="btn-outline flex-1 justify-center py-2.5"
                >
                  বাতিল করুন
                </button>
                <button
                  onClick={handleRemoveZone}
                  className="flex-1 justify-center py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  হ্যাঁ, মুছে ফেলুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
