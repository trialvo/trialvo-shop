import { api } from "./client";

export type AdminNotificationPermission = {
  id: number;
  admin_id: number;
  order_notification_email: boolean;
  order_notification_sms: boolean;
  order_notification_firebase_push: boolean;
  personal_notification_email: boolean;
  personal_notification_sms: boolean;
  personal_notification_firebase_push: boolean;
  /** V2-036: Contact Us assignment notification */
  contact_notification_email: boolean;
  contact_notification_sms: boolean;
  contact_notification_firebase_push: boolean;
  /** V2-036: Report assignment notification */
  report_notification_email: boolean;
  report_notification_sms: boolean;
  report_notification_firebase_push: boolean;
  /** V2-017: Allow admin to handle orders not assigned to them */
  allow_handle_unassigned_order: boolean;
  updated_by_admin: number | null;
  created_at: string;
  updated_at: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string | null;
  profile_img_path: string | null;
  role_name: string;
};

export type SetNotificationPermissionsPayload = {
  order_notification_email?: boolean;
  order_notification_sms?: boolean;
  order_notification_firebase_push?: boolean;
  personal_notification_email?: boolean;
  personal_notification_sms?: boolean;
  personal_notification_firebase_push?: boolean;
  /** V2-036: Contact Us assignment notification */
  contact_notification_email?: boolean;
  contact_notification_sms?: boolean;
  contact_notification_firebase_push?: boolean;
  /** V2-036: Report assignment notification */
  report_notification_email?: boolean;
  report_notification_sms?: boolean;
  report_notification_firebase_push?: boolean;
  /** V2-017: Allow admin to handle unassigned orders */
  allow_handle_unassigned_order?: boolean;
};


export async function getAllAdminNotificationPermissions(): Promise<{
  success: true;
  data: AdminNotificationPermission[];
}> {
  const res = await api.get("/admin/notification-permissions");
  return res.data;
}

export async function getAdminNotificationPermissions(admin_id: number): Promise<{
  success: true;
  data: AdminNotificationPermission | null;
}> {
  const res = await api.get(`/admin/notification-permissions/${admin_id}`);
  return res.data;
}

export async function setAdminNotificationPermissions(
  admin_id: number,
  payload: SetNotificationPermissionsPayload
): Promise<{ success: true; message: string }> {
  const res = await api.put(`/admin/notification-permissions/${admin_id}`, payload);
  return res.data;
}
