import { api } from "./client";

export type Subscriber = {
  id: number;
  user_id: number | null;
  email: string;
  status: 0 | 1; // 1 = subscribed, 0 = unsubscribed
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  updated_at: string;
  suspended_at: string | null; // non-null = banned
  first_name: string | null;
  last_name: string | null;
  user_avatar: string | null;
};

export type GetSubscribersParams = {
  limit?: number;
  offset?: number;
  type?: "subscribed" | "unsubscribed" | "suspended";
  search?: string;
};

export type GetSubscribersResponse = {
  success: true;
  total: number;
  limit: number;
  offset: number;
  data: Subscriber[];
};

/** Admin: list all subscribers with filters */
export async function getAllSubscribers(
  params?: GetSubscribersParams
): Promise<GetSubscribersResponse> {
  const res = await api.get("/admin/subscribes", { params });
  return res.data; // { success, total, limit, offset, data: [] }
}

export type ToggleSubscriptionResponse = {
  success: true;
  new_status: 0 | 1;
  message: string;
};

/** Admin: toggle subscribe / unsubscribe */
export async function toggleSubscription(
  id: number,
  reason?: string
): Promise<ToggleSubscriptionResponse> {
  const res = await api.patch(`/admin/subscriber/${id}/manual-sub-toggle`, {
    reason,
  });
  return res.data;
}

export type ToggleBanResponse = {
  success: true;
  is_suspended: boolean;
  user_account_synced: boolean;
  message: string;
};

/** Admin: ban / unban subscriber (optionally sync linked user account) */
export async function toggleBanSubscriber(
  id: number,
  opts?: { reason?: string; effect_linked_account?: boolean }
): Promise<ToggleBanResponse> {
  const res = await api.patch(
    `/admin/subscriber/${id}/manual-ban-toggle`,
    {
      reason: opts?.reason,
      effect_linked_account: opts?.effect_linked_account ?? false,
    }
  );
  return res.data;
}
