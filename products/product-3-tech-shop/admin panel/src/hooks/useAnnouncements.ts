import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAnnouncements, getAnnouncementById, getAnnouncementAlerts,
  createAnnouncement, editAnnouncement, deleteAnnouncement,
  sendAnnouncement, sendManualAnnouncement,
  type GetAnnouncementsParams, type SendManualPayload,
} from "@/api/announcements.api";

export const announcementKeys = {
  all: ["announcements"] as const,
  list: (params: GetAnnouncementsParams) => ["announcements", "list", params] as const,
  detail: (id: number) => ["announcements", "detail", id] as const,
  alerts: ["announcements", "alerts"] as const,
};

export function useAnnouncements(params: GetAnnouncementsParams) {
  return useQuery({
    queryKey: announcementKeys.list(params),
    queryFn: () => getAnnouncements(params),
    placeholderData: (prev) => prev,
  });
}

export function useAnnouncementById(id: number | null) {
  return useQuery({
    queryKey: id ? announcementKeys.detail(id) : announcementKeys.all,
    queryFn: () => getAnnouncementById(id!),
    enabled: Boolean(id),
  });
}

export function useAnnouncementAlerts() {
  return useQuery({
    queryKey: announcementKeys.alerts,
    queryFn: getAnnouncementAlerts,
    refetchInterval: 60_000, // auto refresh every minute
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createAnnouncement(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
      qc.invalidateQueries({ queryKey: announcementKeys.alerts });
    },
  });
}

export function useEditAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) => editAnnouncement(id, formData),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
      qc.invalidateQueries({ queryKey: announcementKeys.detail(id) });
    },
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
      qc.invalidateQueries({ queryKey: announcementKeys.alerts });
    },
  });
}

export function useSendAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendAnnouncement,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: announcementKeys.all });
      qc.invalidateQueries({ queryKey: announcementKeys.detail(id) });
      qc.invalidateQueries({ queryKey: announcementKeys.alerts });
    },
  });
}

export function useSendManualAnnouncement() {
  return useMutation({
    mutationFn: (payload: SendManualPayload) => sendManualAnnouncement(payload),
  });
}

// ─── City Zone Suggestions ──────────────────────────────────────────────── //

const CITY_ZONES_KEY = ["announcements", "city-zones"] as const;
const LS_KEY = "app:city_zones_cache";            // localStorage key
const CACHE_TTL = 24 * 60 * 60 * 1000;            // 24 hours in ms

type CityZoneCache = { ts: number; cities: string[] };

/** Read from localStorage; returns null if missing or older than 24 h. */
function readLocalCache(): string[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed: CityZoneCache = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL) return null;
    return parsed.cities;
  } catch {
    return null;
  }
}

/** Persist city list to localStorage with current timestamp. */
function writeLocalCache(cities: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ts: Date.now(), cities }));
  } catch { /* ignore quota errors */ }
}

/**
 * Fetches distinct city names from order_addresses + user_addresses.
 * - staleTime = 24 h  → no re-fetch within the same browser session
 * - initialData seeded from localStorage → survives hard refresh
 * - refetch() exposed for the manual "Sync zones" button
 */
export function useCityZones() {
  const cachedCities = readLocalCache();

  const query = useQuery({
    queryKey: CITY_ZONES_KEY,
    queryFn: async () => {
      const { getCityZones } = await import("@/api/announcements.api");
      const res = await getCityZones();
      writeLocalCache(res.cities);
      return res.cities;
    },
    staleTime: CACHE_TTL,
    gcTime: CACHE_TTL,
    // Seed from localStorage so the first render is instant with no spinner
    initialData: cachedCities ?? undefined,
    initialDataUpdatedAt: cachedCities ? Date.now() - 1 : undefined, // treat as fresh
  });

  return {
    cities: query.data ?? [],
    isLoading: query.isLoading,
    isSyncing: query.isFetching,
    sync: query.refetch,
  };
}
