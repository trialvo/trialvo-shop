import type { Locale } from "@/lib/i18n";

export type PageSeoCopy = {
  title: string;
  description: string;
  keywords: string[];
};

export const PAGE_SEO: Record<
  | "home"
  | "products"
  | "about"
  | "contact"
  | "terms"
  | "privacy"
  | "checkout"
  | "orderSuccess"
  | "trialSubmitted"
  | "notFound",
  Record<Locale, PageSeoCopy>
> = {
  home: {
    bn: {
      title: "রেডিমেড ইকমার্স সলিউশন — আজীবন লাইসেন্স ও সাপোর্ট",
      description:
        "Trialvo Shop থেকে রেডিমেড ইকমার্স ওয়েবসাইট কিনুন। এডমিন প্যানেল + শপ, এককালীন পেমেন্ট, আজীবন সাপোর্ট ও আপডেট। লাইভ ট্রায়াল উপলব্ধ।",
      keywords: [
        "রেডিমেড ইকমার্স",
        "ইকমার্স ওয়েবসাইট কিনুন",
        "আজীবন সাপোর্ট",
        "এডমিন প্যানেল",
        "Trialvo Shop",
      ],
    },
    en: {
      title: "Ready-made ecommerce solutions — lifetime license & support",
      description:
        "Buy ready-made ecommerce websites from Trialvo Shop. Admin panel + shop, one-time payment, lifetime support and updates. Live trial available.",
      keywords: [
        "ready-made ecommerce",
        "buy ecommerce website",
        "lifetime support",
        "admin panel",
        "Trialvo Shop",
      ],
    },
  },
  products: {
    bn: {
      title: "সকল প্রোডাক্ট — আজীবন ইকমার্স সলিউশন",
      description:
        "রেডিমেড ইকমার্স সলিউশন ব্রাউজ করুন। প্রতিটি প্রোডাক্ট এককালীন কেনাকাটা, আজীবন সাপোর্ট ও আপডেট সহ।",
      keywords: ["ইকমার্স প্রোডাক্ট", "রেডিমেড ওয়েবসাইট", "আজীবন লাইসেন্স"],
    },
    en: {
      title: "All products — lifetime ecommerce solutions",
      description:
        "Browse ready-made ecommerce solutions. Every product is a one-time purchase with lifetime support and updates.",
      keywords: ["ecommerce products", "ready-made website", "lifetime license"],
    },
  },
  about: {
    bn: {
      title: "আমাদের সম্পর্কে",
      description:
        "Trialvo Shop বাংলাদেশের উদ্যোক্তাদের জন্য রেডিমেড ইকমার্স সলিউশন দেয় — এককালীন কেনাকাটা, আজীবন সাপোর্ট।",
      keywords: ["Trialvo Shop", "আমাদের সম্পর্কে", "ইকমার্স সলিউশন"],
    },
    en: {
      title: "About us",
      description:
        "Trialvo Shop builds ready-made ecommerce solutions for Bangladeshi businesses — one-time purchase, lifetime support.",
      keywords: ["Trialvo Shop", "about", "ecommerce solutions"],
    },
  },
  contact: {
    bn: {
      title: "যোগাযোগ",
      description:
        "Trialvo Shop-এ যোগাযোগ করুন। প্রোডাক্ট, ট্রায়াল, আজীবন সাপোর্ট বা কাস্টম ডেভেলপমেন্ট নিয়ে প্রশ্ন করুন।",
      keywords: ["যোগাযোগ", "Trialvo Shop", "সাপোর্ট"],
    },
    en: {
      title: "Contact",
      description:
        "Contact Trialvo Shop about products, trials, lifetime support, or custom development.",
      keywords: ["contact", "Trialvo Shop", "support"],
    },
  },
  terms: {
    bn: {
      title: "শর্তাবলী",
      description:
        "Trialvo Shop-এর সেবা ব্যবহারের শর্তাবলী। এককালীন কেনাকাটা, আজীবন লাইসেন্স ও আজীবন সাপোর্ট।",
      keywords: ["শর্তাবলী", "আজীবন লাইসেন্স"],
    },
    en: {
      title: "Terms & Conditions",
      description:
        "Terms for using Trialvo Shop. One-time purchase, lifetime license, and lifetime support.",
      keywords: ["terms", "lifetime license"],
    },
  },
  privacy: {
    bn: {
      title: "গোপনীয়তা নীতি",
      description:
        "Trialvo Shop কিভাবে আপনার তথ্য সংগ্রহ, সংরক্ষণ ও ব্যবহার করে তা জানুন।",
      keywords: ["গোপনীয়তা নীতি", "প্রাইভেসি"],
    },
    en: {
      title: "Privacy Policy",
      description:
        "Learn how Trialvo Shop collects, stores, and uses your information.",
      keywords: ["privacy policy"],
    },
  },
  checkout: {
    bn: {
      title: "চেকআউট",
      description: "নিরাপদ চেকআউট — এককালীন পেমেন্ট, আজীবন সাপোর্ট।",
      keywords: [],
    },
    en: {
      title: "Checkout",
      description: "Secure checkout — one-time payment, lifetime support.",
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
      description: "ইমেইল চেক করুন।",
      keywords: [],
    },
    en: {
      title: "Trial request submitted",
      description: "Check your email.",
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

export function pageSeo(
  key: keyof typeof PAGE_SEO,
  locale: Locale,
): PageSeoCopy {
  return PAGE_SEO[key][locale];
}
