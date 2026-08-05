import { api } from "./client";

export type AnnouncementStatus = "draft" | "scheduled" | "sent" | "cancelled";
export type AnnouncementTargetType = "all" | "subscribed_only" | "registered_users_only";
export type AnnouncementZoneScope = "all" | "selected";
export type AnnouncementChannel = "email" | "sms" | "both";

export type AnnouncementZone = {
  location_mapping_id: number | null;
  city_name: string | null;
  area_name: string | null;
  city_name_normalized: string | null;
  area_name_normalized: string | null;
};

export type AnnouncementSummary = {
  id: number;
  headline: string;
  target_type: AnnouncementTargetType;
  zone_scope: AnnouncementZoneScope;
  channel: AnnouncementChannel;
  status: AnnouncementStatus;
  scheduled_at: string | null;
  image_path: string | null;
  zones: AnnouncementZone[];
};

export type AnnouncementDetail = AnnouncementSummary & {
  body: string;
};

export type AnnouncementAlertMeta = {
  total_unsent: number;
  total_scheduled_pending: number;
  total_scheduled_overdue: number;
};

export type GetAnnouncementsParams = {
  limit?: number;
  offset?: number;
  status?: AnnouncementStatus;
  target_type?: AnnouncementTargetType;
  channel?: AnnouncementChannel;
  zones?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
};

export type GetAnnouncementsResponse = {
  success: true;
  total: number;
  limit: number;
  offset: number;
  data: AnnouncementSummary[];
};

export type SendAnnouncementResponse = {
  success: true;
  channel: AnnouncementChannel;
  email_recipient_count?: number;
  sms_recipient_count?: number;
  recipient_count?: number;
  message: string;
};

export type SendManualPayload = {
  announcement_id: number;
  emails?: string[];
  phones?: string[];
};

export type SendManualResponse = {
  success: true;
  email_recipients: number;
  sms_recipients: number;
  message: string;
};

export async function getAnnouncements(
  params?: GetAnnouncementsParams
): Promise<GetAnnouncementsResponse> {
  const res = await api.get("/admin/announcements", { params });
  return res.data;
}

export async function getAnnouncementById(id: number): Promise<{
  success: true;
  data: AnnouncementDetail;
}> {
  const res = await api.get(`/admin/announcement/${id}`);
  return res.data;
}

export async function getAnnouncementAlerts(): Promise<{
  success: true;
  meta: AnnouncementAlertMeta;
}> {
  const res = await api.get("/admin/announcements/alert");
  return res.data;
}

export async function createAnnouncement(formData: FormData): Promise<{
  success: true;
  announcement_id: number;
  message: string;
}> {
  const res = await api.post("/admin/announcement", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function editAnnouncement(
  id: number,
  formData: FormData
): Promise<{ success: true; message: string }> {
  const res = await api.put(`/admin/announcement/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteAnnouncement(id: number): Promise<{
  success: true;
  message: string;
}> {
  const res = await api.delete(`/admin/announcement/${id}`);
  return res.data;
}

export async function sendAnnouncement(id: number): Promise<SendAnnouncementResponse> {
  const res = await api.post(`/admin/announcement/send/${id}`);
  return res.data;
}

export async function sendManualAnnouncement(
  payload: SendManualPayload
): Promise<SendManualResponse> {
  const res = await api.post("/admin/announcement/send-manual", payload);
  return res.data;
}

export async function getCityZones(): Promise<{
  success: true;
  total: number;
  cities: string[];
}> {
  const res = await api.get("/admin/city-zones");
  return res.data;
}
