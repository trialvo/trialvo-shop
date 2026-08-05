// lib/api/contact/service.ts — V2-041
import type { ApiError } from "@/lib/api/auth/service";
import { api } from "../client";

export type ContactPayload = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
  user_id?: number | null;
};

export type ContactResponse = {
  query_id?: number;
  message?: string;
  flag?: number;
  error?: string;
};

// ── My Contact Messages (logged-in user) ────────────────────────── //

export type ContactReply = {
  message_id: number;
  reply_text: string;
  via: string;
  sent_at: string;
};

export type MyContactMessage = {
  id:         number;
  subject:    string;
  message:    string;
  is_read:    0 | 1;
  is_replied: 0 | 1;
  status:     0 | 1;
  created_at: string;
  updated_at: string;
  replies:    ContactReply[];
};

export type MyContactMessagesResponse = {
  success: boolean;
  data:    MyContactMessage[];
};

const CONTACT_ENDPOINT = "/contact-message";

const getServerErrorMessage = (err: unknown, fallback: string) => {
  const e = err as {
    response?: { data?: ApiError };
    message?: string;
  };
  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
};

class ContactService {
  async submitContact(payload: ContactPayload): Promise<ContactResponse> {
    try {
      const response = await api.post<ContactResponse>(CONTACT_ENDPOINT, payload);
      return response.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to submit contact message"));
    }
  }

  async getMyContactMessages(
    user_id: number,
    limit = 20,
    offset = 0
  ): Promise<MyContactMessagesResponse> {
    try {
      const res = await api.get<MyContactMessagesResponse>("/my-contact-messages", {
        params: { user_id, limit, offset },
      });
      return res.data;
    } catch (err) {
      throw new Error(getServerErrorMessage(err, "Failed to load your messages"));
    }
  }
}

export const contactService = new ContactService();
