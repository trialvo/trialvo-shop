import { Mail, MapPin, Phone } from "lucide-react";
import type { ContactPageContent } from "@/types/contact";

/** Typed Contact page copy — single source of truth */
export const CONTACT_PAGE_CONTENT: ContactPageContent = {
  seo: {
    bn: {
      title: "যোগাযোগ - eShop Market",
      description:
        "প্রশ্ন, সাপোর্ট বা পার্টনারশিপ—eShop Market-এর সাথে যোগাযোগ করুন।",
      keywords: ["যোগাযোগ", "eShop Market", "সাপোর্ট"],
    },
    en: {
      title: "Contact - eShop Market",
      description:
        "Questions, support, or partnership—get in touch with eShop Market.",
      keywords: ["contact", "eShop Market", "support"],
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
      bn: "প্রোডাক্ট, ট্রায়াল বা অর্ডার নিয়ে প্রশ্ন থাকলে মেসেজ পাঠান—আমরা দ্রুত উত্তর দিই।",
      en: "Have a question about products, trials, or orders? Send a message—we reply quickly.",
    },
    image: {
      // Calm desk / customer-support style banner (standard contact pages)
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
      value: { bn: "info@eshopmarket.com", en: "info@eshopmarket.com" },
      href: "mailto:info@eshopmarket.com",
    },
    {
      id: "phone",
      icon: Phone,
      label: { bn: "ফোন", en: "Phone" },
      value: { bn: "+880 1700-000000", en: "+880 1700-000000" },
      href: "tel:+8801700000000",
    },
    {
      id: "address",
      icon: MapPin,
      label: { bn: "ঠিকানা", en: "Address" },
      value: { bn: "ঢাকা, বাংলাদেশ", en: "Dhaka, Bangladesh" },
      href: null,
    },
  ],
};
