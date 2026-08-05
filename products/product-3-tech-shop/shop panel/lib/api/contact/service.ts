import { getUnknownErrorMessage } from "@/lib/api/errors";
import { api } from "@/lib/api/client";
import { sanitizeAuthText, sanitizeEmail } from "@/lib/security/auth";
import { toApiPhoneNumber } from "@/lib/phone/parse";

export type ContactPayload = Readonly<{
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  subject: string;
  message: string;
  user_id?: number | null;
}>;

export type ContactResponse = Readonly<{
  query_id?: number;
  message?: string;
  flag?: number;
  error?: string;
  success?: boolean;
}>;

export type ContactReply = Readonly<{
  message_id: number;
  reply_text: string;
  via: string;
  sent_at: string;
}>;

export type MyContactMessage = Readonly<{
  id: number;
  subject: string;
  message: string;
  is_read: 0 | 1;
  is_replied: 0 | 1;
  status: 0 | 1;
  created_at: string;
  updated_at: string;
  replies: ContactReply[];
}>;

export type MyContactMessagesResponse = Readonly<{
  success: boolean;
  data: MyContactMessage[];
}>;

const CONTACT_ENDPOINT = "/contact-message";
const MY_MESSAGES_ENDPOINT = "/my-contact-messages";

/**
 * Sanitize + clamp fields before they hit the network.
 */
export function sanitizeContactPayload(
  payload: ContactPayload,
): ContactPayload {
  const first = sanitizeAuthText(payload.first_name ?? "", 100) || undefined;
  const last = sanitizeAuthText(payload.last_name ?? "", 100) || undefined;
  const emailRaw = payload.email?.trim() ?? "";
  const email = emailRaw ? sanitizeEmail(emailRaw) || undefined : undefined;
  const phoneRaw = payload.phone?.trim() ?? "";
  const phone = phoneRaw ? toApiPhoneNumber(phoneRaw) : undefined;
  const subject = sanitizeAuthText(payload.subject, 255);
  const message = sanitizeAuthText(payload.message, 5000);

  const userId =
    typeof payload.user_id === "number" &&
    Number.isFinite(payload.user_id) &&
    payload.user_id > 0
      ? Math.floor(payload.user_id)
      : undefined;

  return {
    first_name: first,
    last_name: last,
    email,
    phone,
    subject,
    message,
    user_id: userId ?? null,
  };
}

class ContactService {
  async submitContact(payload: ContactPayload): Promise<ContactResponse> {
    const body = sanitizeContactPayload(payload);

    if (!body.subject.trim() || !body.message.trim()) {
      throw new Error("Subject and message are required.");
    }
    if (!body.email && !body.phone) {
      throw new Error("Either email or phone must be provided.");
    }

    try {
      const response = await api.post<ContactResponse>(CONTACT_ENDPOINT, body);
      return response.data;
    } catch (err) {
      throw new Error(
        getUnknownErrorMessage(err, "Failed to submit contact message"),
      );
    }
  }

  async getMyContactMessages(
    userId: number,
    limit = 20,
    offset = 0,
  ): Promise<MyContactMessagesResponse> {
    const safeUserId = Number(userId);
    if (!Number.isFinite(safeUserId) || safeUserId <= 0) {
      throw new Error("A valid user id is required.");
    }

    try {
      const res = await api.get<MyContactMessagesResponse>(
        MY_MESSAGES_ENDPOINT,
        {
          params: {
            user_id: Math.floor(safeUserId),
            limit: Math.min(100, Math.max(1, Math.floor(limit))),
            offset: Math.max(0, Math.floor(offset)),
          },
        },
      );
      return res.data;
    } catch (err) {
      throw new Error(
        getUnknownErrorMessage(err, "Failed to load your messages"),
      );
    }
  }
}

export const contactService = new ContactService();
