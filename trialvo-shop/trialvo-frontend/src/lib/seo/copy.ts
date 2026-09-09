import type { Locale } from "@/lib/i18n";

export type PageSeoCopy = {
  title: string;
  description: string;
  keywords: string[];
};

/**
 * Head terms that should appear on every indexable page. Page keyword lists
 * add long-tail intent on top of these instead of repeating them.
 */
export const SITE_KEYWORDS: Record<Locale, string[]> = {
  bn: [
    "রেডিমেড ইকমার্স ওয়েবসাইট",
    "ইকমার্স ওয়েবসাইট কিনুন",
    "অনলাইন শপ ওয়েবসাইট",
    "ইকমার্স সোর্স কোড",
    "অ্যাডমিন প্যানেল সহ ইকমার্স",
    "বাংলাদেশে ইকমার্স ওয়েবসাইট",
    "এককালীন পেমেন্ট ওয়েবসাইট",
    "আজীবন লাইসেন্স",
    "আজীবন সাপোর্ট",
    "Trialvo Shop",
  ],
  en: [
    "ready-made ecommerce website",
    "buy ecommerce website",
    "online store source code",
    "ecommerce website with admin panel",
    "ecommerce website Bangladesh",
    "one-time payment ecommerce",
    "lifetime license software",
    "lifetime support",
    "ecommerce solution provider",
    "Trialvo Shop",
  ],
};

export type PageSeoKey =
  | "home"
  | "products"
  | "about"
  | "contact"
  | "faq"
  | "howItWorks"
  | "terms"
  | "privacy"
  | "refund"
  | "license"
  | "cookies"
  | "acceptableUse"
  | "disclaimer"
  | "support"
  | "checkout"
  | "orderSuccess"
  | "trialSubmitted"
  | "notFound";

export const PAGE_SEO: Record<PageSeoKey, Record<Locale, PageSeoCopy>> = {
  home: {
    bn: {
      title: "রেডিমেড ইকমার্স ওয়েবসাইট — ইনস্ট্যান্ট ডেমো, নিজের ডোমেইনে ফ্রি ট্রায়াল",
      description:
        "Trialvo Shop থেকে সম্পূর্ণ রেডিমেড ইকমার্স ওয়েবসাইট কিনুন — অ্যাডমিন প্যানেল, শপ ফ্রন্টএন্ড ও সোর্স কোড একসাথে। এক মিনিটে ইনস্ট্যান্ট ডেমো, তারপর নিজের ডোমেইন ও হোস্টিংয়ে এক মাস ফ্রি ট্রায়াল। এককালীন পেমেন্ট, আজীবন সাপোর্ট।",
      keywords: [
        "রেডিমেড ইকমার্স সলিউশন",
        "ইকমার্স ওয়েবসাইট প্যাকেজ",
        "অনলাইন ব্যবসা শুরু করার ওয়েবসাইট",
        "ফ্রি ট্রায়াল ইকমার্স ওয়েবসাইট",
        "নিজের ডোমেইনে ফ্রি ট্রায়াল",
        "ইকমার্স ইনস্ট্যান্ট ডেমো",
        "সোর্স কোড সহ অনলাইন শপ",
        "ডিজিটাল প্রোডাক্ট মার্কেটপ্লেস",
      ],
    },
    en: {
      title: "Ready-made ecommerce websites — instant demo, free trial on your own domain",
      description:
        "Buy complete ready-made ecommerce websites from Trialvo Shop — admin panel, storefront, and full source code together. Instant demo in a minute, then a full month's free trial on your own domain and hosting. One-time payment, lifetime support.",
      keywords: [
        "ready-made ecommerce solution",
        "ecommerce website package",
        "start an online business website",
        "free trial ecommerce website",
        "free trial on your own domain",
        "instant ecommerce demo",
        "online shop with source code",
        "digital product marketplace",
      ],
    },
  },

  products: {
    bn: {
      title: "সকল ইকমার্স প্রোডাক্ট — অ্যাডমিন প্যানেল ও সোর্স কোড সহ",
      description:
        "Trialvo Shop-এর সব রেডিমেড ইকমার্স সলিউশন ব্রাউজ করুন। প্রতিটি প্যাকেজে শপ ফ্রন্টএন্ড, অ্যাডমিন প্যানেল, সম্পূর্ণ সোর্স কোড, আজীবন লাইসেন্স ও আজীবন সাপোর্ট। প্রতিটি প্রোডাক্টে লাইভ ট্রায়াল উপলব্ধ।",
      keywords: [
        "ইকমার্স প্রোডাক্ট লিস্ট",
        "রেডিমেড ওয়েবসাইট দাম",
        "ফ্যাশন ইকমার্স ওয়েবসাইট",
        "টেক শপ ওয়েবসাইট",
        "লাইফস্টাইল ইকমার্স সলিউশন",
        "ইকমার্স ওয়েবসাইট ক্যাটালগ",
      ],
    },
    en: {
      title: "All ecommerce products — admin panel and source code included",
      description:
        "Browse every ready-made ecommerce solution from Trialvo Shop. Each package includes the storefront, admin panel, full source code, a lifetime license, and lifetime support. Live trial available on every product.",
      keywords: [
        "ecommerce product catalog",
        "ready-made website pricing",
        "fashion ecommerce website",
        "tech shop website",
        "lifestyle ecommerce solution",
        "ecommerce templates with backend",
      ],
    },
  },

  about: {
    bn: {
      title: "আমাদের সম্পর্কে — Trialvo Shop টিম ও কাজের ধরন",
      description:
        "Trialvo Shop বাংলাদেশের উদ্যোক্তা ও ছোট ব্যবসার জন্য প্রোডাকশন-রেডি ইকমার্স সলিউশন তৈরি করে। আমাদের লক্ষ্য, কাজের প্রক্রিয়া, টেকনোলজি স্ট্যাক এবং আজীবন সাপোর্টের প্রতিশ্রুতি সম্পর্কে জানুন।",
      keywords: [
        "Trialvo Shop সম্পর্কে",
        "ইকমার্স ডেভেলপমেন্ট টিম বাংলাদেশ",
        "সফটওয়্যার কোম্পানি সাভার ঢাকা",
        "কাস্টম ইকমার্স ডেভেলপমেন্ট",
      ],
    },
    en: {
      title: "About us — the Trialvo Shop team and how we work",
      description:
        "Trialvo Shop builds production-ready ecommerce solutions for entrepreneurs and small businesses in Bangladesh. Learn about our mission, delivery process, technology stack, and lifetime support commitment.",
      keywords: [
        "about Trialvo Shop",
        "ecommerce development team Bangladesh",
        "software company Savar Dhaka",
        "custom ecommerce development",
      ],
    },
  },

  contact: {
    bn: {
      title: "যোগাযোগ — সেলস, সাপোর্ট ও কাস্টম ডেভেলপমেন্ট",
      description:
        "Trialvo Shop-এর সাথে যোগাযোগ করুন। প্রোডাক্ট, লাইভ ট্রায়াল, প্রাইসিং, আজীবন সাপোর্ট বা কাস্টম ইকমার্স ডেভেলপমেন্ট নিয়ে ফোন, ইমেইল বা হোয়াটসঅ্যাপে কথা বলুন।",
      keywords: [
        "Trialvo Shop যোগাযোগ",
        "ইকমার্স সাপোর্ট বাংলাদেশ",
        "ওয়েবসাইট কেনার জন্য যোগাযোগ",
        "কাস্টম ডেভেলপমেন্ট কোটেশন",
      ],
    },
    en: {
      title: "Contact — sales, support, and custom development",
      description:
        "Get in touch with Trialvo Shop. Talk to us by phone, email, or WhatsApp about products, live trials, pricing, lifetime support, or custom ecommerce development.",
      keywords: [
        "contact Trialvo Shop",
        "ecommerce support Bangladesh",
        "website purchase enquiry",
        "custom development quote",
      ],
    },
  },

  faq: {
    bn: {
      title: "সাধারণ প্রশ্নোত্তর — লাইসেন্স, ট্রায়াল, পেমেন্ট ও সাপোর্ট",
      description:
        "রেডিমেড ইকমার্স ওয়েবসাইট কেনা নিয়ে সব সাধারণ প্রশ্নের উত্তর — লাইসেন্স কীভাবে কাজ করে, লাইভ ট্রায়াল কী, কী কী ফাইল পাবেন, পেমেন্ট পদ্ধতি, হোস্টিং, কাস্টমাইজেশন এবং আজীবন সাপোর্টের সীমা।",
      keywords: [
        "ইকমার্স ওয়েবসাইট প্রশ্নোত্তর",
        "লাইসেন্স কীভাবে কাজ করে",
        "ট্রায়াল কীভাবে নেব",
        "সোর্স কোড কী পাব",
        "হোস্টিং প্রয়োজন কি",
      ],
    },
    en: {
      title: "FAQ — licensing, trials, payments, and support",
      description:
        "Answers to the most common questions about buying a ready-made ecommerce website: how the lifetime license works, what a live trial includes, which files you receive, payment methods, hosting, customization, and support scope.",
      keywords: [
        "ecommerce website FAQ",
        "how does the license work",
        "how to start a trial",
        "what source code is included",
        "do I need hosting",
      ],
    },
  },

  howItWorks: {
    bn: {
      title: "কীভাবে কাজ করে — ডেমো থেকে নিজের ডোমেইনে লাইভ শপ, ৫ ধাপ",
      description:
        "প্রোডাক্ট বাছাই, ইনস্ট্যান্ট ডেমো, নিজের ডোমেইনে এক মাস ফ্রি ট্রায়াল, এককালীন পেমেন্ট এবং সোর্স কোড ডেলিভারি — Trialvo Shop-এ রেডিমেড ইকমার্স ওয়েবসাইট নেওয়ার পুরো প্রক্রিয়া ধাপে ধাপে জানুন।",
      keywords: [
        "ইকমার্স ওয়েবসাইট কেনার নিয়ম",
        "লাইভ ট্রায়াল প্রক্রিয়া",
        "ওয়েবসাইট ডেলিভারি প্রক্রিয়া",
        "অনলাইন শপ সেটআপ ধাপ",
      ],
    },
    en: {
      title: "How it works — five steps from demo to a live shop on your domain",
      description:
        "Pick a product, open the instant demo, run a month-long free trial on your own domain, pay once, then receive the source code. See the complete step-by-step process for getting a ready-made ecommerce website from Trialvo Shop.",
      keywords: [
        "how to buy an ecommerce website",
        "live trial process",
        "website delivery process",
        "online shop setup steps",
      ],
    },
  },

  terms: {
    bn: {
      title: "শর্তাবলী — ব্যবহারের নিয়ম, লাইসেন্স ও দায়বদ্ধতা",
      description:
        "Trialvo Shop-এর সেবা ব্যবহারের সম্পূর্ণ শর্তাবলী — অ্যাকাউন্ট, প্রোডাক্ট ডেলিভারি, মূল্য ও পেমেন্ট, আজীবন লাইসেন্সের শর্ত, ট্রায়াল নিয়ম, মেধাসম্পদ, দায়বদ্ধতার সীমা এবং প্রযোজ্য আইন।",
      keywords: [
        "শর্তাবলী ইকমার্স ওয়েবসাইট",
        "ব্যবহারের নিয়ম",
        "লাইসেন্সের শর্ত",
        "দায়বদ্ধতার সীমা",
      ],
    },
    en: {
      title: "Terms & Conditions — usage rules, licensing, and liability",
      description:
        "The complete terms for using Trialvo Shop: accounts, product delivery, pricing and payment, lifetime license conditions, trial rules, intellectual property, limitation of liability, and governing law.",
      keywords: [
        "ecommerce website terms and conditions",
        "terms of service",
        "license conditions",
        "limitation of liability",
      ],
    },
  },

  privacy: {
    bn: {
      title: "গোপনীয়তা নীতি — তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষা",
      description:
        "Trialvo Shop কোন তথ্য সংগ্রহ করে, কেন করে, কতদিন রাখে এবং কীভাবে সুরক্ষিত রাখে তার বিস্তারিত বিবরণ। আপনার অধিকার, তৃতীয় পক্ষের সেবা, কুকি এবং যোগাযোগের উপায় সম্পর্কে জানুন।",
      keywords: [
        "গোপনীয়তা নীতি",
        "ব্যক্তিগত তথ্য সুরক্ষা",
        "ডেটা সংরক্ষণ নীতি",
        "ব্যবহারকারীর অধিকার",
      ],
    },
    en: {
      title: "Privacy Policy — what we collect, how we use it, how we protect it",
      description:
        "A detailed account of the data Trialvo Shop collects, why we collect it, how long we keep it, and how we secure it — plus your rights, the third-party services we rely on, cookies, and how to contact us.",
      keywords: [
        "privacy policy",
        "personal data protection",
        "data retention policy",
        "user data rights",
      ],
    },
  },

  refund: {
    bn: {
      title: "রিফান্ড ও ক্যান্সেলেশন নীতি — ডিজিটাল প্রোডাক্টের নিয়ম",
      description:
        "ডিজিটাল প্রোডাক্টের রিফান্ড কখন প্রযোজ্য এবং কখন নয়, ট্রায়াল কেন রিফান্ডের ঝুঁকি কমায়, ক্যান্সেলেশনের নিয়ম, চার্জব্যাক এবং রিফান্ড দাবি করার সম্পূর্ণ প্রক্রিয়া জানুন।",
      keywords: [
        "রিফান্ড নীতি",
        "ডিজিটাল প্রোডাক্ট রিফান্ড",
        "টাকা ফেরত নিয়ম",
        "অর্ডার বাতিল",
      ],
    },
    en: {
      title: "Refund & Cancellation Policy — rules for digital products",
      description:
        "When a refund applies to a digital product and when it does not, why the live trial reduces refund risk, cancellation rules, chargebacks, and the full process for requesting a refund from Trialvo Shop.",
      keywords: [
        "refund policy",
        "digital product refund",
        "money back rules",
        "order cancellation",
      ],
    },
  },

  license: {
    bn: {
      title: "লাইসেন্স চুক্তি — আজীবন ব্যবহারের অধিকার ও সীমা",
      description:
        "Trialvo Shop প্রোডাক্টের আজীবন লাইসেন্স চুক্তি — কী কী করতে পারবেন, কী পারবেন না, ডোমেইন সীমা, সোর্স কোড পরিবর্তন, পুনঃবিক্রয় নিষেধাজ্ঞা এবং লাইসেন্স বাতিলের শর্ত।",
      keywords: [
        "লাইসেন্স চুক্তি",
        "আজীবন লাইসেন্স শর্ত",
        "সোর্স কোড ব্যবহারের অধিকার",
        "পুনঃবিক্রয় নিষেধ",
      ],
    },
    en: {
      title: "License Agreement — lifetime usage rights and limits",
      description:
        "The lifetime license agreement for Trialvo Shop products: what you may do, what you may not do, domain limits, modifying the source code, redistribution restrictions, and grounds for license termination.",
      keywords: [
        "license agreement",
        "lifetime license terms",
        "source code usage rights",
        "redistribution restrictions",
      ],
    },
  },

  cookies: {
    bn: {
      title: "কুকি নীতি — কোন কুকি ব্যবহার করি এবং কেন",
      description:
        "Trialvo Shop কোন ধরনের কুকি ও লোকাল স্টোরেজ ব্যবহার করে, প্রতিটির উদ্দেশ্য, মেয়াদ, তৃতীয় পক্ষের কুকি এবং ব্রাউজারে কুকি নিয়ন্ত্রণ বা মুছে ফেলার উপায়।",
      keywords: [
        "কুকি নীতি",
        "কুকি ব্যবহার",
        "ব্রাউজার স্টোরেজ",
        "ট্র্যাকিং নীতি",
      ],
    },
    en: {
      title: "Cookie Policy — which cookies we use and why",
      description:
        "The cookies and local storage Trialvo Shop uses, the purpose and lifetime of each, which third-party cookies may be set, and how to control or delete cookies in your browser.",
      keywords: [
        "cookie policy",
        "cookie usage",
        "browser storage",
        "tracking policy",
      ],
    },
  },

  acceptableUse: {
    bn: {
      title: "গ্রহণযোগ্য ব্যবহার নীতি — নিষিদ্ধ কাজ ও প্রয়োগ",
      description:
        "Trialvo Shop-এর প্রোডাক্ট, ট্রায়াল পরিবেশ ও সাপোর্ট চ্যানেল ব্যবহারের গ্রহণযোগ্য নিয়ম — নিষিদ্ধ কনটেন্ট, অপব্যবহার, নিরাপত্তা পরীক্ষা, রিসোর্স সীমা এবং লঙ্ঘনের ফলাফল।",
      keywords: [
        "গ্রহণযোগ্য ব্যবহার নীতি",
        "নিষিদ্ধ ব্যবহার",
        "ট্রায়াল অপব্যবহার",
        "সেবা ব্যবহারের সীমা",
      ],
    },
    en: {
      title: "Acceptable Use Policy — prohibited activity and enforcement",
      description:
        "The rules for using Trialvo Shop products, trial environments, and support channels: prohibited content, abuse, security testing, resource limits, and what happens if the policy is violated.",
      keywords: [
        "acceptable use policy",
        "prohibited use",
        "trial abuse",
        "service usage limits",
      ],
    },
  },

  disclaimer: {
    bn: {
      title: "ডিসক্লেইমার — তথ্যের সীমাবদ্ধতা ও দায়িত্ব",
      description:
        "Trialvo Shop-এর ওয়েবসাইট, ডেমো ও ডকুমেন্টেশনে দেওয়া তথ্যের সীমাবদ্ধতা, আয় বা ফলাফলের কোনো নিশ্চয়তা না থাকা, তৃতীয় পক্ষের লিংক এবং বাহ্যিক সেবার উপর নির্ভরতা সম্পর্কে বিবরণ।",
      keywords: [
        "ডিসক্লেইমার",
        "কোনো নিশ্চয়তা নেই",
        "তৃতীয় পক্ষের লিংক",
        "তথ্যের সীমাবদ্ধতা",
      ],
    },
    en: {
      title: "Disclaimer — limits of information and responsibility",
      description:
        "The limits of the information on the Trialvo Shop website, demos, and documentation: no earnings or results guarantee, third-party links, and dependence on external services.",
      keywords: [
        "disclaimer",
        "no warranty",
        "third-party links",
        "information limitations",
      ],
    },
  },

  support: {
    bn: {
      title: "সাপোর্ট নীতি — আজীবন সাপোর্টে কী থাকে",
      description:
        "আজীবন সাপোর্টে কী কী অন্তর্ভুক্ত ও কী নয়, রেসপন্স টাইম, সাপোর্ট চ্যানেল, বাগ ফিক্স বনাম কাস্টমাইজেশন, আপডেট ডেলিভারি এবং সাপোর্ট চাওয়ার সঠিক উপায়।",
      keywords: [
        "সাপোর্ট নীতি",
        "আজীবন সাপোর্ট কী",
        "রেসপন্স টাইম",
        "বাগ ফিক্স সাপোর্ট",
      ],
    },
    en: {
      title: "Support Policy — what lifetime support covers",
      description:
        "What lifetime support includes and excludes, response times, support channels, bug fixes versus customization, how updates are delivered, and the right way to raise a support request.",
      keywords: [
        "support policy",
        "what is lifetime support",
        "response time",
        "bug fix support",
      ],
    },
  },

  checkout: {
    bn: {
      title: "চেকআউট — নিরাপদ এককালীন পেমেন্ট",
      description: "নিরাপদ চেকআউট — এককালীন পেমেন্ট, আজীবন সাপোর্ট ও আপডেট।",
      keywords: [],
    },
    en: {
      title: "Checkout — secure one-time payment",
      description: "Secure checkout — one-time payment with lifetime support and updates.",
      keywords: [],
    },
  },

  orderSuccess: {
    bn: {
      title: "অর্ডার সফল",
      description: "আপনার অর্ডার সম্পন্ন হয়েছে।",
      keywords: [],
    },
    en: {
      title: "Order successful",
      description: "Your order has been completed.",
      keywords: [],
    },
  },

  trialSubmitted: {
    bn: {
      title: "ট্রায়াল অনুরোধ পাঠানো হয়েছে",
      description: "ইমেইল চেক করুন — অনুমোদন হলে স্ট্যাটাস লিংক পাবেন।",
      keywords: [],
    },
    en: {
      title: "Trial request submitted",
      description: "Check your email — you will get a status link once approved.",
      keywords: [],
    },
  },

  notFound: {
    bn: {
      title: "পেজ পাওয়া যায়নি",
      description: "আপনি যে পেজটি খুঁজছেন তা পাওয়া যায়নি।",
      keywords: [],
    },
    en: {
      title: "Page not found",
      description: "The page you are looking for was not found.",
      keywords: [],
    },
  },
};

/** Page copy with the site-wide head terms merged in (deduped, page terms first). */
export function pageSeo(key: PageSeoKey, locale: Locale): PageSeoCopy {
  const page = PAGE_SEO[key][locale];
  if (page.keywords.length === 0) return page;
  return {
    ...page,
    keywords: Array.from(new Set([...page.keywords, ...SITE_KEYWORDS[locale]])),
  };
}
