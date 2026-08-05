import type { ApiError } from "@/lib/api/auth/service";
import { api } from "../client";

export type ViewRequest = {
  page_name?: string;
  ip: string;
};

export type ViewResponseData = {
  view_id?: string | number;
  timestamp?: string;
  page_name?: string;
  ip?: string;
  recorded_at?: string;
  session_id?: string;
  // Add any other specific fields your API returns
};

export type ViewResponse = {
  success: boolean;
  message?: string;
  data?: ViewResponseData;
};

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };

  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

class ViewService {
  async recordView(data: ViewRequest): Promise<ViewResponse> {
    try {
      const response = await api.post<ViewResponse>("/view", data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to record view"));
    }
  }
}

export const viewService = new ViewService();