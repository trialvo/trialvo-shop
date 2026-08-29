import type { Locale } from "@/lib/i18n";

export type ServiceEntry = {
  id: string;
  name: string;
  summary: string;
  deliverables: string[];
};

export type ServicesContent = {
  eyebrow: string;
  title: string;
  intro: string;
  entries: ServiceEntry[];
  ctaNote: string;
};

/**
 * Work we take on beyond the ready-made catalog. Mirrors the Service nodes in
 * the structured data so the page text and the rich result agree.
 */
const SERVICES: Record<Locale, ServicesContent> = {
  bn: {
    eyebrow: "প্রোডাক্টের বাইরে",
    title: "রেডিমেড প্রোডাক্টের পাশাপাশি আমরা যা করি",
    intro:
      "ক্যাটালগের প্রোডাক্টগুলো দ্রুত শুরু করার জন্য। কিন্তু প্রতিটি ব্যবসার চাহিদা এক নয়—তাই কাস্টমাইজেশন থেকে শুরু করে সম্পূর্ণ নতুন সফটওয়্যার তৈরি পর্যন্ত পুরো কাজটাই আমরা নিতে পারি।",
    entries: [
      {
        id: "customization",
        name: "কাস্টমাইজেশন ও ফিচার ডেভেলপমেন্ট",
        summary:
          "কেনা প্রোডাক্টে নতুন ফিচার যোগ করা, ডিজাইন বদলানো বা আপনার ব্যবসার নিয়ম অনুযায়ী ফ্লো পরিবর্তন করা।",
        deliverables: [
          "নতুন মডিউল ও ফিচার তৈরি",
          "ডিজাইন ও ব্র্যান্ডিং পরিবর্তন",
          "পেমেন্ট, কুরিয়ার ও থার্ড-পার্টি API ইন্টিগ্রেশন",
          "রিপোর্ট ও ড্যাশবোর্ড কাস্টমাইজেশন",
        ],
      },
      {
        id: "custom-software",
        name: "কাস্টম সফটওয়্যার ডেভেলপমেন্ট",
        summary:
          "রেডিমেড কোনো প্রোডাক্ট আপনার প্রয়োজনের সাথে না মিললে শুরু থেকে আপনার জন্য সফটওয়্যার তৈরি করা হয়।",
        deliverables: [
          "প্রয়োজন বিশ্লেষণ ও স্কোপ নির্ধারণ",
          "ওয়েব অ্যাপ্লিকেশন ও অ্যাডমিন সিস্টেম",
          "API ও ব্যাকএন্ড সার্ভিস",
          "সম্পূর্ণ সোর্স কোড হস্তান্তর",
        ],
      },
      {
        id: "devops",
        name: "সার্ভার সেটআপ ও DevOps",
        summary:
          "হোস্টিং নির্বাচন, ডোমেইন কনফিগারেশন, SSL, ডিপ্লয়মেন্ট ও ব্যাকআপ—লাইভ করার পুরো টেকনিক্যাল দিক।",
        deliverables: [
          "সার্ভার প্রভিশনিং ও নিরাপদ কনফিগারেশন",
          "ডোমেইন, DNS ও SSL সেটআপ",
          "অটোমেটেড ডিপ্লয়মেন্ট পাইপলাইন",
          "নিয়মিত ব্যাকআপ ও মনিটরিং",
        ],
      },
      {
        id: "maintenance",
        name: "মেইনটেন্যান্স ও দীর্ঘমেয়াদি সাপোর্ট",
        summary:
          "লাইভ হওয়ার পরেও সাইট চালু, নিরাপদ ও হালনাগাদ রাখার ধারাবাহিক কাজ।",
        deliverables: [
          "সিকিউরিটি প্যাচ ও ডিপেন্ডেন্সি আপডেট",
          "বাগ ফিক্স ও পারফরম্যান্স টিউনিং",
          "আপটাইম মনিটরিং ও দ্রুত পুনরুদ্ধার",
          "কনটেন্ট ও ক্যাটালগ ব্যবস্থাপনায় সহায়তা",
        ],
      },
      {
        id: "seo",
        name: "টেকনিক্যাল SEO ও পারফরম্যান্স",
        summary:
          "সার্চ থেকে ট্রাফিক আনার টেকনিক্যাল ভিত্তি—গতি, স্ট্রাকচার্ড ডেটা ও ইনডেক্সিং।",
        deliverables: [
          "পেজ স্পিড ও কোর ওয়েব ভাইটালস অপটিমাইজেশন",
          "মেটা ট্যাগ, সাইটম্যাপ ও স্ট্রাকচার্ড ডেটা",
          "ইনডেক্সিং সমস্যা নির্ণয় ও সমাধান",
          "দ্বিভাষিক কনটেন্ট স্ট্রাকচার",
        ],
      },
      {
        id: "migration",
        name: "মাইগ্রেশন ও ডেটা ট্রান্সফার",
        summary:
          "পুরনো সাইট বা প্ল্যাটফর্ম থেকে নতুন শপে প্রোডাক্ট, গ্রাহক ও অর্ডার সরিয়ে আনা।",
        deliverables: [
          "প্রোডাক্ট ও ক্যাটাগরি ডেটা মাইগ্রেশন",
          "গ্রাহক ও অর্ডার ইতিহাস স্থানান্তর",
          "পুরনো URL থেকে রিডাইরেক্ট ম্যাপিং",
          "লঞ্চের আগে যাচাই ও রোলব্যাক পরিকল্পনা",
        ],
      },
    ],
    ctaNote:
      "আপনার প্রয়োজনটা এক-দুই লাইনে জানালেই যথেষ্ট। আমরা সম্ভাব্য পথ, সময় ও খরচের একটি স্পষ্ট কোটেশন দেব।",
  },

  en: {
    eyebrow: "Beyond the products",
    title: "What we do alongside the ready-made catalog",
    intro:
      "The products in the catalog exist to get you started quickly. No two businesses need the same thing, though, so we also take on everything from customization to building entirely new software.",
    entries: [
      {
        id: "customization",
        name: "Customization and feature development",
        summary:
          "Adding features to a product you bought, changing the design, or reshaping the flow around how your business actually operates.",
        deliverables: [
          "New modules and features",
          "Design and branding changes",
          "Payment, courier, and third-party API integrations",
          "Custom reports and dashboards",
        ],
      },
      {
        id: "custom-software",
        name: "Custom software development",
        summary:
          "When no ready-made product fits what you need, we build it for you from scratch.",
        deliverables: [
          "Requirements analysis and scoping",
          "Web applications and admin systems",
          "APIs and backend services",
          "Complete source code handover",
        ],
      },
      {
        id: "devops",
        name: "Server setup and DevOps",
        summary:
          "Hosting choice, domain configuration, SSL, deployment, and backups — the whole technical side of going live.",
        deliverables: [
          "Server provisioning and hardened configuration",
          "Domain, DNS, and SSL setup",
          "Automated deployment pipelines",
          "Scheduled backups and monitoring",
        ],
      },
      {
        id: "maintenance",
        name: "Maintenance and long-term support",
        summary:
          "The ongoing work of keeping a live site running, secure, and current after launch.",
        deliverables: [
          "Security patches and dependency updates",
          "Bug fixes and performance tuning",
          "Uptime monitoring and fast recovery",
          "Help with content and catalog management",
        ],
      },
      {
        id: "seo",
        name: "Technical SEO and performance",
        summary:
          "The technical groundwork that lets search traffic arrive: speed, structured data, and indexing.",
        deliverables: [
          "Page speed and Core Web Vitals optimization",
          "Meta tags, sitemaps, and structured data",
          "Diagnosing and fixing indexing problems",
          "Bilingual content structure",
        ],
      },
      {
        id: "migration",
        name: "Migration and data transfer",
        summary:
          "Moving products, customers, and orders from an old site or platform into a new shop.",
        deliverables: [
          "Product and category data migration",
          "Customer and order history transfer",
          "Redirect mapping from old URLs",
          "Pre-launch verification and a rollback plan",
        ],
      },
    ],
    ctaNote:
      "A line or two about what you need is enough to start. We come back with a clear quote covering the approach, the timeline, and the cost.",
  },
};

export function services(locale: Locale): ServicesContent {
  return SERVICES[locale];
}
