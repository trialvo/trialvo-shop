import { api } from '@/lib/api';

export type AdminRole = 'super_admin' | 'admin' | 'editor';
export type NotifyEvent = 'purchase' | 'extend' | 'domain_trial' | 'manual_expiry';
export type NotifyChannel = 'email' | 'sms';

export const NOTIFY_EVENTS: NotifyEvent[] = [
  'purchase',
  'extend',
  'domain_trial',
  'manual_expiry',
];

export const NOTIFY_EVENT_LABELS: Record<NotifyEvent, string> = {
  purchase: 'Product Purchase',
  extend: 'Trial Extend',
  domain_trial: 'Own-Domain Trial',
  manual_expiry: 'Manual Trial Expired',
};

export interface ChannelFlags {
  email: boolean;
  sms: boolean;
}

export type PermissionMatrix = Record<NotifyEvent, ChannelFlags>;

export interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  phone: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface AdminWithPermissions extends StaffMember {
  permissions: PermissionMatrix;
}

export interface NotificationPermissionsResponse {
  global: PermissionMatrix;
  admins: AdminWithPermissions[];
}

export interface CreateStaffPayload {
  email: string;
  full_name: string;
  role: AdminRole;
  phone?: string;
  password: string;
}

export interface UpdateStaffPayload {
  full_name?: string;
  email?: string;
  role?: AdminRole;
  phone?: string | null;
  is_active?: boolean;
}

export function emptyMatrix(email = false, sms = false): PermissionMatrix {
  return {
    purchase: { email, sms },
    extend: { email, sms },
    domain_trial: { email, sms },
    manual_expiry: { email, sms },
  };
}

export function cloneMatrix(matrix: PermissionMatrix): PermissionMatrix {
  const next = emptyMatrix();
  for (const event of NOTIFY_EVENTS) {
    next[event] = {
      email: Boolean(matrix?.[event]?.email),
      sms: Boolean(matrix?.[event]?.sms),
    };
  }
  return next;
}

export function matricesEqual(a: PermissionMatrix, b: PermissionMatrix): boolean {
  return NOTIFY_EVENTS.every(
    (event) => a[event].email === b[event].email && a[event].sms === b[event].sms,
  );
}

export function roleLabel(role: string): string {
  return role.replace('_', ' ').toUpperCase();
}

export const adminStaffApi = {
  list: () => api.get<{ staff: StaffMember[] }>('/admin/staff'),
  create: (payload: CreateStaffPayload) =>
    api.post<{ staff: StaffMember }>('/admin/staff', payload),
  update: (id: string, payload: UpdateStaffPayload) =>
    api.patch<{ staff: StaffMember }>(`/admin/staff/${id}`, payload),
  resetPassword: (id: string, password: string) =>
    api.post<{ message: string }>(`/admin/staff/${id}/reset-password`, { password }),
};

export const notificationPermissionsApi = {
  get: () => api.get<NotificationPermissionsResponse>('/admin/notification-permissions'),
  updateGlobal: (global: PermissionMatrix) =>
    api.put<{ global: PermissionMatrix }>('/admin/notification-permissions/global', global),
  updateAdmin: (adminId: string, permissions: PermissionMatrix) =>
    api.put<{ admin: AdminWithPermissions }>(
      `/admin/notification-permissions/${adminId}`,
      permissions,
    ),
};

export type SmsProviderId = '' | 'alphasms' | 'bulksms';

export interface SmsSettings {
  activeProvider: SmsProviderId;
  alphaEnabled: boolean;
  bulkEnabled: boolean;
  alphaSenderId: string;
  bulkSenderId: string;
  hasAlphaApiKey: boolean;
  hasBulkApiKey: boolean;
  balance?: {
    ok: boolean;
    reason?: string | null;
    provider?: string | null;
    balance?: unknown;
  };
}

export interface UpdateSmsSettingsPayload {
  activeProvider?: SmsProviderId;
  alphaEnabled?: boolean;
  bulkEnabled?: boolean;
  alphaSenderId?: string;
  bulkSenderId?: string;
  alphaApiKey?: string;
  bulkApiKey?: string;
}

export const adminSmsApi = {
  get: () => api.get<SmsSettings>('/admin/settings/sms'),
  save: (payload: UpdateSmsSettingsPayload) =>
    api.post<SmsSettings & { message: string }>('/admin/settings/sms', payload),
  test: (phone: string, message?: string) =>
    api.post<{ success: boolean; message: string }>('/admin/settings/sms/test', {
      phone,
      ...(message ? { message } : {}),
    }),
};
