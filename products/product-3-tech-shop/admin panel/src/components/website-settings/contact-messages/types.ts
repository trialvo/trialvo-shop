// src/components/contact-messages/types.ts

import type {
  ContactMessage,
  ContactMessageCounts,
  ContactMessageSingle,
  ContactMessageStatusFilter,
  ContactMessageBoolFilter,
} from "@/api/contact-messages.api";

export type ContactMessageRow = ContactMessage;
export type ContactMessageDetails = ContactMessageSingle;
export type ContactMessageCountsData = ContactMessageCounts;

export type ContactTabKey =
  | "all"
  | "unread"
  | "unreplied"
  | "read_but_not_replied"
  | "archived";

export type ContactMessageFilters = {
  tab: ContactTabKey;
  status: ContactMessageStatusFilter;
  is_read: ContactMessageBoolFilter;
  is_replied: ContactMessageBoolFilter;
  search: string;
  subject: string;
  assigned_to_me: boolean;
};

export type ContactMessagePageState = {
  page: number; // 1-based
  pageSize: number;
  selectedId: number | null;
};
