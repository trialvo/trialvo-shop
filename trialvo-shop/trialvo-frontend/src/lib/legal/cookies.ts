import { LEGAL_UPDATED, type LocalizedLegalDoc } from "@/lib/legal/types";

export const COOKIES_DOC: LocalizedLegalDoc = {
  bn: {
    title: "কুকি নীতি",
    updated: LEGAL_UPDATED.bn,
    intro:
      "কুকি ও ব্রাউজার স্টোরেজ হলো ছোট ছোট তথ্য যা সাইট আপনার ব্রাউজারে রাখে, যাতে সাইট ঠিকভাবে কাজ করে এবং আপনার পছন্দ মনে রাখতে পারে। এই পেজে বলা আছে Trialvo Shop কী কী রাখে, কেন রাখে এবং আপনি কীভাবে তা নিয়ন্ত্রণ করবেন।",
    sections: [
      {
        id: "types",
        heading: "১. আমরা কী ধরনের স্টোরেজ ব্যবহার করি",
        blocks: [
          {
            type: "list",
            items: [
              "অত্যাবশ্যকীয়: সাইট চালানোর জন্য প্রয়োজনীয় — যেমন অ্যাডমিন লগইন সেশন ও নিরাপত্তা টোকেন। এগুলো বন্ধ করা যায় না, কারণ এগুলো ছাড়া সেবা কাজ করবে না।",
              "পছন্দ সংরক্ষণ: ভাষা (বাংলা/ইংরেজি) ও থিম নির্বাচনের মতো সেটিংস মনে রাখে, যাতে প্রতিবার নতুন করে বাছতে না হয়।",
              "কার্যকারিতা: ফর্মের অবস্থা ও ক্যাশে করা ডেটা রাখে, যাতে পেজ দ্রুত লোড হয় এবং তথ্য হারিয়ে না যায়।",
              "বিশ্লেষণ (প্রযোজ্য হলে): কোন পেজ কত দেখা হচ্ছে তার সমষ্টিগত পরিসংখ্যান — ব্যক্তি শনাক্ত করার জন্য নয়।",
            ],
          },
        ],
      },
      {
        id: "no-ads",
        heading: "২. বিজ্ঞাপন ও ট্র্যাকিং",
        blocks: [
          {
            type: "p",
            text: "আমরা আমাদের সাইটে বিজ্ঞাপন দেখাই না এবং বিজ্ঞাপনী উদ্দেশ্যে ক্রস-সাইট প্রোফাইলিং করি না। আপনার ব্রাউজিং ইতিহাস তৃতীয় পক্ষের বিজ্ঞাপনদাতাদের কাছে বিক্রি করা হয় না।",
          },
        ],
      },
      {
        id: "third-party",
        heading: "৩. তৃতীয় পক্ষের কুকি",
        blocks: [
          {
            type: "p",
            text: "পেমেন্ট সম্পন্ন করার সময় আপনি পেমেন্ট গেটওয়ের পেজে যেতে পারেন, যেখানে তাদের নিজস্ব কুকি সেট হতে পারে — এটি লেনদেনের নিরাপত্তা ও প্রতারণা প্রতিরোধের জন্য প্রয়োজন। ভিডিও বা এমবেড করা কনটেন্ট দেখলে সেই প্রোভাইডারও কুকি রাখতে পারে। এসব কুকি সংশ্লিষ্ট প্রতিষ্ঠানের নিজস্ব নীতির অধীন।",
          },
        ],
      },
      {
        id: "duration",
        heading: "৪. কতদিন থাকে",
        blocks: [
          {
            type: "list",
            items: [
              "সেশন কুকি: ব্রাউজার বন্ধ করলেই মুছে যায়।",
              "লগইন সেশন: নির্দিষ্ট সময় পর স্বয়ংক্রিয়ভাবে শেষ হয়ে যায় এবং পুনরায় লগইন লাগে।",
              "পছন্দ সংরক্ষণ: আপনি নিজে মুছে না ফেলা পর্যন্ত ব্রাউজারে থেকে যায়।",
            ],
          },
        ],
      },
      {
        id: "control",
        heading: "৫. কীভাবে নিয়ন্ত্রণ করবেন",
        blocks: [
          {
            type: "p",
            text: "সব আধুনিক ব্রাউজারে কুকি দেখা, ব্লক করা বা মুছে ফেলার অপশন আছে — সাধারণত Settings → Privacy বিভাগে। আপনি চাইলে শুধু এই সাইটের ডেটাও মুছতে পারেন।",
          },
          {
            type: "note",
            text: "অত্যাবশ্যকীয় কুকি ব্লক করলে অ্যাডমিন লগইন, ভাষা নির্বাচন বা চেকআউটের মতো অংশ সঠিকভাবে কাজ করবে না।",
          },
        ],
      },
      {
        id: "changes",
        heading: "৬. নীতির পরিবর্তন",
        blocks: [
          {
            type: "p",
            text: "নতুন কোনো সেবা যুক্ত হলে এই নীতি হালনাগাদ করা হবে এবং পরিবর্তিত সংস্করণ এই পেজে প্রকাশ করা হবে।",
          },
        ],
      },
    ],
  },

  en: {
    title: "Cookie Policy",
    updated: LEGAL_UPDATED.en,
    intro:
      "Cookies and browser storage are small pieces of data a site keeps in your browser so it can work correctly and remember your choices. This page explains what Trialvo Shop stores, why, and how you can control it.",
    sections: [
      {
        id: "types",
        heading: "1. What we store",
        blocks: [
          {
            type: "list",
            items: [
              "Strictly necessary: required to run the site — admin login sessions and security tokens. These cannot be switched off because the service will not work without them.",
              "Preferences: remembers settings such as language (Bangla/English) and theme so you do not have to choose again on every visit.",
              "Functional: keeps form state and cached data so pages load faster and information is not lost.",
              "Analytics (where used): aggregate counts of which pages are viewed — not used to identify individuals.",
            ],
          },
        ],
      },
      {
        id: "no-ads",
        heading: "2. Advertising and tracking",
        blocks: [
          {
            type: "p",
            text: "We do not show advertising on this site and we do not build cross-site profiles for advertising. Your browsing history is not sold to third-party advertisers.",
          },
        ],
      },
      {
        id: "third-party",
        heading: "3. Third-party cookies",
        blocks: [
          {
            type: "p",
            text: "When completing a payment you may be taken to the payment gateway's own pages, which can set their own cookies for transaction security and fraud prevention. Watching an embedded video may also let that provider set cookies. Those cookies are governed by the relevant company's own policy.",
          },
        ],
      },
      {
        id: "duration",
        heading: "4. How long they last",
        blocks: [
          {
            type: "list",
            items: [
              "Session cookies: removed as soon as you close the browser.",
              "Login sessions: expire automatically after a set period and require signing in again.",
              "Preferences: stay in your browser until you clear them.",
            ],
          },
        ],
      },
      {
        id: "control",
        heading: "5. How to control them",
        blocks: [
          {
            type: "p",
            text: "Every modern browser lets you view, block, or delete cookies, usually under Settings → Privacy. You can also clear data for this site only.",
          },
          {
            type: "note",
            text: "Blocking strictly necessary cookies will stop parts of the site such as admin login, language selection, and checkout from working correctly.",
          },
        ],
      },
      {
        id: "changes",
        heading: "6. Changes to this policy",
        blocks: [
          {
            type: "p",
            text: "We will update this policy if we add new services, and publish the revised version on this page.",
          },
        ],
      },
    ],
  },
};
