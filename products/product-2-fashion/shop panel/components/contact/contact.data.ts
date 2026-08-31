import { Clock, Mail, MapPin, PhoneCall } from "lucide-react";
import type { ElementType } from "react";
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";

export type ContactInfoItem = {
  id: string;
  icon: ElementType;
  title: string;
  lines: string[];
};

export type SocialLink = {
  id: string;
  label: string;
  href: string;
  icon: ElementType;
};

export const CONTACT_INFO: ContactInfoItem[] = [
  {
    id: "address",
    icon: MapPin,
    title: "Shop & Display Center Address",
    lines: [
      "House 29, Road 05, Sector 11, Uttara, Dhaka 1230",
      "(10am–10pm, Open Everyday)",
    ],
  },
  {
    id: "call",
    icon: PhoneCall,
    title: "Call Us",
    lines: ["+8801970680283", "(10am–10pm, Open Everyday)"],
  },
  {
    id: "mail",
    icon: Mail,
    title: "Mail Us",
    lines: ["support@vellora.demo"],
  },
  {
    id: "hours",
    icon: Clock,
    title: "Business Hours",
    lines: [
      "Online Operations: 10:00 AM - 11:00 PM",
      "Everyday (7 Days a Week)",
      "24/7 Online Shopping Available",
    ],
  },
];

export const CONTACT_SOCIALS: SocialLink[] = [
  { id: "fb", label: "Facebook", href: "#", icon: FaFacebookF },
  { id: "ig", label: "Instagram", href: "#", icon: FaInstagram },
  { id: "wa", label: "WhatsApp", href: "#", icon: FaWhatsapp },
  { id: "tt", label: "TikTok", href: "#", icon: FaTiktok },
];

export const CONTACT_MAP = {
  title: "Find Us",
  subtitle: "Visit our shop & display center at Uttara, Dhaka",
  // Replace with your real Google Maps embed link:
  mapSrc:
    "https://www.google.com/maps?q=Uttara%20Dhaka&output=embed",
};
