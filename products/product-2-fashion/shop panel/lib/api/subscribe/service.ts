import type { ApiError } from "@/lib/api/auth/service";
import { api } from "@/lib/api/client";

export type SubscribePayload = {
  email: string;
  user_id?: number | null;
};

export type SubscribeResponse = {
  subscriber_id?: number;
  message?: string;
  flag?: number;
  error?: string;
};

const SUBSCRIBE_ENDPOINT = "/subscribe";

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

class SubscribeService {
  async subscribe(payload: SubscribePayload): Promise<SubscribeResponse> {
    try {
      const response = await api.post<SubscribeResponse>(SUBSCRIBE_ENDPOINT, payload);
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Subscription failed"));
    }
  }
}

export const subscribeService = new SubscribeService();
