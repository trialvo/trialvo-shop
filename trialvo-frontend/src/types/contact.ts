import type { LucideIcon } from "lucide-react";
import type { LocalizedString } from "@/types/marketplace";

export type ContactSeoCopy = {
  title: string;
  description: string;
  keywords: string[];
};

export type ContactHeroContent = {
  eyebrow: LocalizedString;
  title: LocalizedString;
  supporting: LocalizedString;
  image: {
    src: string;
    alt: LocalizedString;
  };
};

export type ContactChannelId = "email" | "phone" | "address";

export type ContactChannel = {
  id: ContactChannelId;
  icon: LucideIcon;
  label: LocalizedString;
  value: LocalizedString;
  href: string | null;
};

export type ContactFormLabels = {
  title: LocalizedString;
  supporting: LocalizedString;
  name: LocalizedString;
  email: LocalizedString;
  subject: LocalizedString;
  message: LocalizedString;
  submit: LocalizedString;
  submitting: LocalizedString;
  success: LocalizedString;
  error: LocalizedString;
};

export type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactInfoPanel = {
  title: LocalizedString;
  supporting: LocalizedString;
};

export type ContactPageContent = {
  seo: Record<"bn" | "en", ContactSeoCopy>;
  hero: ContactHeroContent;
  form: ContactFormLabels;
  info: ContactInfoPanel;
  channels: ContactChannel[];
};

export const EMPTY_CONTACT_FORM: ContactFormValues = {
  name: "",
  email: "",
  subject: "",
  message: "",
};
