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
    lines: ["graduatefashion2020@gmail.com"],
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
  { id: "fb", label: "Facebook", href: "https://www.facebook.com/Graduatefashion2020?rdid=T4tozQFHBUz1BAmW&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F17Wh44z3FD%2F#", icon: FaFacebookF },
  { id: "ig", label: "Instagram", href: "https://www.instagram.com/graduate01620680283?utm_source=qr&igsh=OGU1YjVsOXFjNGE2", icon: FaInstagram },
  { id: "wa", label: "Whats app", href: "https://api.whatsapp.com/message/CAOMDXFCTULPD1?autoload=1&app_absent=0", icon: FaWhatsapp },
  { id: "tt", label: "Ticktok", href: "https://www.tiktok.com/@graduate.fashion?_r=1&_t=ZS-936tAcqT81R", icon: FaTiktok },
];

export const CONTACT_MAP = {
  title: "Find Us",
  subtitle: "Visit our shop & display center at Uttara, Dhaka",
  // Replace with your real Google Maps embed link:
  mapSrc:
    "https://www.google.com/maps?q=Uttara%20Dhaka&output=embed",
};
