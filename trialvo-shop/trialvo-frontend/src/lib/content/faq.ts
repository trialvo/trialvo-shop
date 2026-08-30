import type { Locale } from "@/lib/i18n";

export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
};

export type FaqGroup = {
  id: string;
  title: string;
  description: string;
  entries: FaqEntry[];
};

/**
 * Buyer questions grouped by intent. Used by the FAQ page, the home FAQ
 * section, and FAQPage structured data — one source so the rich result always
 * matches what is on the page.
 */
const FAQ: Record<Locale, FaqGroup[]> = {
  bn: [
    {
      id: "buying",
      title: "কেনাকাটা ও প্রাইসিং",
      description: "দাম, পেমেন্ট এবং কেনার আগে যা জানা দরকার।",
      entries: [
        {
          id: "what-is-included",
          question: "একটি প্রোডাক্ট কিনলে ঠিক কী কী পাব?",
          answer:
            "প্রতিটি প্রোডাক্টে গ্রাহকমুখী শপ ফ্রন্টএন্ড, সম্পূর্ণ অ্যাডমিন প্যানেল, ডাটাবেস স্ট্রাকচার, সম্পূর্ণ সোর্স কোড এবং সেটআপ ডকুমেন্টেশন অন্তর্ভুক্ত। সাথে থাকে আজীবন লাইসেন্স, আজীবন সাপোর্ট ও আজীবন আপডেট। প্রোডাক্ট পেজের ফিচার তালিকাই ডেলিভারির চূড়ান্ত ভিত্তি।",
        },
        {
          id: "one-time-payment",
          question: "এটা কি সাবস্ক্রিপশন নাকি এককালীন পেমেন্ট?",
          answer:
            "সম্পূর্ণ এককালীন পেমেন্ট। কোনো মাসিক ফি, বার্ষিক নবায়ন বা লুকানো চার্জ নেই। একবার কিনলে লাইসেন্স আজীবনের জন্য আপনার, এবং সাপোর্ট ও আপডেটের জন্য আলাদা কোনো ফি দিতে হয় না।",
        },
        {
          id: "currency",
          question: "দাম BDT না USD-তে?",
          answer:
            "মূল বিলিং মুদ্রা বাংলাদেশি টাকা (BDT) এবং শপে BDT-ই প্রধান মূল্য হিসেবে দেখানো হয়। কিছু প্রোডাক্টে সুবিধার জন্য একটি ছোট USD মূল্যও দেখানো হয় — সেটি রূপান্তরিত হার নয়, আলাদাভাবে নির্ধারিত ঘোষিত মূল্য।",
        },
        {
          id: "payment-methods",
          question: "কীভাবে পেমেন্ট করতে পারি?",
          answer:
            "চেকআউটে নিরাপদ পেমেন্ট গেটওয়ের মাধ্যমে পেমেন্ট সম্পন্ন হয়। পেমেন্ট নিশ্চিত হওয়ার সাথে সাথে অর্ডার কনফার্ম হয় এবং ডেলিভারি প্রক্রিয়া শুরু হয়। আমরা আপনার সম্পূর্ণ কার্ড তথ্য সংরক্ষণ করি না।",
        },
        {
          id: "discount",
          question: "ডিসকাউন্ট কীভাবে কাজ করে?",
          answer:
            "কোনো প্রোডাক্টে ডিসকাউন্ট চালু থাকলে তালিকামূল্য কাটা দাগ দিয়ে এবং কার্যকর মূল্য পাশে স্পষ্টভাবে দেখানো হয়। চেকআউটে যে মোট মূল্য দেখবেন সেটিই চূড়ান্ত — অতিরিক্ত কোনো চার্জ যোগ হয় না।",
        },
      ],
    },
    {
      id: "trial",
      title: "লাইভ ট্রায়াল",
      description: "কেনার আগে প্রোডাক্ট চালিয়ে দেখার প্রক্রিয়া।",
      entries: [
        {
          id: "how-trial-works",
          question: "লাইভ ট্রায়াল কীভাবে কাজ করে?",
          answer:
            "প্রোডাক্ট পেজ থেকে ট্রায়ালের অনুরোধ করুন — নাম, ইমেইল ও ব্যবহারের উদ্দেশ্য দিলেই হয়। অনুমোদনের পর আপনি একটি সীমিত মেয়াদের চালু ইনস্ট্যান্স পাবেন, যেখানে শপ ও অ্যাডমিন প্যানেল দুটোই আসল প্রোডাক্টের মতো কাজ করবে। স্ট্যাটাস লিংক ইমেইলে পাঠানো হয়।",
        },
        {
          id: "trial-cost",
          question: "ট্রায়ালের জন্য টাকা লাগে?",
          answer:
            "না, ট্রায়াল শুরু করতে কোনো পেমেন্ট লাগে না এবং কার্ডের তথ্যও দিতে হয় না। শুধু মেয়াদ বাড়াতে চাইলে আলাদা এক্সটেন্ড প্যাক প্রযোজ্য হয়।",
        },
        {
          id: "trial-vs-purchase",
          question: "ট্রায়ালে যা দেখব, কেনার পর কি সেটাই পাব?",
          answer:
            "হ্যাঁ। ট্রায়াল একই কোডবেস থেকে চালু হয়, তাই ফিচার ও আচরণ একই থাকে। পার্থক্য হলো ট্রায়ালে ডেমো ডেটা থাকে এবং মেয়াদ সীমিত — কেনার পর আপনি সোর্স কোড ও আজীবন লাইসেন্স পান।",
        },
        {
          id: "trial-data",
          question: "ট্রায়ালে যোগ করা ডেটা কি থেকে যাবে?",
          answer:
            "ট্রায়াল মূল্যায়নের জন্য, ব্যবসা পরিচালনার জন্য নয়। মেয়াদ শেষ হওয়ার পর ট্রায়াল পরিবেশের ডেমো ডেটা মুছে ফেলা হতে পারে, তাই গুরুত্বপূর্ণ তথ্য ট্রায়ালে রাখবেন না।",
        },
      ],
    },
    {
      id: "license",
      title: "লাইসেন্স ও মালিকানা",
      description: "কোথায় ব্যবহার করতে পারবেন এবং কী কী সীমা আছে।",
      entries: [
        {
          id: "lifetime-meaning",
          question: "“আজীবন লাইসেন্স” মানে ঠিক কী?",
          answer:
            "লাইসেন্সের কোনো মেয়াদ শেষ হওয়ার তারিখ নেই এবং নবায়ন ফি নেই। একবার কিনলে প্রোডাক্ট ব্যবহারের অধিকার স্থায়ীভাবে আপনার থাকে, সাথে আজীবন সাপোর্ট ও আপডেটের সুবিধা।",
        },
        {
          id: "how-many-domains",
          question: "কয়টি ডোমেইনে ব্যবহার করতে পারব?",
          answer:
            "একটি লাইসেন্স একটি প্রোডাকশন ডোমেইনের জন্য। ডেভেলপমেন্ট ও স্টেজিং কপি রাখা যাবে, যদি সেগুলো গ্রাহকদের জন্য খোলা না থাকে। একাধিক লাইভ শপ চালাতে চাইলে প্রতিটির জন্য আলাদা লাইসেন্স প্রয়োজন।",
        },
        {
          id: "can-i-modify",
          question: "সোর্স কোড পরিবর্তন করতে পারব?",
          answer:
            "হ্যাঁ, সম্পূর্ণ সোর্স কোড আপনার হাতে থাকে — ডিজাইন, ফিচার ও ব্র্যান্ডিং নিজের প্রয়োজন অনুযায়ী বদলাতে পারবেন। তবে ব্যাপক পরিবর্তনের পর ভবিষ্যৎ আপডেট প্রয়োগ করতে বাড়তি কাজ লাগতে পারে, তাই ভার্সন কন্ট্রোল ব্যবহারের পরামর্শ দিচ্ছি।",
        },
        {
          id: "can-i-resell",
          question: "কোড অন্যের কাছে বিক্রি করতে পারব?",
          answer:
            "না। সোর্স কোড পুনঃবিক্রয়, পুনর্বিতরণ, সাবলাইসেন্স বা অন্য মার্কেটপ্লেসে টেমপ্লেট হিসেবে আপলোড করা নিষিদ্ধ। এজেন্সি হিসেবে একাধিক ক্লায়েন্টের জন্য ব্যবহার করতে চাইলে প্রতিটি প্রকল্পের জন্য আলাদা লাইসেন্স লাগবে।",
        },
      ],
    },
    {
      id: "technical",
      title: "টেকনিক্যাল ও সেটআপ",
      description: "হোস্টিং, ডোমেইন ও লাইভ করার প্রস্তুতি।",
      entries: [
        {
          id: "hosting-needed",
          question: "হোস্টিং ও ডোমেইন কি আমাকে নিতে হবে?",
          answer:
            "হ্যাঁ, প্রোডাক্ট লাইভ করতে নিজের ডোমেইন ও হোস্টিং প্রয়োজন। এগুলো প্রোডাক্ট মূল্যের অন্তর্ভুক্ত নয়। কোন ধরনের হোস্টিং প্রোডাক্টের জন্য উপযুক্ত সে ব্যাপারে আমরা পরামর্শ দিতে পারি, এবং প্রয়োজনে সার্ভার সেটআপ আলাদা সেবা হিসেবে নেওয়া যায়।",
        },
        {
          id: "technical-skill",
          question: "সেটআপ করতে কি প্রোগ্রামিং জানা লাগবে?",
          answer:
            "প্রতিটি প্রোডাক্টের সাথে ধাপে ধাপে সেটআপ ডকুমেন্টেশন দেওয়া হয় এবং সেটআপে সাপোর্ট গাইডেন্স অন্তর্ভুক্ত। মৌলিক হোস্টিং ব্যবস্থাপনা জানলে নিজে করা সম্ভব; না জানলে আমরা সেটআপে সহায়তা করি।",
        },
        {
          id: "mobile-seo",
          question: "প্রোডাক্টগুলো কি মোবাইল-ফ্রেন্ডলি ও SEO-বান্ধব?",
          answer:
            "হ্যাঁ। শপগুলো রেসপনসিভ লেআউট, দ্রুত লোডিং, পরিষ্কার URL স্ট্রাকচার, মেটা ট্যাগ ও স্ট্রাকচার্ড ডেটা মাথায় রেখে তৈরি। তবে সার্চ র‍্যাংকিং আপনার কনটেন্ট, প্রতিযোগিতা ও মার্কেটিংয়ের উপরও নির্ভর করে — কোনো নির্দিষ্ট র‍্যাংকের নিশ্চয়তা দেওয়া সম্ভব নয়।",
        },
        {
          id: "bangla-support",
          question: "শপ কি বাংলা ও ইংরেজি দুই ভাষায় চালানো যাবে?",
          answer:
            "প্রোডাক্টগুলো বাংলা ও ইংরেজি কনটেন্ট মাথায় রেখে তৈরি, এবং বাংলা টাইপোগ্রাফি সঠিকভাবে রেন্ডার হয়। প্রোডাক্ট পেজে দ্বিভাষিক সাপোর্টের বিস্তারিত উল্লেখ থাকে।",
        },
      ],
    },
    {
      id: "support",
      title: "ডেলিভারি ও সাপোর্ট",
      description: "কত দ্রুত পাবেন এবং পরে কী সহায়তা পাবেন।",
      entries: [
        {
          id: "delivery-time",
          question: "কত দ্রুত ডেলিভারি পাব?",
          answer:
            "প্রোডাক্ট ডিজিটাল, তাই পেমেন্ট নিশ্চিত হওয়ার পর দ্রুতই ডেলিভারি প্রক্রিয়া শুরু হয়। ডেলিভারি লিংক ও নির্দেশনা অর্ডারে দেওয়া ইমেইলে পাঠানো হয় — তাই সক্রিয় ইমেইল দেওয়া জরুরি।",
        },
        {
          id: "support-scope",
          question: "আজীবন সাপোর্টে কী কী পড়ে?",
          answer:
            "প্রোডাক্টের নিজস্ব বাগ ফিক্স, ইনস্টলেশন ও সেটআপ গাইডেন্স, অ্যাডমিন প্যানেল ব্যবহারের প্রশ্নের উত্তর, এবং প্রকাশিত আপডেট ও সিকিউরিটি প্যাচ পাওয়া। নতুন ফিচার তৈরি, রিডিজাইন, থার্ড-পার্টি ইন্টিগ্রেশন বা সার্ভার ব্যবস্থাপনা কাস্টম কাজ হিসেবে আলাদাভাবে হয়।",
        },
        {
          id: "response-time",
          question: "সাপোর্টে কত সময়ে উত্তর পাব?",
          answer:
            "কার্যদিবসে সাধারণত ২৪ ঘণ্টার মধ্যে প্রথম উত্তর দেওয়ার লক্ষ্য রাখি। প্রোডাক্ট অচল করে দেওয়া গুরুতর সমস্যা সর্বোচ্চ অগ্রাধিকার পায়।",
        },
        {
          id: "custom-work",
          question: "কাস্টম ফিচার বা নতুন সফটওয়্যার বানিয়ে দিতে পারবেন?",
          answer:
            "হ্যাঁ। রেডিমেড প্রোডাক্টের বাইরেও আমরা কাস্টমাইজেশন, নতুন ফিচার ডেভেলপমেন্ট, DevOps, মেইনটেন্যান্স এবং প্রয়োজন অনুযায়ী সম্পূর্ণ নতুন সফটওয়্যার তৈরি করি। প্রয়োজন জানিয়ে যোগাযোগ করলে কোটেশন দেওয়া হবে।",
        },
        {
          id: "refund",
          question: "রিফান্ড পাওয়া যায়?",
          answer:
            "প্রোডাক্ট ডিজিটাল হওয়ায় ডেলিভারির পর সাধারণত রিফান্ড প্রযোজ্য নয় — এ কারণেই আমরা কেনার আগে লাইভ ট্রায়াল দিই। তবে ডেলিভারি ব্যর্থতা, দ্বিগুণ চার্জ বা প্রোডাক্ট পেজের বর্ণনার সাথে মৌলিক অসঙ্গতির ক্ষেত্রে রিফান্ড প্রযোজ্য। বিস্তারিত রিফান্ড ও ক্যান্সেলেশন নীতি পেজে দেওয়া আছে।",
        },
      ],
    },
  ],

  en: [
    {
      id: "buying",
      title: "Buying and pricing",
      description: "Price, payment, and what to know before you buy.",
      entries: [
        {
          id: "what-is-included",
          question: "What exactly do I get when I buy a product?",
          answer:
            "Every product includes the customer-facing storefront, the full admin panel, the database structure, complete source code, and setup documentation. It comes with a lifetime license, lifetime support, and lifetime updates. The feature list on the product page is the definitive basis for what is delivered.",
        },
        {
          id: "one-time-payment",
          question: "Is this a subscription or a one-time payment?",
          answer:
            "It is entirely a one-time payment. There are no monthly fees, no annual renewals, and no hidden charges. Once you buy, the license is yours for life and you pay nothing extra for support or updates.",
        },
        {
          id: "currency",
          question: "Are prices in BDT or USD?",
          answer:
            "The primary billing currency is Bangladeshi Taka (BDT), and BDT is shown as the main price throughout the shop. Some products also show a smaller USD figure for convenience — that is a separately declared price, not a converted exchange rate.",
        },
        {
          id: "payment-methods",
          question: "How can I pay?",
          answer:
            "Payment is completed at checkout through a secure payment gateway. As soon as payment is confirmed the order is created and delivery begins. We do not store your full card details.",
        },
        {
          id: "discount",
          question: "How do discounts work?",
          answer:
            "When a product has an active discount, the list price is shown struck through with the effective price beside it. The total you see at checkout is final — nothing is added on top.",
        },
      ],
    },
    {
      id: "trial",
      title: "Live trial",
      description: "How to run a product before you buy it.",
      entries: [
        {
          id: "how-trial-works",
          question: "How does the live trial work?",
          answer:
            "Request a trial from the product page with your name, email, and intended use. Once approved you get a time-limited running instance where both the shop and admin panel behave like the real product. The status link is emailed to you.",
        },
        {
          id: "trial-cost",
          question: "Does the trial cost anything?",
          answer:
            "No. Starting a trial requires no payment and no card details. A separate extend pack applies only if you want to extend the trial period.",
        },
        {
          id: "trial-vs-purchase",
          question: "Is what I see in the trial what I get after buying?",
          answer:
            "Yes. The trial runs from the same codebase, so features and behaviour match. The differences are that a trial contains demo data and has a time limit — after purchase you receive the source code and a lifetime license.",
        },
        {
          id: "trial-data",
          question: "Will the data I add during a trial be kept?",
          answer:
            "A trial is for evaluation, not for running a business. Demo data in the trial environment may be deleted after the trial ends, so do not keep anything important there.",
        },
      ],
    },
    {
      id: "license",
      title: "Licensing and ownership",
      description: "Where you can use it and what the limits are.",
      entries: [
        {
          id: "lifetime-meaning",
          question: "What does “lifetime license” actually mean?",
          answer:
            "The license has no expiry date and no renewal fee. Once you buy, the right to use the product is permanently yours, together with lifetime support and updates.",
        },
        {
          id: "how-many-domains",
          question: "How many domains can I use it on?",
          answer:
            "One license covers one production domain. Development and staging copies are fine as long as they are not open to customers. Running more than one live shop requires a separate license for each.",
        },
        {
          id: "can-i-modify",
          question: "Can I modify the source code?",
          answer:
            "Yes — you get the complete source code and can change the design, features, and branding to suit your business. Heavy modification can make future updates harder to apply, so we recommend using version control.",
        },
        {
          id: "can-i-resell",
          question: "Can I resell the code to someone else?",
          answer:
            "No. Reselling, redistributing, sublicensing, or uploading the code as a template on another marketplace is prohibited. Agencies using a product across multiple client projects need a separate license per project.",
        },
      ],
    },
    {
      id: "technical",
      title: "Technical and setup",
      description: "Hosting, domains, and getting ready to go live.",
      entries: [
        {
          id: "hosting-needed",
          question: "Do I need to arrange hosting and a domain?",
          answer:
            "Yes — going live requires your own domain and hosting, which are not included in the product price. We can advise on what kind of hosting suits a product, and server setup is available separately as a service.",
        },
        {
          id: "technical-skill",
          question: "Do I need programming knowledge to set it up?",
          answer:
            "Each product ships with step-by-step setup documentation, and setup guidance is included in support. If you are comfortable with basic hosting management you can do it yourself; if not, we help with the setup.",
        },
        {
          id: "mobile-seo",
          question: "Are the products mobile-friendly and SEO-friendly?",
          answer:
            "Yes. The shops are built with responsive layouts, fast loading, clean URL structure, meta tags, and structured data in mind. Search ranking still depends on your content, competition, and marketing, so no specific ranking can be guaranteed.",
        },
        {
          id: "bangla-support",
          question: "Can the shop run in both Bangla and English?",
          answer:
            "The products are built with Bangla and English content in mind, and Bangla typography renders correctly. Each product page states the detail of its bilingual support.",
        },
      ],
    },
    {
      id: "support",
      title: "Delivery and support",
      description: "How quickly you get it and what help follows.",
      entries: [
        {
          id: "delivery-time",
          question: "How quickly is the product delivered?",
          answer:
            "Products are digital, so delivery begins shortly after payment is confirmed. Delivery links and instructions go to the email address on the order, which is why an active email address matters.",
        },
        {
          id: "support-scope",
          question: "What does lifetime support cover?",
          answer:
            "Bug fixes in the product itself, installation and setup guidance, answers to questions about using the admin panel, and access to released updates and security patches. Building new features, redesign work, third-party integrations, and server administration are handled separately as custom work.",
        },
        {
          id: "response-time",
          question: "How fast is a support reply?",
          answer:
            "We aim to send a first reply within 24 hours on working days. Issues that make a product unusable get the highest priority.",
        },
        {
          id: "custom-work",
          question: "Can you build custom features or entirely new software?",
          answer:
            "Yes. Beyond the ready-made products we do customization, new feature development, DevOps, maintenance, and complete custom software built to your requirements. Tell us what you need and we will quote it.",
        },
        {
          id: "refund",
          question: "Are refunds available?",
          answer:
            "Because products are digital, refunds generally do not apply after delivery — which is exactly why we offer a live trial first. Refunds do apply for failed delivery, duplicate charges, or a fundamental mismatch with the product page description. The Refund & Cancellation Policy page has the detail.",
        },
      ],
    },
  ],
};

export function faqGroups(locale: Locale): FaqGroup[] {
  return FAQ[locale];
}

/** Flat list — for FAQPage structured data. */
export function faqFlat(locale: Locale): FaqEntry[] {
  return FAQ[locale].flatMap((group) => group.entries);
}

/** The highest-intent questions, for the home page teaser section. */
export function faqHighlights(locale: Locale): FaqEntry[] {
  const wanted = [
    "what-is-included",
    "one-time-payment",
    "how-trial-works",
    "lifetime-meaning",
    "hosting-needed",
    "support-scope",
  ];
  const all = faqFlat(locale);
  return wanted
    .map((id) => all.find((entry) => entry.id === id))
    .filter((entry): entry is FaqEntry => Boolean(entry));
}
