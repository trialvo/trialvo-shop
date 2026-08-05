import { api } from "@/lib/api/client";
import { getUnknownErrorMessage } from "@/lib/api/errors";

export type SubscribePayload = {
  email: string;
  /** Only send when the email belongs to the authenticated user */
  user_id?: number;
};

export type SubscribeResponse = {
  subscriber_id?: number;
  message?: string;
  error?: string;
  flag?: number;
};

class SubscriberService {
  async subscribe(payload: SubscribePayload): Promise<SubscribeResponse> {
    try {
      const res = await api.post<SubscribeResponse>("/subscribe", {
        email: payload.email.trim().toLowerCase(),
        ...(typeof payload.user_id === "number" && payload.user_id > 0
          ? { user_id: payload.user_id }
          : {}),
      });
      return res.data;
    } catch (err) {
      throw new Error(getUnknownErrorMessage(err, "Failed to subscribe"));
    }
  }
}

export const subscriberService = new SubscriberService();
