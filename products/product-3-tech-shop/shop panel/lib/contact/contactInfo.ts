export type ContactInfoIconId =
  | "phone"
  | "email"
  | "address"
  | "whatsapp";

export type ContactInfoItem = Readonly<{
  id: ContactInfoIconId;
  label: string;
  value: string;
  href?: string;
  icon: ContactInfoIconId;
}>;

/**
 * Storefront contact channels — serializable data only (no React components).
 * Keep values in sync with Footer contact block.
 */
export const CONTACT_INFO_ITEMS: ContactInfoItem[] = [
  {
    id: "phone",
    label: "Phone",
    value: "+880 1XXX-XXXXXX",
    href: "tel:+8801XXXXXXXXX",
    icon: "phone",
  },
  {
    id: "email",
    label: "Email",
    value: "support@shoplinkbd.com",
    href: "mailto:support@shoplinkbd.com",
    icon: "email",
  },
  {
    id: "address",
    label: "Address",
    value: "Banani, Dhaka 1213, Bangladesh",
    href: "https://maps.google.com/?q=Banani,+Dhaka+1213,+Bangladesh",
    icon: "address",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    value: "+880 1XXX-XXXXXX",
    href: "https://wa.me/8801XXXXXXXXX",
    icon: "whatsapp",
  },
];
