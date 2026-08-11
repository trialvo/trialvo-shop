import { Mail, MapPin, Phone } from "lucide-react";
import type { ContactPageContent } from "@/types/contact";
import { BRAND } from "@/lib/brand";

/** Typed Contact page copy — channels pull live values from BRAND */
export const CONTACT_PAGE_CONTENT: ContactPageContent = {
  seo: {
    bn: {
      title: `যোগাযোগ - ${BRAND.nameBn}`,
      description:
        `প্রশ্ন, সাপোর্ট বা পার্টনারশিপ—${BRAND.nameBn}-এর সাথে যোগাযোগ করুন।`,
      keywords: ["যোগাযোগ", BRAND.nameBn, "সাপোর্ট"],
    },
    en: {
      title: `Contact - ${BRAND.name}`,
      description:
        `Questions, support, or partnership—get in touch with ${BRAND.name}.`,
      keywords: ["contact", BRAND.name, "support"],
    },
  },
  hero: {
    eyebrow: {
      bn: "যোগাযোগ",
      en: "Contact",
    },
    title: {
      bn: "আমাদের সাথে কথা বলুন",
      en: "Get in touch with us",
    },
    supporting: {
      bn: "প্রোডাক্ট, ট্রায়াল, কাস্টম সফটওয়্যার, DevOps বা মেইনটেন্যান্স—যা দরকার লিখুন, আমরা দ্রুত উত্তর দিই।",
      en: "Products, trials, custom software built to your needs, DevOps, or maintenance—tell us what you need; we reply quickly.",
    },
    image: {
      src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&h=900&fit=crop&q=80",
      alt: {
        bn: "কাস্টমার সাপোর্ট ওয়ার্কস্পেস",
        en: "Customer support workspace",
      },
    },
  },
  form: {
    title: {
      bn: "বার্তা পাঠান",
      en: "Send a message",
    },
    supporting: {
      bn: "ফর্মটি পূরণ করুন। আমরা ইমেইলে উত্তর দেব।",
      en: "Fill out the form. We will reply by email.",
    },
    name: { bn: "আপনার নাম", en: "Your name" },
    email: { bn: "ইমেইল", en: "Email" },
    subject: { bn: "বিষয়", en: "Subject" },
    message: { bn: "বার্তা", en: "Message" },
    submit: { bn: "পাঠান", en: "Send message" },
    submitting: { bn: "পাঠানো হচ্ছে…", en: "Sending…" },
    success: {
      bn: "আপনার বার্তা পাঠানো হয়েছে।",
      en: "Your message has been sent.",
    },
    error: {
      bn: "বার্তা পাঠানো যায়নি। আবার চেষ্টা করুন।",
      en: "Could not send the message. Please try again.",
    },
  },
  info: {
    title: {
      bn: "যোগাযোগের তথ্য",
      en: "Contact details",
    },
    supporting: {
      bn: "সরাসরি ইমেইল বা ফোনেও যোগাযোগ করতে পারেন।",
      en: "You can also reach us directly by email or phone.",
    },
  },
  channels: [
    {
      id: "email",
      icon: Mail,
      label: { bn: "ইমেইল", en: "Email" },
      value: { bn: BRAND.contactEmail, en: BRAND.contactEmail },
      href: `mailto:${BRAND.contactEmail}`,
    },
    {
      id: "phone",
      icon: Phone,
      label: { bn: "ফোন", en: "Phone" },
      value: { bn: BRAND.contactPhone, en: BRAND.contactPhone },
      href: BRAND.contactPhoneHref,
    },
    {
      id: "address",
      icon: MapPin,
      label: { bn: "ঠিকানা", en: "Address" },
      value: { bn: BRAND.address.bn, en: BRAND.address.en },
      href: null,
    },
  ],
};
