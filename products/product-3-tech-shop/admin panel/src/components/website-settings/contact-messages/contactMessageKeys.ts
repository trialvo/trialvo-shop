// src/hooks/contact-messages/contactMessageKeys.ts

import type { GetContactMessagesParams } from "@/api/contact-messages.api";

export const contactMessageKeys = {
  all: () => ["contact-messages"] as const,
  counts: () => [...contactMessageKeys.all(), "counts"] as const,
  list: (params: GetContactMessagesParams) =>
    [...contactMessageKeys.all(), "list", params] as const,
  single: (id: number) => [...contactMessageKeys.all(), "single", id] as const,
};
