export type FooterTheme = "light" | "dark" | "auto";

export type FooterColumnType = "links" | "text" | "contact";

export type SocialKey =
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "tiktok"
  | "youtube"
  | "x"
  | "linkedin";

export type Priority = "Low" | "Normal" | "Medium" | "High";

export type Option = { value: string; label: string };

export type FooterLink = {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
  enabled: boolean;
  priority: Priority;
};

export type FooterColumn = {
  id: string;
  title: string;
  type: FooterColumnType;
  enabled: boolean;
  priority: Priority;

  // for "text"
  text?: string;

  // for "contact"
  contactAddress?: string;
  contactPhones?: string[];
  contactEmails?: string[];

  // for "links"
  links?: FooterLink[];
};

export type SocialLink = {
  key: SocialKey;
  label: string;
  url: string;
  enabled: boolean;
  priority: Priority;
};

export type FooterBranding = {
  enabled: boolean;
  logoUrl: string;
  brandName: string;
  tagline: string;
};

export type FooterNewsletter = {
  enabled: boolean;
  title: string;
  description: string;
  placeholder: string;
  buttonLabel: string;
};

export type FooterPayments = {
  enabled: boolean;
  title: string;
  icons: { id: string; label: string; imageUrl: string; enabled: boolean }[];
};

export type FooterLegal = {
  enabled: boolean;
  copyrightText: string;
  showPolicies: boolean;
  policies: FooterLink[];
};

export type FooterSettings = {
  theme: FooterTheme;
  layout: {
    maxWidth: "xl" | "2xl" | "full";
    showDivider: boolean;
  };
  branding: FooterBranding;
  columns: FooterColumn[];
  socials: SocialLink[];
  newsletter: FooterNewsletter;
  payments: FooterPayments;
  legal: FooterLegal;
};
