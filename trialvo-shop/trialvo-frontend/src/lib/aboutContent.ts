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
      title: "আমাদের সম্পর্কে - Trialvo Shop",
      description:
        "Trialvo Shop কী এবং কীভাবে রেডিমেড ইকমার্স সলিউশন সাহায্য করে—সংক্ষেপে জানুন।",
      keywords: ["আমাদের সম্পর্কে", "Trialvo Shop", "ইকমার্স সলিউশন"],
    },
    en: {
      title: "About Us - Trialvo Shop",
      description:
        "Learn what Trialvo Shop is and how ready-made ecommerce solutions help you launch faster.",
      keywords: ["about us", "Trialvo Shop", "ecommerce solutions"],
    },
  },
  hero: {
    eyebrow: {
      bn: "আমাদের সম্পর্কে",
      en: "About us",
    },
    title: {
      bn: "Trialvo Shop কে আমরা",
      en: "Who we are at Trialvo Shop",
    },
    supporting: {
      bn: "রেডিমেড ইকমার্স সলিউশন—কাস্টমাইজেশন, DevOps, মেইনটেন্যান্স, এবং প্রয়োজনমতো যেকোনো সফটওয়্যার বিল্ড।",
      en: "Ready-made ecommerce—plus customization, DevOps, maintenance, and custom software built to your needs.",
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
        bn: "আমরা রেডিমেড ইকমার্স সলিউশন অফার করি—এডমিন প্যানেল ও শপ ওয়েবসাইটসহ। দ্রুত লঞ্চ করতে পারবেন, আবার প্রয়োজনে পুরো কাস্টমাইজও করাতে পারবেন।",
        en: "We offer ready-made ecommerce solutions—with admin panel and shop included. Launch fast, or customize deeply when your business needs it.",
      },
      {
        bn: "প্রোডাক্ট ব্রাউজ ও ট্রায়ালের পাশাপাশি আমরা সফটওয়্যার সার্ভিস দিই—কাস্টমাইজেশন, DevOps, মেইনটেন্যান্স, এবং আপনার প্রয়োজন অনুযায়ী সম্পূর্ণ নতুন সফটওয়্যার ডেভেলপমেন্ট।",
        en: "Alongside browsing and trials, we provide software services—customization, DevOps, maintenance, and we can build any software according to your needs.",
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
      title: { bn: "সার্ভিস", en: "Services" },
      description: {
        bn: "কাস্টমাইজেশন থেকে শুরু করে প্রয়োজনমতো যেকোনো সফটওয়্যার বিল্ড, DevOps ও মেইনটেন্যান্স।",
        en: "From customization to building any software you need—plus DevOps and maintenance.",
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
      bn: "ক্যাটাগরি থেকে সলিউশন বেছে নিন—অথবা কাস্টম সফটওয়্যার, DevOps বা মেইনটেন্যান্সের জন্য লিখুন।",
      en: "Pick a solution from the catalog—or message us to build custom software, or for DevOps and maintenance.",
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
