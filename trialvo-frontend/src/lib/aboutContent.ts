import {
  Award,
  Eye,
  Headphones,
  Package,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import type { AboutPageContent } from "@/types/about";

/** Typed About page copy — plain, user-friendly language */
export const ABOUT_PAGE_CONTENT: AboutPageContent = {
  seo: {
    bn: {
      title: "আমাদের সম্পর্কে - eShop Market",
      description:
        "eShop Market কী এবং কীভাবে রেডিমেড ইকমার্স সলিউশন সাহায্য করে—সংক্ষেপে জানুন।",
      keywords: ["আমাদের সম্পর্কে", "eShop Market", "ইকমার্স সলিউশন"],
    },
    en: {
      title: "About Us - eShop Market",
      description:
        "Learn what eShop Market is and how ready-made ecommerce solutions help you launch faster.",
      keywords: ["about us", "eShop Market", "ecommerce solutions"],
    },
  },
  hero: {
    eyebrow: {
      bn: "আমাদের সম্পর্কে",
      en: "About us",
    },
    title: {
      bn: "eShop Market কে আমরা",
      en: "Who we are at eShop Market",
    },
    supporting: {
      bn: "রেডিমেড ইকমার্স সলিউশনের একটি সহজ মার্কেটপ্লেস। ব্রাউজ করুন, ট্রায়াল করুন, তারপর কিনুন।",
      en: "A simple marketplace for ready-made ecommerce solutions. Browse, trial, then buy.",
    },
    primaryCta: {
      bn: "প্রোডাক্ট দেখুন",
      en: "Browse products",
    },
    secondaryCta: {
      bn: "যোগাযোগ",
      en: "Contact",
    },
    image: {
      src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&h=900&fit=crop&q=80",
      alt: {
        bn: "টিম ওয়ার্কস্পেস",
        en: "Team workspace",
      },
    },
  },
  story: {
    eyebrow: {
      bn: "সংক্ষেপে",
      en: "In short",
    },
    title: {
      bn: "ব্যবসা শুরু করা সহজ করাই আমাদের কাজ",
      en: "We make starting an online business easier",
    },
    paragraphs: [
      {
        bn: "আমরা রেডিমেড ইকমার্স সলিউশন অফার করি—এডমিন প্যানেল ও শপ ওয়েবসাইটসহ। জটিল কাস্টম ডেভেলপমেন্ট ছাড়াই দ্রুত লঞ্চ করতে পারবেন।",
        en: "We offer ready-made ecommerce solutions—with admin panel and shop website included. Launch faster without heavy custom development.",
      },
      {
        bn: "প্রথমে প্রোডাক্ট দেখুন। যেখানে ট্রায়াল আছে, লাইভে টেস্ট করুন। পছন্দ হলে নিরাপদে অর্ডার সম্পন্ন করুন।",
        en: "Start by browsing products. Where a trial is available, test it live. When you are ready, complete a secure order.",
      },
    ],
  },
  values: [
    {
      id: "mission",
      icon: Target,
      title: { bn: "মিশন", en: "Mission" },
      description: {
        bn: "প্রফেশনাল ইকমার্স সলিউশন সবার নাগালে রাখা।",
        en: "Keep professional ecommerce solutions within everyone’s reach.",
      },
    },
    {
      id: "vision",
      icon: Eye,
      title: { bn: "ভিশন", en: "Vision" },
      description: {
        bn: "বিশ্বস্ত ডিজিটাল ইকমার্স মার্কেটপ্লেস হওয়া।",
        en: "Be a trusted digital ecommerce marketplace.",
      },
    },
    {
      id: "service",
      icon: Users,
      title: { bn: "সাপোর্ট", en: "Support" },
      description: {
        bn: "সেটআপ থেকে লঞ্চ পর্যন্ত সাহায্য করি।",
        en: "We help from setup through launch.",
      },
    },
    {
      id: "quality",
      icon: Award,
      title: { bn: "মান", en: "Quality" },
      description: {
        bn: "প্রতিটি সলিউশন পরীক্ষা করে অফার করি।",
        en: "Every solution is reviewed before we offer it.",
      },
    },
  ],
  highlights: [
    {
      id: "products",
      icon: Package,
      label: { bn: "প্রোডাক্ট", en: "Products" },
      fallbackValue: "—",
    },
    {
      id: "trial",
      icon: Sparkles,
      label: { bn: "লাইভ ট্রায়াল", en: "Live trial" },
      fallbackValue: "Yes",
    },
    {
      id: "delivery",
      icon: Zap,
      label: { bn: "ডেলিভারি", en: "Delivery" },
      fallbackValue: "Fast",
    },
    {
      id: "support",
      icon: Headphones,
      label: { bn: "সাপোর্ট", en: "Support" },
      fallbackValue: "Yes",
    },
  ],
  principles: [
    {
      id: "transparent",
      step: 1,
      title: { bn: "স্পষ্ট তথ্য", en: "Clear information" },
      description: {
        bn: "দাম ও ফিচার আগে থেকেই দেখতে পাবেন।",
        en: "You can see pricing and features upfront.",
      },
    },
    {
      id: "try-first",
      step: 2,
      title: { bn: "আগে টেস্ট", en: "Try first" },
      description: {
        bn: "ট্রায়াল থাকলে কেনার আগে লাইভে যাচাই করুন।",
        en: "If a trial exists, validate the product live before buying.",
      },
    },
    {
      id: "launch-ready",
      step: 3,
      title: { bn: "লঞ্চ রেডি", en: "Ready to launch" },
      description: {
        bn: "এডমিন ও শপসহ প্যাকেজ—দ্রুত শুরু করতে।",
        en: "Admin and shop included—so you can start sooner.",
      },
    },
  ],
  cta: {
    title: {
      bn: "প্রোডাক্ট দেখে শুরু করুন",
      en: "Start by browsing products",
    },
    supporting: {
      bn: "ক্যাটাগরি থেকে সলিউশন বেছে নিন, অথবা প্রশ্ন থাকলে আমাদের লিখুন।",
      en: "Pick a solution from the catalog, or message us if you have questions.",
    },
    primaryCta: {
      bn: "সব প্রোডাক্ট",
      en: "View products",
    },
    secondaryCta: {
      bn: "যোগাযোগ",
      en: "Contact us",
    },
  },
};
