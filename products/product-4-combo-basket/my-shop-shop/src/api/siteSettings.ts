import { useQuery } from "@tanstack/react-query";
import apiClient from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SiteSettingsData {
  site_name: string;
  site_tagline: string;
  site_description: string;
  contact_address: string;
  contact_phone: string;
  contact_email: string;
  contact_hours: string;
  whatsapp_number: string;
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_whatsapp: string;
  about_hero_title: string;
  about_hero_subtitle: string;
  about_story: string;
  about_stats: Array<{ value: string; label: string }>;
  about_values: Array<{
    icon: string;
    title: string;
    desc: string;
    bg: string;
    iconColor: string;
  }>;
  about_team: Array<{ name: string; role: string; icon: string }>;
  home_show_featured: boolean;
  home_show_categories: boolean;
  home_show_process_steps: boolean;
  home_show_testimonials: boolean;
  home_show_category_sections: boolean;
  footer_tagline: string;
  footer_quick_links: Array<{ href: string; label: string }>;
  footer_company_links: Array<{ href: string; label: string }>;
  footer_support_links: Array<{ href: string; label: string }>;
}

export interface SiteSettingsResponse {
  success: boolean;
  settings: SiteSettingsData;
}

// ─── Default fallback ─────────────────────────────────────────────────────────
export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  site_name: "ComboBasket",
  site_tagline: "বাংলাদেশের সেরা কম্বো ও গিফট শপ",
  site_description:
    "স্কিনকেয়ার, মেকআপ, হেয়ার কেয়ার ও প্রিমিয়াম গিফট সেট — সবচেয়ে কম দামে, ফ্রি ডেলিভারিতে।",
  contact_address: "১২৩ মেইন স্ট্রিট, ঢাকা, বাংলাদেশ",
  contact_phone: "+৮৮০ ১২৩৪-৫৬৭৮৯০",
  contact_email: "support@combobasket.com",
  contact_hours: "শনি–বৃহস্পতি: সকাল ১০টা – রাত ৮টা",
  whatsapp_number: "8801234567890",
  social_facebook: "#",
  social_instagram: "#",
  social_twitter: "#",
  social_whatsapp: "#",
  about_hero_title: "আমাদের সম্পর্কে",
  about_hero_subtitle:
    "আমরা প্রিমিয়াম মানের পণ্য সবার কাছে পৌঁছে দেওয়ার লক্ষ্যে কাজ করে যাচ্ছি।",
  about_story:
    "ComboBasket শুরু হয়েছিল একটি সহজ ধারণা থেকে — প্রিমিয়াম মানের পণ্য সবার নাগালে পৌঁছে দেওয়া।",
  about_stats: [
    { value: "১০হা+", label: "সন্তুষ্ট গ্রাহক" },
    { value: "৫হা+", label: "পণ্য বিক্রয়" },
    { value: "৫০+", label: "ক্যাটাগরি" },
    { value: "৯৯%", label: "সন্তুষ্টির হার" },
  ],
  about_values: [
    {
      icon: "Gem",
      title: "মানের প্রতি অঙ্গীকার",
      desc: "আমরা শুধুমাত্র সেরা মানের পণ্য সংগ্রহ করি।",
      bg: "bg-pink-50",
      iconColor: "text-pink-600",
    },
    {
      icon: "Rocket",
      title: "দ্রুত ডেলিভারি",
      desc: "আপনার দরজায় দ্রুত ও নির্ভরযোগ্য ডেলিভারি।",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: "Heart",
      title: "গ্রাহক সেবা",
      desc: "যেকোনো প্রশ্নে সর্বক্ষণ সহায়তার জন্য প্রস্তুত।",
      bg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      icon: "Lock",
      title: "নিরাপদ কেনাকাটা",
      desc: "আপনার তথ্য ও পেমেন্ট সর্বদা সুরক্ষিত।",
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ],
  about_team: [
    {
      name: "Sarah Ahmed",
      role: "প্রধান নির্বাহী ও প্রতিষ্ঠাতা",
      icon: "Briefcase",
    },
    { name: "Rifat Khan", role: "প্রযুক্তি প্রধান", icon: "Code" },
    { name: "Nadia Islam", role: "ডিজাইন প্রধান", icon: "Palette" },
  ],
  home_show_featured: true,
  home_show_categories: true,
  home_show_process_steps: true,
  home_show_testimonials: true,
  home_show_category_sections: true,
  footer_tagline:
    "বাংলাদেশের সেরা কম্বো ও গিফট শপ। স্কিনকেয়ার, মেকআপ, হেয়ার কেয়ার ও প্রিমিয়াম গিফট সেট — সবচেয়ে কম দামে, ফ্রি ডেলিভারিতে।",
  footer_quick_links: [
    { href: "/products", label: "সকল পণ্য" },
    { href: "/products?category=electronics", label: "ইলেকট্রনিক্স" },
    { href: "/products?category=fashion", label: "ফ্যাশন" },
    { href: "/products?category=accessories", label: "এক্সেসরিজ" },
  ],
  footer_company_links: [
    { href: "/about", label: "আমাদের সম্পর্কে" },
    { href: "/contact", label: "যোগাযোগ" },
    { href: "#", label: "ব্লগ" },
    { href: "#", label: "ক্যারিয়ার" },
  ],
  footer_support_links: [
    { href: "/contact", label: "হেল্প সেন্টার" },
    { href: "/faq", label: "সাধারণ জিজ্ঞাসা" },
    { href: "/refund", label: "রিটার্ন ও রিফান্ড" },
    { href: "/privacy", label: "গোপনীয়তা নীতি" },
    { href: "/cookies", label: "কুকি নীতি" },
  ],
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function usePublicSiteSettings() {
  return useQuery<SiteSettingsResponse>({
    queryKey: ["public-site-settings"],
    queryFn: async () => {
      const { data } = await apiClient.get("/site-settings");
      return data;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}
