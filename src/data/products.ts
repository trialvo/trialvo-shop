export interface Product {
  id: string;
  slug: string;
  category: "ecommerce" | "fashion" | "gift" | "accessories" | "tech";
  priceBDT: number;
  priceUSD: number;
  thumbnail: string;
  images: {
    admin: string[];
    shop: string[];
  };
  videoUrl?: string;
  demo: {
    label: { bn: string; en: string };
    url: string;
    username: string;
    password: string;
  }[];
  name: {
    bn: string;
    en: string;
  };
  shortDescription: {
    bn: string;
    en: string;
  };
  features: {
    bn: string[];
    en: string[];
  };
  facilities: {
    bn: string[];
    en: string[];
  };
  faq: {
    question: { bn: string; en: string };
    answer: { bn: string; en: string };
  }[];
  seo: {
    title: { bn: string; en: string };
    description: { bn: string; en: string };
    keywords: { bn: string[]; en: string[] };
  };
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

export const products: Product[] = [
  {
    id: "1",
    slug: "complete-ecommerce-solution",
    category: "ecommerce",
    priceBDT: 15000,
    priceUSD: 150,
    thumbnail:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
    images: {
      admin: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop",
      ],
      shop: [
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=500&fit=crop",
      ],
    },
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    demo: [
      {
        label: { bn: "এডমিন প্যানেল", en: "Admin Panel" },
        url: "https://demo-admin.example.com",
        username: "admin@demo.com",
        password: "demo123",
      },
      {
        label: { bn: "শপ ওয়েবসাইট", en: "Shop Website" },
        url: "https://demo-shop.example.com",
        username: "user@demo.com",
        password: "user123",
      },
    ],
    name: {
      bn: "কমপ্লিট ইকমার্স সলিউশন",
      en: "Complete Ecommerce Solution",
    },
    shortDescription: {
      bn: "সম্পূর্ণ ইকমার্স ওয়েবসাইট এডমিন প্যানেল সহ। মাল্টি-ভেন্ডর সাপোর্ট, পেমেন্ট গেটওয়ে, ইনভেন্টরি ম্যানেজমেন্ট।",
      en: "Complete ecommerce website with admin panel. Multi-vendor support, payment gateway, inventory management.",
    },
    features: {
      bn: [
        "মাল্টি-ভেন্ডর সাপোর্ট",
        "SSL সুরক্ষিত পেমেন্ট",
        "ইনভেন্টরি ম্যানেজমেন্ট",
        "অর্ডার ট্র্যাকিং",
        "কুপন ও ডিসকাউন্ট সিস্টেম",
        "রিপোর্ট ও অ্যানালিটিক্স",
        "মোবাইল রেসপন্সিভ ডিজাইন",
        "SEO অপটিমাইজড",
      ],
      en: [
        "Multi-vendor Support",
        "SSL Secured Payment",
        "Inventory Management",
        "Order Tracking",
        "Coupon & Discount System",
        "Reports & Analytics",
        "Mobile Responsive Design",
        "SEO Optimized",
      ],
    },
    facilities: {
      bn: [
        "৩ মাস ফ্রি সাপোর্ট",
        "ইনস্টলেশন সহায়তা",
        "বিস্তারিত ডকুমেন্টেশন",
        "ভিডিও টিউটোরিয়াল",
        "সোর্স কোড সহ",
        "লাইফটাইম আপডেট",
      ],
      en: [
        "3 Months Free Support",
        "Installation Assistance",
        "Detailed Documentation",
        "Video Tutorials",
        "Source Code Included",
        "Lifetime Updates",
      ],
    },
    faq: [
      {
        question: {
          bn: "এই ওয়েবসাইট কি কাস্টমাইজ করা যাবে?",
          en: "Can this website be customized?",
        },
        answer: {
          bn: "হ্যাঁ, সম্পূর্ণ সোর্স কোড দেওয়া হয়। আপনি চাইলে নিজে বা ডেভেলপার দিয়ে কাস্টমাইজ করতে পারবেন।",
          en: "Yes, complete source code is provided. You can customize it yourself or hire a developer.",
        },
      },
      {
        question: {
          bn: "হোস্টিং কি দেওয়া হয়?",
          en: "Is hosting included?",
        },
        answer: {
          bn: "হোস্টিং আলাদাভাবে কিনতে হবে। তবে আমরা হোস্টিং সেটআপে সাহায্য করি।",
          en: "Hosting needs to be purchased separately. However, we help with hosting setup.",
        },
      },
      {
        question: {
          bn: "পেমেন্ট গেটওয়ে কি ইন্টিগ্রেট করা আছে?",
          en: "Is payment gateway integrated?",
        },
        answer: {
          bn: "হ্যাঁ, SSLCommerz, bKash, Nagad সাপোর্ট করে। আপনার মার্চেন্ট একাউন্ট কনফিগার করে দিতে হবে।",
          en: "Yes, supports SSLCommerz, bKash, Nagad. You need to configure your merchant account.",
        },
      },
    ],
    seo: {
      title: {
        bn: "কমপ্লিট ইকমার্স সলিউশন - এডমিন প্যানেল সহ",
        en: "Complete Ecommerce Solution - With Admin Panel",
      },
      description: {
        bn: "বাংলাদেশের জন্য সেরা রেডিমেড ইকমার্স ওয়েবসাইট। মাল্টি-ভেন্ডর সাপোর্ট, পেমেন্ট গেটওয়ে, এডমিন প্যানেল সহ সম্পূর্ণ সলিউশন।",
        en: "Best ready-made ecommerce website for Bangladesh. Complete solution with multi-vendor support, payment gateway, and admin panel.",
      },
      keywords: {
        bn: [
          "ইকমার্স ওয়েবসাইট",
          "রেডিমেড ইকমার্স",
          "এডমিন প্যানেল",
          "অনলাইন শপ",
        ],
        en: [
          "ecommerce website",
          "ready-made ecommerce",
          "admin panel",
          "online shop",
        ],
      },
    },
    isFeatured: true,
    isActive: true,
    createdAt: "2025-01-01",
  },
  {
    id: "2",
    slug: "fashion-store-pro",
    category: "fashion",
    priceBDT: 12000,
    priceUSD: 120,
    thumbnail:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
    images: {
      admin: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
      ],
      shop: [
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=500&fit=crop",
      ],
    },
    demo: [
      {
        label: { bn: "এডমিন প্যানেল", en: "Admin Panel" },
        url: "https://fashion-admin.example.com",
        username: "admin@demo.com",
        password: "demo123",
      },
    ],
    name: {
      bn: "ফ্যাশন স্টোর প্রো",
      en: "Fashion Store Pro",
    },
    shortDescription: {
      bn: "মডার্ন ফ্যাশন স্টোর ওয়েবসাইট। সাইজ গাইড, কালার ভ্যারিয়েন্ট, উইশলিস্ট সুবিধা সহ।",
      en: "Modern fashion store website. Includes size guide, color variants, and wishlist feature.",
    },
    features: {
      bn: [
        "সাইজ গাইড সিস্টেম",
        "কালার ভ্যারিয়েন্ট",
        "উইশলিস্ট",
        "কুইক ভিউ",
        "প্রোডাক্ট কম্পেয়ার",
        "রিভিউ সিস্টেম",
      ],
      en: [
        "Size Guide System",
        "Color Variants",
        "Wishlist",
        "Quick View",
        "Product Compare",
        "Review System",
      ],
    },
    facilities: {
      bn: [
        "২ মাস ফ্রি সাপোর্ট",
        "ইনস্টলেশন সহায়তা",
        "ডকুমেন্টেশন",
        "সোর্স কোড সহ",
      ],
      en: [
        "2 Months Free Support",
        "Installation Assistance",
        "Documentation",
        "Source Code Included",
      ],
    },
    faq: [
      {
        question: {
          bn: "সাইজ চার্ট কাস্টমাইজ করা যাবে?",
          en: "Can size chart be customized?",
        },
        answer: {
          bn: "হ্যাঁ, এডমিন প্যানেল থেকে সহজেই সাইজ চার্ট এডিট করা যায়।",
          en: "Yes, size chart can be easily edited from admin panel.",
        },
      },
    ],
    seo: {
      title: {
        bn: "ফ্যাশন স্টোর প্রো - মডার্ন ফ্যাশন ইকমার্স",
        en: "Fashion Store Pro - Modern Fashion Ecommerce",
      },
      description: {
        bn: "ফ্যাশন ব্র্যান্ডের জন্য আধুনিক ইকমার্স ওয়েবসাইট। সাইজ গাইড, কালার ভ্যারিয়েন্ট সহ সম্পূর্ণ সলিউশন।",
        en: "Modern ecommerce website for fashion brands. Complete solution with size guide and color variants.",
      },
      keywords: {
        bn: ["ফ্যাশন ওয়েবসাইট", "কাপড়ের দোকান", "অনলাইন ফ্যাশন স্টোর"],
        en: ["fashion website", "clothing store", "online fashion store"],
      },
    },
    isFeatured: true,
    isActive: true,
    createdAt: "2025-01-02",
  },
  {
    id: "3",
    slug: "gift-shop-starter",
    category: "gift",
    priceBDT: 10000,
    priceUSD: 100,
    thumbnail:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=400&fit=crop",
    images: {
      admin: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
      ],
      shop: [
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&h=500&fit=crop",
      ],
    },
    demo: [
      {
        label: { bn: "এডমিন প্যানেল", en: "Admin Panel" },
        url: "https://gift-admin.example.com",
        username: "admin@demo.com",
        password: "demo123",
      },
    ],
    name: {
      bn: "গিফট শপ স্টার্টার",
      en: "Gift Shop Starter",
    },
    shortDescription: {
      bn: "গিফট শপের জন্য সুন্দর ওয়েবসাইট। গিফট র‍্যাপিং অপশন, মেসেজ কার্ড সুবিধা সহ।",
      en: "Beautiful website for gift shops. Includes gift wrapping option and message card feature.",
    },
    features: {
      bn: [
        "গিফট র‍্যাপিং অপশন",
        "মেসেজ কার্ড",
        "অকেশন ফিল্টার",
        "প্রাইস রেঞ্জ ফিল্টার",
        "রিমাইন্ডার সিস্টেম",
      ],
      en: [
        "Gift Wrapping Option",
        "Message Card",
        "Occasion Filter",
        "Price Range Filter",
        "Reminder System",
      ],
    },
    facilities: {
      bn: ["২ মাস ফ্রি সাপোর্ট", "ইনস্টলেশন সহায়তা", "ডকুমেন্টেশন"],
      en: ["2 Months Free Support", "Installation Assistance", "Documentation"],
    },
    faq: [],
    seo: {
      title: {
        bn: "গিফট শপ স্টার্টার - গিফট ইকমার্স সলিউশন",
        en: "Gift Shop Starter - Gift Ecommerce Solution",
      },
      description: {
        bn: "গিফট শপের জন্য রেডিমেড ওয়েবসাইট। গিফট র‍্যাপিং, মেসেজ কার্ড সুবিধা সহ।",
        en: "Ready-made website for gift shops. Includes gift wrapping and message card features.",
      },
      keywords: {
        bn: ["গিফট শপ", "উপহারের দোকান", "অনলাইন গিফট স্টোর"],
        en: ["gift shop", "gift store", "online gift store"],
      },
    },
    isFeatured: true,
    isActive: true,
    createdAt: "2025-01-03",
  },
  {
    id: "4",
    slug: "accessories-hub",
    category: "accessories",
    priceBDT: 11000,
    priceUSD: 110,
    thumbnail:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop",
    images: {
      admin: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
      ],
      shop: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=500&fit=crop",
      ],
    },
    demo: [
      {
        label: { bn: "এডমিন প্যানেল", en: "Admin Panel" },
        url: "https://accessories-admin.example.com",
        username: "admin@demo.com",
        password: "demo123",
      },
    ],
    name: {
      bn: "একসেসরিজ হাব",
      en: "Accessories Hub",
    },
    shortDescription: {
      bn: "একসেসরিজ বিক্রির জন্য মডার্ন ওয়েবসাইট। ওয়াচ, জুয়েলারি, ব্যাগ - সব ধরনের প্রোডাক্টের জন্য উপযুক্ত।",
      en: "Modern website for selling accessories. Suitable for watches, jewelry, bags, and all types of products.",
    },
    features: {
      bn: [
        "জুম ইমেজ ভিউ",
        "ব্র্যান্ড ফিল্টার",
        "ম্যাটেরিয়াল ফিল্টার",
        "নতুন আগমন সেকশন",
        "বেস্ট সেলার সেকশন",
      ],
      en: [
        "Zoom Image View",
        "Brand Filter",
        "Material Filter",
        "New Arrivals Section",
        "Best Seller Section",
      ],
    },
    facilities: {
      bn: ["২ মাস ফ্রি সাপোর্ট", "ইনস্টলেশন সহায়তা", "ডকুমেন্টেশন"],
      en: ["2 Months Free Support", "Installation Assistance", "Documentation"],
    },
    faq: [],
    seo: {
      title: {
        bn: "একসেসরিজ হাব - একসেসরিজ ইকমার্স",
        en: "Accessories Hub - Accessories Ecommerce",
      },
      description: {
        bn: "একসেসরিজ বিক্রির জন্য রেডিমেড ওয়েবসাইট। ঘড়ি, জুয়েলারি, ব্যাগ বিক্রির জন্য আদর্শ।",
        en: "Ready-made website for selling accessories. Ideal for watches, jewelry, and bags.",
      },
      keywords: {
        bn: ["একসেসরিজ শপ", "ঘড়ির দোকান", "জুয়েলারি শপ"],
        en: ["accessories shop", "watch store", "jewelry shop"],
      },
    },
    isFeatured: false,
    isActive: true,
    createdAt: "2025-01-04",
  },
  {
    id: "5",
    slug: "tech-gadget-store",
    category: "tech",
    priceBDT: 14000,
    priceUSD: 140,
    thumbnail:
      "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&h=400&fit=crop",
    images: {
      admin: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
      ],
      shop: [
        "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=500&fit=crop",
      ],
    },
    demo: [
      {
        label: { bn: "এডমিন প্যানেল", en: "Admin Panel" },
        url: "https://tech-admin.example.com",
        username: "admin@demo.com",
        password: "demo123",
      },
    ],
    name: {
      bn: "টেক গ্যাজেট স্টোর",
      en: "Tech Gadget Store",
    },
    shortDescription: {
      bn: "ইলেকট্রনিক্স ও গ্যাজেট বিক্রির জন্য ওয়েবসাইট। স্পেসিফিকেশন টেবিল, কম্পেয়ার ফিচার সহ।",
      en: "Website for selling electronics and gadgets. Includes specification table and compare feature.",
    },
    features: {
      bn: [
        "স্পেসিফিকেশন টেবিল",
        "প্রোডাক্ট কম্পেয়ার",
        "ব্র্যান্ড পেজ",
        "ওয়ারেন্টি ইনফো",
        "EMI ক্যালকুলেটর",
      ],
      en: [
        "Specification Table",
        "Product Compare",
        "Brand Page",
        "Warranty Info",
        "EMI Calculator",
      ],
    },
    facilities: {
      bn: [
        "৩ মাস ফ্রি সাপোর্ট",
        "ইনস্টলেশন সহায়তা",
        "ডকুমেন্টেশন",
        "ভিডিও টিউটোরিয়াল",
      ],
      en: [
        "3 Months Free Support",
        "Installation Assistance",
        "Documentation",
        "Video Tutorials",
      ],
    },
    faq: [],
    seo: {
      title: {
        bn: "টেক গ্যাজেট স্টোর - ইলেকট্রনিক্স ইকমার্স",
        en: "Tech Gadget Store - Electronics Ecommerce",
      },
      description: {
        bn: "ইলেকট্রনিক্স ও গ্যাজেট বিক্রির জন্য রেডিমেড ওয়েবসাইট। স্পেসিফিকেশন টেবিল ও EMI ক্যালকুলেটর সহ।",
        en: "Ready-made website for electronics and gadgets. Includes specification table and EMI calculator.",
      },
      keywords: {
        bn: ["টেক শপ", "গ্যাজেট স্টোর", "ইলেকট্রনিক্স শপ"],
        en: ["tech shop", "gadget store", "electronics shop"],
      },
    },
    isFeatured: true,
    isActive: true,
    createdAt: "2025-01-05",
  },
];

export const categories = [
  {
    id: "ecommerce",
    name: { bn: "ইকমার্স", en: "Ecommerce" },
    icon: "ShoppingCart",
    description: {
      bn: "সাধারণ ইকমার্স সলিউশন",
      en: "General ecommerce solutions",
    },
  },
  {
    id: "fashion",
    name: { bn: "ফ্যাশন", en: "Fashion" },
    icon: "Shirt",
    description: {
      bn: "পোশাক ও ফ্যাশন স্টোর",
      en: "Clothing and fashion stores",
    },
  },
  {
    id: "gift",
    name: { bn: "গিফট শপ", en: "Gift Shop" },
    icon: "Gift",
    description: { bn: "উপহারের দোকান", en: "Gift and souvenir shops" },
  },
  {
    id: "accessories",
    name: { bn: "একসেসরিজ", en: "Accessories" },
    icon: "Watch",
    description: { bn: "ঘড়ি, জুয়েলারি, ব্যাগ", en: "Watches, jewelry, bags" },
  },
  {
    id: "tech",
    name: { bn: "টেক প্রোডাক্ট", en: "Tech Products" },
    icon: "Smartphone",
    description: {
      bn: "ইলেকট্রনিক্স ও গ্যাজেট",
      en: "Electronics and gadgets",
    },
  },
];

export const getProductBySlug = (slug: string): Product | undefined => {
  return products.find((p) => p.slug === slug);
};

export const getProductsByCategory = (category: string): Product[] => {
  return products.filter((p) => p.category === category && p.isActive);
};

export const getFeaturedProducts = (): Product[] => {
  return products.filter((p) => p.isFeatured && p.isActive);
};

export const getRelatedProducts = (
  productId: string,
  category: string,
): Product[] => {
  return products
    .filter((p) => p.id !== productId && p.category === category && p.isActive)
    .slice(0, 3);
};
