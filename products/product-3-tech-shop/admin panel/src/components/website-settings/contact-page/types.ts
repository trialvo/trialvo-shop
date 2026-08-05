export type ContactFieldKey =
  | "firstName"
  | "lastName"
  | "mobile"
  | "email"
  | "subject"
  | "message";

export type SocialKey =
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "tiktok"
  | "youtube"
  | "x";

export type BusinessHourRow = {
  id: string;
  label: string; // e.g. "Everyday (7 Days a Week)"
  time: string; // e.g. "10:00 AM - 11:00 PM"
  enabled: boolean;
};

export type SocialLink = {
  key: SocialKey;
  label: string;
  url: string;
  enabled: boolean;
};

export type ContactInfoSettings = {
  heading: string;
  subHeading: string;

  addressTitle: string;
  addressText: string;
  addressNote: string;

  callTitle: string;
  phones: string[];
  callNote: string;

  mailTitle: string;
  emails: string[];

  businessTitle: string;
  businessRows: BusinessHourRow[];
  businessFooterNote: string;

  mapEmbedUrl: string;
  mapTitle: string;
  mapSubTitle: string;
};

export type ContactFormSettings = {
  title: string;
  description: string;

  fields: Record<
    ContactFieldKey,
    {
      enabled: boolean;
      required: boolean;
      label: string;
      placeholder: string;
    }
  >;

  recipientEmails: string[];
  successMessage: string;
};

export type ContactPageSettings = {
  contactInfo: ContactInfoSettings;
  contactForm: ContactFormSettings;
  socialLinks: SocialLink[];
};
