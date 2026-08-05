import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowLeft, Check, ChevronDown, ImagePlus, RefreshCw, Search, X } from "lucide-react";
import { getDeliveryAreas, type DeliveryAreaItem, type DeliveryCityGroup } from "@/api/delivery-areas.api";
import {
  useCreateAnnouncement,
  useEditAnnouncement,
  useAnnouncementById,
} from "@/hooks/useAnnouncements";
import type {
  AnnouncementChannel,
  AnnouncementStatus,
  AnnouncementTargetType,
  AnnouncementZoneScope,
  AnnouncementZone,
} from "@/api/announcements.api";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import PageMeta from "@/components/common/PageMeta";

type ZoneTarget = {
  location_mapping_id: number;
  city_name: string;
  area_name: string;
};

function mapExistingZonesToSelections(
  zones: AnnouncementZone[],
  cities: DeliveryCityGroup[]
): ZoneTarget[] {
  const results: ZoneTarget[] = [];
  const seen = new Set<number>();

  const cityMap = new Map<string, DeliveryCityGroup>();
  const areaMap = new Map<number, { city_name: string; area_name: string }>();
  for (const city of cities) {
    cityMap.set(city.city_name.toLowerCase().trim(), city);
    for (const area of city.areas) {
      areaMap.set(area.id, { city_name: city.city_name, area_name: area.area_name });
    }
  }

  for (const zone of zones) {
    const mappingId = zone.location_mapping_id ?? null;
    if (mappingId && !seen.has(mappingId)) {
      const fromAreaMap = areaMap.get(mappingId);
      seen.add(mappingId);
      results.push({
        location_mapping_id: mappingId,
        city_name: zone.city_name ?? fromAreaMap?.city_name ?? "",
        area_name: zone.area_name ?? fromAreaMap?.area_name ?? "",
      });
      continue;
    }

    // Legacy city-only rows: expand to all areas under that city.
    const cityName = (zone.city_name ?? "").toLowerCase().trim();
    if (!cityName) continue;
    const cityGroup = cityMap.get(cityName);
    if (!cityGroup) continue;

    for (const area of cityGroup.areas) {
      if (seen.has(area.id)) continue;
      seen.add(area.id);
      results.push({
        location_mapping_id: area.id,
        city_name: cityGroup.city_name,
        area_name: area.area_name,
      });
    }
  }

  return results;
}

function ZoneTreePicker({
  cities,
  selectedZones,
  onToggleArea,
  onToggleCity,
  isSyncing,
}: {
  cities: DeliveryCityGroup[];
  selectedZones: ZoneTarget[];
  onToggleArea: (city: DeliveryCityGroup, area: DeliveryAreaItem) => void;
  onToggleCity: (city: DeliveryCityGroup) => void;
  isSyncing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedCity, setExpandedCity] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const selectedIds = useMemo(
    () => new Set(selectedZones.map((z) => z.location_mapping_id)),
    [selectedZones]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return cities;
    return cities
      .map((city) => ({
        ...city,
        areas: city.areas.filter(
          (area) =>
            area.area_name.toLowerCase().includes(q) ||
            city.city_name.toLowerCase().includes(q)
        ),
      }))
      .filter((city) => city.areas.length > 0);
  }, [cities, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label =
    selectedZones.length === 0
      ? "Select zones..."
      : `${selectedZones.length} area${selectedZones.length > 1 ? "s" : ""} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white hover:border-gray-400 transition-colors"
      >
        <Search size={13} className="shrink-0 text-gray-400" />
        <span
          className={`flex-1 text-left ${
            selectedZones.length
              ? "text-gray-900 dark:text-white"
              : "text-gray-400"
          }`}
        >
          {label}
        </span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950">
          <div className="border-b border-gray-100 p-2 dark:border-gray-800">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 dark:bg-gray-900">
              <Search size={12} className="text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city or area..."
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-200"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")}>
                  <X size={11} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {isSyncing ? (
              <p className="py-4 text-center text-xs text-gray-400">Loading zones...</p>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">No zones found</p>
            ) : (
              filtered.map((city) => {
                const cityAreaIds = city.areas.map((a) => a.id);
                const selectedInCity = cityAreaIds.filter((id) => selectedIds.has(id)).length;
                const isCityChecked = cityAreaIds.length > 0 && selectedInCity === cityAreaIds.length;
                const isCityExpanded = search ? true : expandedCity === city.city_name;

                return (
                  <div key={city.city_name} className="border-b border-gray-100 last:border-b-0 dark:border-gray-900">
                    <div className="flex items-center justify-between px-3 py-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isCityChecked}
                          onChange={() => onToggleCity(city)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                        />
                        <span className="font-medium">{city.city_name}</span>
                        <span className="text-xs text-gray-400">
                          ({selectedInCity}/{cityAreaIds.length})
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCity((prev) =>
                            prev === city.city_name ? null : city.city_name
                          )
                        }
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <ChevronDown
                          size={14}
                          className={`transition-transform ${
                            isCityExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {isCityExpanded && (
                      <div className="pb-2">
                        {city.areas.map((area) => {
                          const checked = selectedIds.has(area.id);
                          return (
                            <label
                              key={area.id}
                              className="flex items-center gap-2 px-7 py-1.5 text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-500/10"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggleArea(city, area)}
                                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                              />
                              <span>{area.area_name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type FormState = {
  headline: string;
  body: string;
  channel: AnnouncementChannel;
  target_type: AnnouncementTargetType;
  zone_scope: AnnouncementZoneScope;
  zones: ZoneTarget[];
  status: AnnouncementStatus;
  scheduled_at: string;
};

const EMPTY_FORM: FormState = {
  headline: "",
  body: "",
  channel: "email",
  target_type: "all",
  zone_scope: "all",
  zones: [],
  status: "draft",
  scheduled_at: "",
};

interface Props {
  edit?: boolean;
}

export default function CreateAnnouncementPage({ edit }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const announcementId = id ? parseInt(id, 10) : null;

  const { data: existingData, isLoading: existingLoading } = useAnnouncementById(
    edit && announcementId ? announcementId : null
  );

  const {
    data: deliveryAreasData,
    isFetching: isSyncing,
    refetch: syncZones,
  } = useQuery({
    queryKey: ["announcement-delivery-areas"],
    queryFn: getDeliveryAreas,
    staleTime: 10 * 60 * 1000,
  });

  const deliveryCities = useMemo(
    () => deliveryAreasData?.data ?? [],
    [deliveryAreasData]
  );

  const createMutation = useCreateAnnouncement();
  const editMutation = useEditAnnouncement();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!edit || !existingData?.data || initializedRef.current) return;

    const d = existingData.data;
    const needsCityExpansion =
      d.zone_scope === "selected" &&
      d.zones.some((z) => !z.location_mapping_id && !!z.city_name);

    if (needsCityExpansion && deliveryCities.length === 0) {
      return;
    }

    const zones = mapExistingZonesToSelections(d.zones, deliveryCities);

    setForm({
      headline: d.headline,
      body: d.body,
      channel: d.channel,
      target_type: d.target_type,
      zone_scope: d.zone_scope,
      zones,
      status: d.status,
      scheduled_at: d.scheduled_at
        ? new Date(d.scheduled_at).toISOString().slice(0, 16)
        : "",
    });

    initializedRef.current = true;
  }, [edit, existingData, deliveryCities]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const selectedZoneIds = useMemo(
    () => new Set(form.zones.map((z) => z.location_mapping_id)),
    [form.zones]
  );

  const toggleArea = (city: DeliveryCityGroup, area: DeliveryAreaItem) => {
    setForm((prev) => {
      const exists = prev.zones.some((z) => z.location_mapping_id === area.id);
      if (exists) {
        return {
          ...prev,
          zones: prev.zones.filter((z) => z.location_mapping_id !== area.id),
        };
      }
      return {
        ...prev,
        zones: [
          ...prev.zones,
          {
            location_mapping_id: area.id,
            city_name: city.city_name,
            area_name: area.area_name,
          },
        ],
      };
    });
  };

  const toggleCity = (city: DeliveryCityGroup) => {
    const cityAreaIds = city.areas.map((a) => a.id);
    const isAllSelected = cityAreaIds.every((id) => selectedZoneIds.has(id));

    setForm((prev) => {
      if (isAllSelected) {
        return {
          ...prev,
          zones: prev.zones.filter((z) => !cityAreaIds.includes(z.location_mapping_id)),
        };
      }

      const existingIds = new Set(prev.zones.map((z) => z.location_mapping_id));
      const additions = city.areas
        .filter((area) => !existingIds.has(area.id))
        .map((area) => ({
          location_mapping_id: area.id,
          city_name: city.city_name,
          area_name: area.area_name,
        }));

      return {
        ...prev,
        zones: [...prev.zones, ...additions],
      };
    });
  };

  const handleImage = (file: File | null) => {
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview("");
    }
  };

  const buildFormData = () => {
    const fd = new FormData();
    fd.append("headline", form.headline);
    fd.append("body", form.body);
    fd.append("channel", form.channel);
    fd.append("target_type", form.target_type);
    fd.append("zone_scope", form.zone_scope);
    fd.append("status", form.status);
    if (form.status === "scheduled" && form.scheduled_at) {
      fd.append("scheduled_at", new Date(form.scheduled_at).toISOString());
    }
    if (form.zone_scope === "selected" && form.zones.length) {
      fd.append("zones", JSON.stringify(form.zones));
    }
    if (imageFile) fd.append("announcement_image", imageFile);
    return fd;
  };

  const handleSave = async () => {
    if (!form.headline.trim() || !form.body.trim()) {
      toast.error("Headline and body are required.");
      return;
    }
    if (form.status === "scheduled" && !form.scheduled_at) {
      toast.error("Please set a scheduled date/time.");
      return;
    }
    if (form.zone_scope === "selected" && form.zones.length === 0) {
      toast.error("Please select at least one area.");
      return;
    }

    setSaving(true);
    try {
      if (edit && announcementId) {
        await editMutation.mutateAsync({
          id: announcementId,
          formData: buildFormData(),
        });
        toast.success("Announcement updated.");
      } else {
        await createMutation.mutateAsync(buildFormData());
        toast.success("Announcement created.");
      }
      navigate("/announcements");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (edit && existingLoading) {
    return <p className="p-8 text-sm text-gray-400">Loading...</p>;
  }

  return (
    <>
      <PageMeta
        title={edit ? "Edit Announcement" : "Create Announcement"}
        description="Compose an announcement to send to customers via email, SMS, or both"
      />

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/announcements")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {edit ? "Edit Announcement" : "Create Announcement"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {edit
              ? "Modify and re-use as a new send or save changes."
              : "Draft a new email, SMS, or both announcement."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">
                Headline <span className="text-error-500">*</span>
              </Label>
              <input
                id="headline"
                value={form.headline}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  set("headline", e.target.value)
                }
                placeholder="e.g. Eid Special Offer - 25% Off!"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">
                Body Message <span className="text-error-500">*</span>
              </Label>
              <textarea
                id="body"
                rows={8}
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
                placeholder="Write your announcement message here..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-200 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Delivery Channel
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose how to deliver this announcement.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {(["email", "sms", "both"] as AnnouncementChannel[]).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => set("channel", ch)}
                  className={`flex-1 min-w-[120px] rounded-xl border-2 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                    form.channel === ch
                      ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Announcement Image (Optional)
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImage(e.target.files?.[0] ?? null)}
            />
            {imagePreview ? (
              <div className="relative w-full max-w-sm">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="rounded-xl w-full h-40 object-cover"
                />
                <button
                  onClick={() => handleImage(null)}
                  className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-error-500 text-white hover:bg-error-600 shadow"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-5 py-4 text-sm text-gray-500 hover:border-brand-400 hover:text-brand-500 transition-colors dark:border-gray-700"
              >
                <ImagePlus size={18} /> Upload image
              </button>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Status & Schedule
            </p>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as AnnouncementStatus)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {form.status === "scheduled" && (
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">
                  Scheduled At <span className="text-error-500">*</span>
                </Label>
                <input
                  type="datetime-local"
                  id="scheduled_at"
                  value={form.scheduled_at}
                  onChange={(e) => set("scheduled_at", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Target Audience
            </p>
            <div className="space-y-2">
              <Label>Target Type</Label>
              <select
                value={form.target_type}
                onChange={(e) =>
                  set("target_type", e.target.value as AnnouncementTargetType)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="all">All</option>
                <option value="subscribed_only">Subscribed Only</option>
                <option value="registered_users_only">Registered Users Only</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Zone Scope</Label>
              <select
                value={form.zone_scope}
                onChange={(e) =>
                  set("zone_scope", e.target.value as AnnouncementZoneScope)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <option value="all">All Zones</option>
                <option value="selected">Selected Zones</option>
              </select>
            </div>

            {form.zone_scope === "selected" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Zones (City to Area)</Label>
                  <button
                    type="button"
                    onClick={() => syncZones()}
                    disabled={isSyncing}
                    title="Sync latest zones from location_mappings"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs text-gray-500 hover:text-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      size={11}
                      className={isSyncing ? "animate-spin" : ""}
                    />
                    Sync zones
                  </button>
                </div>

                <ZoneTreePicker
                  cities={deliveryCities}
                  selectedZones={form.zones}
                  onToggleArea={toggleArea}
                  onToggleCity={toggleCity}
                  isSyncing={isSyncing}
                />

                {form.zones.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {form.zones.map((z) => (
                      <span
                        key={z.location_mapping_id}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                      >
                        <Check size={10} />
                        {z.city_name} - {z.area_name}
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              zones: prev.zones.filter(
                                (x) => x.location_mapping_id !== z.location_mapping_id
                              ),
                            }))
                          }
                          className="ml-0.5 hover:text-error-500"
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={handleSave} disabled={saving}>
              {saving
                ? "Saving..."
                : edit
                ? "Update Announcement"
                : "Create Announcement"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/announcements")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
